import { Skeleton } from "@/components/skeleton"

export function DashboardShellSkeleton({
  sessionOnly = false,
}: {
  sessionOnly?: boolean
}) {
  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-shell-skeleton">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-16 w-full border border-border/70 bg-card/80" />
        {!sessionOnly ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 w-full rounded-lg border border-border/70 bg-card/80"
                />
              ))}
            </div>

            <div className="grid gap-5 border-b border-border/70 pb-6 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 bg-background/65" />
                <Skeleton className="h-11 w-full rounded-lg border border-border/70 bg-card/80" />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-background/65" />
                    <Skeleton className="h-11 w-full rounded-lg border border-border/70 bg-card/80" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="overflow-hidden rounded-lg border border-border/70 bg-card/50"
                >
                  <div className="grid gap-4 border-b border-border/70 px-4 py-4 md:grid-cols-[1.1fr_1fr_auto] md:items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-12 bg-background/65" />
                      <Skeleton className="h-8 w-36 bg-background/65" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16 bg-background/65" />
                      <Skeleton className="h-5 w-32 bg-background/65" />
                    </div>
                    <Skeleton className="h-5 w-14 justify-self-end bg-background/65" />
                  </div>

                  <div className="border-b border-border/70 px-4 py-3">
                    <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.8fr_0.8fr]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-3 w-20 bg-background/65" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-0">
                    {Array.from({ length: 3 }).map((_, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="grid gap-4 border-b border-border/70 p-4 last:border-b-0 lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.8fr_0.8fr] lg:items-center"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-20 bg-background/65" />
                          <Skeleton className="h-4 w-28 bg-background/65" />
                        </div>
                        {Array.from({ length: 4 }).map((_, cellIndex) => (
                          <div key={cellIndex} className="space-y-2">
                            <Skeleton className="h-3 w-16 bg-background/65" />
                            <Skeleton className="h-5 w-14 bg-background/65" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
