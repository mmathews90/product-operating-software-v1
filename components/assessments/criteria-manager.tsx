"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createCriterion,
  updateCriterion,
  deleteCriterion,
} from "@/lib/actions/criteria";
import type { AssessmentCriterion, Dimension } from "@/lib/types/assessments";
import { DIMENSION_LABELS } from "@/lib/types/assessments";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function CriteriaManager({
  criteria,
}: {
  criteria: AssessmentCriterion[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this criterion?")) return;
    await deleteCriterion(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assessment Criteria</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Criterion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Criterion</DialogTitle>
            </DialogHeader>
            <CriterionForm
              onSubmit={async (fd) => {
                await createCriterion(fd);
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
            <TableHead>Dimension</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[60px]">Order</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteria.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{DIMENSION_LABELS[c.dimension]}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                {c.description}
              </TableCell>
              <TableCell className="text-center">{c.sort_order}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Dialog
                    open={editingId === c.id}
                    onOpenChange={(open) => setEditingId(open ? c.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Criterion</DialogTitle>
                      </DialogHeader>
                      <CriterionForm
                        defaultValues={c}
                        onSubmit={async (fd) => {
                          fd.set("id", c.id);
                          await updateCriterion(fd);
                          setEditingId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
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

function CriterionForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: AssessmentCriterion;
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
        <Label htmlFor="crit-name">Name</Label>
        <Input
          id="crit-name"
          name="name"
          required
          defaultValue={defaultValues?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="crit-dimension">Dimension</Label>
        <Select
          name="dimension"
          defaultValue={defaultValues?.dimension || "product_knowledge"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(DIMENSION_LABELS) as [Dimension, string][]
            ).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="crit-description">Description</Label>
        <Textarea
          id="crit-description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="crit-sort">Sort Order</Label>
        <Input
          id="crit-sort"
          name="sort_order"
          type="number"
          defaultValue={defaultValues?.sort_order ?? 0}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : defaultValues ? "Update" : "Add Criterion"}
      </Button>
    </form>
  );
}
