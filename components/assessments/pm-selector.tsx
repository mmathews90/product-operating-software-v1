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
}: {
  productManagers: ProductManager[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPmId = searchParams.get("pmId") || "";

  return (
    <Select
      value={selectedPmId}
      onValueChange={(value) => {
        router.push(`/protected/assessments?pmId=${value}`);
      }}
    >
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a PM" />
      </SelectTrigger>
      <SelectContent>
        {productManagers.map((pm) => (
          <SelectItem key={pm.id} value={pm.id}>
            {pm.name}
            {pm.role && (
              <span className="text-muted-foreground ml-2">· {pm.role}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
