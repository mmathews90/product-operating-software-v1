"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/lib/types/assessments";
import { Plus, ClipboardList } from "lucide-react";
import { Pagination } from "./pagination";

interface AssessmentRow extends Assessment {
  pm_name: string;
}

export function AssessmentTable({
  assessments,
  total,
  page,
  pageSize,
  pmId,
}: {
  assessments: AssessmentRow[];
  total: number;
  page: number;
  pageSize: number;
  pmId?: string;
}) {
  const newHref = pmId
    ? `/protected/assessments/new?pmId=${pmId}`
    : "/protected/assessments/new";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} assessment{total !== 1 ? "s" : ""}
        </p>
        <Link href={newHref}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Assessment
          </Button>
        </Link>
      </div>

      {assessments.length === 0 && page === 1 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
          <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No assessments yet.</p>
          <Link href={newHref}>
            <Button size="sm" className="mt-3">
              Create First Assessment
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PM</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/protected/assessments/${assessment.id}`}
                        className="block font-medium"
                      >
                        {assessment.pm_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/protected/assessments/${assessment.id}`}
                        className="block"
                      >
                        {assessment.quarter}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/protected/assessments/${assessment.id}`}
                        className="block"
                      >
                        <Badge
                          variant={
                            assessment.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {assessment.status === "completed"
                            ? "Completed"
                            : "Draft"}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/protected/assessments/${assessment.id}`}
                        className="block text-muted-foreground"
                      >
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <Link
                        href={`/protected/assessments/${assessment.id}`}
                        className="block text-muted-foreground truncate"
                      >
                        {assessment.notes || "\u2014"}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            pmId={pmId}
          />
        </>
      )}
    </div>
  );
}
