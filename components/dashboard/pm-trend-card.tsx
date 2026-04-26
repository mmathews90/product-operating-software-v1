import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendChart } from "@/components/assessments/trend-chart";
import type { ProductManager, DimensionTrendPoint } from "@/lib/types/assessments";
import { ClipboardList } from "lucide-react";

export function PMTrendCard({
  pm,
  trends,
}: {
  pm: ProductManager;
  trends: DimensionTrendPoint[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{pm.name}</CardTitle>
          {pm.role && (
            <span className="text-sm text-muted-foreground">{pm.role}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {trends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No assessments yet
            </p>
          </div>
        ) : (
          <Link href={`/protected/assessments/trends?pmId=${pm.id}`}>
            <TrendChart data={trends} height={250} />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
