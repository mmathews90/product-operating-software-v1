import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/lib/types/assessments";
import { ClipboardList, Plus } from "lucide-react";

export function AssessmentList({
  assessments,
  pmId,
  pmName,
}: {
  assessments: Assessment[];
  pmId: string;
  pmName: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assessments for {pmName}</h2>
        <div className="flex gap-2">
          <Link href={`/protected/assessments/trends?pmId=${pmId}`}>
            <Button variant="outline" size="sm">
              View Trends
            </Button>
          </Link>
          <Link href={`/protected/assessments/new?pmId=${pmId}`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No assessments yet for {pmName}.
            </p>
            <Link href={`/protected/assessments/new?pmId=${pmId}`}>
              <Button size="sm" className="mt-3">
                Create First Assessment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {assessments.map((assessment) => (
            <Link
              key={assessment.id}
              href={`/protected/assessments/${assessment.id}`}
            >
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {assessment.quarter}
                    </CardTitle>
                    <Badge variant="outline">
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  {assessment.notes && (
                    <CardDescription className="line-clamp-2">
                      {assessment.notes}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
