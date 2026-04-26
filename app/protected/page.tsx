import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllPMsTrendData } from "@/lib/actions/assessments";
import { PMTrendCard } from "@/components/dashboard/pm-trend-card";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const pmTrends = await getAllPMsTrendData();

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Skill trends across your product managers.
        </p>
      </div>

      {pmTrends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Product Managers Yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Add your product managers in{" "}
            <Link
              href="/protected/admin/product-managers"
              className="underline hover:text-foreground"
            >
              Admin &rarr; Product Managers
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pmTrends.map(({ pm, trends }) => (
            <PMTrendCard key={pm.id} pm={pm} trends={trends} />
          ))}
        </div>
      )}
    </div>
  );
}
