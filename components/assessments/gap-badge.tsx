import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GapBadge({
  target,
  current,
}: {
  target: number;
  current: number;
}) {
  const gap = target - current;

  const variant =
    gap <= 0
      ? "default"
      : gap <= 2
        ? "secondary"
        : "destructive";

  const label =
    gap <= 0
      ? "On track"
      : gap <= 2
        ? `Gap: ${gap}`
        : `Gap: ${gap}`;

  return (
    <Badge
      variant={variant}
      className={cn(
        gap <= 0 && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        gap > 0 && gap <= 2 && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      )}
    >
      {label}
    </Badge>
  );
}
