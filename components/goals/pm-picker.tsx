"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import type { ProductManager } from "@/lib/types/assessments";

export function PMPicker({
  productManagers,
}: {
  productManagers: ProductManager[];
}) {
  const router = useRouter();

  if (productManagers.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {productManagers.map((pm) => (
        <Card
          key={pm.id}
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => router.push(`/protected/goals?pmId=${pm.id}`)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-medium shrink-0">
              {pm.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{pm.name}</p>
              {pm.level && (
                <p className="text-xs text-muted-foreground truncate">
                  {pm.level.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
