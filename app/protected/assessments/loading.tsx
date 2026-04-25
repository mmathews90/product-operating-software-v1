export default function Loading() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-4 w-80 bg-muted rounded" />
      <div className="flex gap-3">
        <div className="h-10 w-60 bg-muted rounded" />
        <div className="h-10 w-28 bg-muted rounded" />
      </div>
      <div className="space-y-3 mt-4">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  );
}
