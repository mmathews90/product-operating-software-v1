"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createProductManager,
  updateProductManager,
  deleteProductManager,
} from "@/lib/actions/product-managers";
import type { ProductManager, PMLevel } from "@/lib/types/assessments";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function PMManager({
  productManagers,
  levels,
}: {
  productManagers: ProductManager[];
  levels: PMLevel[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Remove this PM? Their assessments will also be deleted."))
      return;
    await deleteProductManager(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Product Managers</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add PM
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product Manager</DialogTitle>
            </DialogHeader>
            <PMForm
              levels={levels}
              onSubmit={async (fd) => {
                await createProductManager(fd);
                setAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {productManagers.map((pm) => (
            <TableRow key={pm.id}>
              <TableCell className="font-medium">{pm.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {pm.role}
              </TableCell>
              <TableCell>
                {pm.level && <Badge variant="outline">{pm.level.name}</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Dialog
                    open={editingId === pm.id}
                    onOpenChange={(open) => setEditingId(open ? pm.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Product Manager</DialogTitle>
                      </DialogHeader>
                      <PMForm
                        defaultValues={pm}
                        levels={levels}
                        onSubmit={async (fd) => {
                          fd.set("id", pm.id);
                          await updateProductManager(fd);
                          setEditingId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pm.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PMForm({
  defaultValues,
  levels,
  onSubmit,
}: {
  defaultValues?: ProductManager;
  levels: PMLevel[];
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(fd: FormData) {
    setLoading(true);
    try {
      await onSubmit(fd);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pm-name">Name</Label>
        <Input
          id="pm-name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="e.g. Jane Smith"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pm-role">Role (optional)</Label>
        <Input
          id="pm-role"
          name="role"
          defaultValue={defaultValues?.role ?? ""}
          placeholder="e.g. Growth Pod"
        />
      </div>
      {levels.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="pm-level">Level</Label>
          <Select
            name="level_id"
            defaultValue={defaultValues?.level_id ?? "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No level</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : defaultValues ? "Update" : "Add PM"}
      </Button>
    </form>
  );
}
