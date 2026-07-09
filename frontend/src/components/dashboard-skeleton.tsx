import { Skeleton } from "@/components/skeleton"

export function DashboardShellSkeleton({
  sessionOnly = false,
}: {
  sessionOnly?: boolean
}) {
  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/0.14,_transparent_32%),linear-gradient(180deg,var(--color-background),color-mix(in_oklch,var(--color-background),white_22%))] px-4 py-6 sm:px-6"
      data-testid="dashboard-shell-skeleton"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Skeleton className="mx-auto h-16 w-full max-w-4xl rounded-full" />
        <Skeleton className="h-28 w-full rounded-[32px]" />
        {!sessionOnly && (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-[28px]" />
              <Skeleton className="h-24 w-full rounded-[28px]" />
              <Skeleton className="h-24 w-full rounded-[28px]" />
            </div>
            <Skeleton className="h-[26rem] w-full rounded-[32px]" />
          </div>
        )}
      </div>
    </div>
  )
}
