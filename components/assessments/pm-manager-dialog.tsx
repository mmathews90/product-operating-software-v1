"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProductManager, deleteProductManager } from "@/lib/actions/product-managers";
import type { ProductManager } from "@/lib/types/assessments";
import { Plus, Trash2 } from "lucide-react";

export function PMManagerDialog({
  productManagers,
}: {
  productManagers: ProductManager[];
}) {
  const [open, setOpen] = useState(false);
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
    if (!confirm("Remove this PM? Their assessments will also be deleted.")) return;
    await deleteProductManager(id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Manage PMs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Product Managers</DialogTitle>
        </DialogHeader>

        {productManagers.length > 0 && (
          <div className="space-y-2 mb-4">
            {productManagers.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-2 rounded border"
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

        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Jane Smith" />
          </div>
          <div>
            <Label htmlFor="role">Role (optional)</Label>
            <Input id="role" name="role" placeholder="e.g. Senior PM" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add PM"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
