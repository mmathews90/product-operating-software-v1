import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getAllObjectives } from "@/lib/actions/goals";
import { PMPicker } from "@/components/goals/pm-picker";
import { GoalsList } from "@/components/goals/goals-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function GoalsForPM({ pmId }: { pmId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [productManagers, allObjectives] = await Promise.all([
    getProductManagers(),
    getAllObjectives(),
  ]);

  const pm = productManagers.find((p) => p.id === pmId);
  const objectives = allObjectives.filter((o) => o.pm_id === pmId);

  return (
    <>
      <Link
        href="/protected/goals"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        All PMs
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          Goals {pm ? `— ${pm.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          OKR-based development goals linked to skill assessments.
        </p>
      </div>

      <GoalsList objectives={objectives} />
    </>
  );
}

async function PMPickerSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const productManagers = await getProductManagers();

  return <PMPicker productManagers={productManagers} />;
}

export default function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  return (
    <Suspense>
      <GoalsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GoalsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  const { pmId } = await searchParams;

  if (pmId) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6">
        <GoalsForPM pmId={pmId} />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a product manager to view and manage their goals.
        </p>
      </div>

      <PMPickerSection />
    </div>
  );
}
