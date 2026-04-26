"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProductManager,
  deleteProductManager,
} from "@/lib/actions/product-managers";
import type { ProductManager } from "@/lib/types/assessments";
import { Trash2 } from "lucide-react";

export function PMManager({
  productManagers,
}: {
  productManagers: ProductManager[];
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createProductManager(formData);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this PM? Their assessments will also be deleted."))
      return;
    await deleteProductManager(id);
  }

  return (
    <div className="space-y-6">
      {productManagers.length > 0 && (
        <div className="space-y-2">
          {productManagers.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <span className="font-medium">{pm.name}</span>
                {pm.role && (
                  <span className="text-muted-foreground text-sm ml-2">
                    {pm.role}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(pm.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Product Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="role">Role (optional)</Label>
              <Input id="role" name="role" placeholder="e.g. Senior PM" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add PM"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
