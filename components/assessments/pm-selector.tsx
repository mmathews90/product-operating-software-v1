"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductManager } from "@/lib/types/assessments";

export function PMSelector({
  productManagers,
  basePath = "/protected/assessments",
}: {
  productManagers: ProductManager[];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPmId = searchParams.get("pmId") || "all";

  return (
    <Select
      value={selectedPmId}
      onValueChange={(value) => {
        if (value === "all") {
          router.push(basePath);
        } else {
          router.push(`${basePath}?pmId=${value}`);
        }
      }}
    >
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="All PMs" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All PMs</SelectItem>
        {productManagers.map((pm) => (
          <SelectItem key={pm.id} value={pm.id}>
            {pm.name}
            {pm.level && (
              <span className="text-muted-foreground ml-2">· {pm.level.name}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
