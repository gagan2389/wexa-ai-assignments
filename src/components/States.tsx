export function EmptyState({
  emoji = "🍽️",
  title,
  description,
}: {
  emoji?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        {emoji}
      </span>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground-muted">{description}</p>}
    </div>
  );
}

export function ErrorState({
  title = "The database is unreachable",
  description = "CognoDB may be paused, unreachable, or the connection details are misconfigured. Check your environment variables and that your instance is running.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger-soft bg-danger-soft px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <p className="text-base font-medium text-danger">{title}</p>
      <p className="max-w-md text-sm text-danger/80">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-full border border-danger/30 bg-white px-4 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 h-6 w-2/3 rounded bg-surface-muted" />
      <div className="mb-2 h-3 w-full rounded bg-surface-muted" />
      <div className="mb-4 h-3 w-4/5 rounded bg-surface-muted" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-surface-muted" />
        <div className="h-5 w-16 rounded-full bg-surface-muted" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
