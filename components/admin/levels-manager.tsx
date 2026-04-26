"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  createPMLevel,
  updatePMLevel,
  deletePMLevel,
  seedDefaultLevels,
} from "@/lib/actions/pm-levels";
import type { PMLevel } from "@/lib/types/assessments";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function LevelsManager({ levels }: { levels: PMLevel[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this level? PMs using it will have their level cleared."))
      return;
    await deletePMLevel(id);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDefaultLevels();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">PM Levels</h2>
        <div className="flex gap-2">
          {levels.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeding ? "Seeding..." : "Seed Defaults"}
            </Button>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Level
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Level</DialogTitle>
              </DialogHeader>
              <LevelForm
                onSubmit={async (fd) => {
                  await createPMLevel(fd);
                  setAddOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-[60px]">Order</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels.map((level) => (
            <TableRow key={level.id}>
              <TableCell className="font-medium">{level.name}</TableCell>
              <TableCell className="text-center">{level.sort_order}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Dialog
                    open={editingId === level.id}
                    onOpenChange={(open) =>
                      setEditingId(open ? level.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Level</DialogTitle>
                      </DialogHeader>
                      <LevelForm
                        defaultValues={level}
                        onSubmit={async (fd) => {
                          fd.set("id", level.id);
                          await updatePMLevel(fd);
                          setEditingId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(level.id)}
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

function LevelForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: PMLevel;
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
        <Label htmlFor="level-name">Name</Label>
        <Input
          id="level-name"
          name="name"
          required
          defaultValue={defaultValues?.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="level-sort">Sort Order</Label>
        <Input
          id="level-sort"
          name="sort_order"
          type="number"
          defaultValue={defaultValues?.sort_order ?? 0}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : defaultValues ? "Update" : "Add Level"}
      </Button>
    </form>
  );
}
