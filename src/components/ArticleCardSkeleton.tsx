export function ArticleCardSkeleton() {
  return (
    <div className="rounded-xl bg-card shadow-soft overflow-hidden animate-pulse">
      <div className="h-52 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}
