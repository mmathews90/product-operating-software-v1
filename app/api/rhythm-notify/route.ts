import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role client (no user session for cron-triggered requests)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Find auto-created assessments that haven't been notified yet
  const { data: assessments, error } = await supabase
    .from("assessments")
    .select(
      `
      id,
      cadence,
      user_id,
      pm_id,
      product_managers (name),
      user_settings:user_settings!assessments_user_id_fkey (notification_email)
    `
    )
    .eq("auto_created", true)
    .is("notified_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!assessments || assessments.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user
  const byUser = new Map<
    string,
    { email: string; cadence: string; pmNames: string[]; ids: string[] }
  >();

  for (const a of assessments as any[]) {
    const email = a.user_settings?.notification_email;
    if (!email) continue;

    if (!byUser.has(a.user_id)) {
      byUser.set(a.user_id, {
        email,
        cadence: a.cadence,
        pmNames: [],
        ids: [],
      });
    }
    const entry = byUser.get(a.user_id)!;
    entry.pmNames.push(a.product_managers?.name ?? "Unknown PM");
    entry.ids.push(a.id);
  }

  let sent = 0;

  for (const [, group] of byUser) {
    try {
      await resend.emails.send({
        from: "PM Assessments <productoperatingsoftware@updates.moderninsurer.com>",
        to: group.email,
        subject: `${group.pmNames.length} draft assessment${group.pmNames.length > 1 ? "s" : ""} ready for ${group.cadence}`,
        html: `
          <p>Draft assessments have been created for the following PMs:</p>
          <ul>${group.pmNames.map((n) => `<li>${n}</li>`).join("")}</ul>
          <p><a href="${appUrl}/protected/assessments">Review assessments</a></p>
        `,
      });

      // Mark as notified
      await supabase
        .from("assessments")
        .update({ notified_at: new Date().toISOString() })
        .in("id", group.ids);

      sent++;
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  }

  return NextResponse.json({ sent });
}
