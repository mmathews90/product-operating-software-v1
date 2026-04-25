import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrendData } from "@/lib/actions/assessments";
import { getProductManagers } from "@/lib/actions/product-managers";
import { TrendChart } from "@/components/assessments/trend-chart";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  const { pmId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  if (!pmId) redirect("/protected/assessments");

  const [productManagers, trendData] = await Promise.all([
    getProductManagers(),
    getTrendData(pmId),
  ]);

  const pm = productManagers.find((p) => p.id === pmId);

  if (!pm) redirect("/protected/assessments");

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href={`/protected/assessments?pmId=${pmId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assessments
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Trends — {pm.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Average scores by dimension over time. Solid lines show current
          scores, dashed lines show targets.
        </p>
      </div>

      {trendData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Trend Data Yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Complete at least one assessment to see trends. Multiple quarters
            will show progression over time.
          </p>
        </div>
      ) : (
        <TrendChart data={trendData} />
      )}
    </div>
  );
}
