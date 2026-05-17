export function ArticleCardSkeleton() {
  return (
    <div className="bg-card border-b border-border sm:border sm:rounded-xl sm:shadow-soft overflow-hidden animate-pulse -mx-3 sm:mx-0">
      <div className="p-4 flex gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
          <div className="h-5 w-4/5 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 w-14 bg-muted rounded" />
            <div className="h-5 w-14 bg-muted rounded" />
            <div className="h-5 w-14 bg-muted rounded" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="hidden sm:block h-20 w-28 bg-muted rounded-md shrink-0" />
      </div>
    </div>
  );
}
