"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DimensionTrendPoint, Dimension } from "@/lib/types/assessments";
import { DIMENSION_LABELS } from "@/lib/types/assessments";

const DIMENSION_COLORS: Record<Dimension, string> = {
  product_knowledge: "hsl(var(--chart-1))",
  process_knowledge: "hsl(var(--chart-2))",
  people_skills: "hsl(var(--chart-3))",
};

export function TrendChart({ data }: { data: DimensionTrendPoint[] }) {
  // Transform data into recharts format: { quarter, product_knowledge, process_knowledge, people_skills, ... }
  const quarters = [...new Set(data.map((d) => d.quarter))].sort();

  const chartData = quarters.map((quarter) => {
    const point: Record<string, string | number> = { quarter };
    for (const d of data.filter((d) => d.quarter === quarter)) {
      point[`${d.dimension}_current`] = d.avg_current;
      point[`${d.dimension}_target`] = d.avg_target;
    }
    return point;
  });

  const dimensions = Object.keys(DIMENSION_LABELS) as Dimension[];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="quarter" className="text-xs" />
          <YAxis domain={[1, 10]} className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          {dimensions.map((dim) => (
            <Line
              key={`${dim}_current`}
              type="monotone"
              dataKey={`${dim}_current`}
              name={`${DIMENSION_LABELS[dim]} (Current)`}
              stroke={DIMENSION_COLORS[dim]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
          {dimensions.map((dim) => (
            <Line
              key={`${dim}_target`}
              type="monotone"
              dataKey={`${dim}_target`}
              name={`${DIMENSION_LABELS[dim]} (Target)`}
              stroke={DIMENSION_COLORS[dim]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
