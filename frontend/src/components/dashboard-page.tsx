import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { startTransition, useDeferredValue, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/badge"
import { DashboardShellSkeleton } from "@/components/dashboard-skeleton"
import { FloatingNavbar } from "@/components/floating-navbar"
import { Skeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import {
  getDataQualityIssueDetail,
  getDataQualityIssues,
  getExceptionDetail,
  getExceptions,
  updateDataQualityIssueStatus,
  updateExceptionStatus,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import type {
  DataQualityIssue,
  ExceptionItem,
  TrendPoint,
  User,
} from "@/types"

type Mode = "exceptions" | "data-quality"

type DashboardPageProps = {
  currentUser: User
  onLogout: () => Promise<void>
}

export function DashboardPage({
  currentUser,
  onLogout,
}: DashboardPageProps) {
  const [mode, setMode] = useState<Mode>("exceptions")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("open")
  const [severityFilter, setSeverityFilter] = useState<string>("")
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("")
  const [productInput, setProductInput] = useState("")
  const deferredProductCode = useDeferredValue(productInput.trim())

  const exceptionsQuery = useQuery({
    queryKey: ["exceptions", deferredProductCode, severityFilter, statusFilter],
    queryFn: () =>
      getExceptions({
        productCode: deferredProductCode || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
      }),
  })

  const issuesQuery = useQuery({
    queryKey: ["data-quality-issues", deferredProductCode, issueTypeFilter, statusFilter],
    queryFn: () =>
      getDataQualityIssues({
        productCode: deferredProductCode || undefined,
        issueType: issueTypeFilter || undefined,
        status: statusFilter || undefined,
      }),
    enabled: mode === "data-quality",
  })

  const detailExceptionQuery = useQuery({
    queryKey: ["exception-detail", selectedId],
    queryFn: () => getExceptionDetail(selectedId as string),
    enabled: mode === "exceptions" && Boolean(selectedId),
  })

  const detailIssueQuery = useQuery({
    queryKey: ["data-quality-issue-detail", selectedId],
    queryFn: () => getDataQualityIssueDetail(selectedId as string),
    enabled: mode === "data-quality" && Boolean(selectedId),
  })

  const currentItems = mode === "exceptions" ? exceptionsQuery.data : issuesQuery.data
  const isLoadingActiveView =
    mode === "exceptions" ? exceptionsQuery.isPending : issuesQuery.isPending

  const groupedItems = useMemo(() => groupByDate(currentItems || []), [currentItems])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/0.18,_transparent_28%),linear-gradient(180deg,var(--color-background),color-mix(in_oklch,var(--color-background),white_28%))] px-4 py-6 sm:px-6">
      <FloatingNavbar
        eyebrow={`Signed in as ${currentUser.username}`}
        title="Destila Operations Inbox"
        primaryActionLabel="Jump to filters"
        onPrimaryAction={() => {
          const element = document.getElementById("dashboard-filters")
          element?.scrollIntoView({ behavior: "smooth", block: "center" })
        }}
        onLogout={onLogout}
      />

      <div className="mx-auto mt-6 max-w-7xl space-y-6">
        <header className="rounded-[36px] border border-white/10 bg-card/88 p-6 shadow-2xl shadow-black/8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Operations workspace
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Operations Inbox
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Scan daily production misses, inspect the seven-day trend, and
                switch into data-quality review when bad source rows need manual
                follow-up.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Default view"
                value="Deficit exceptions"
                tone="high"
              />
              <SummaryCard
                label="Secondary mode"
                value="Data quality issues"
                tone="warning"
              />
              <SummaryCard
                label="Session"
                value={currentUser.role}
                tone="success"
              />
            </div>
          </div>
        </header>

        <section
          id="dashboard-filters"
          className="rounded-[32px] border border-white/10 bg-card/90 p-5 shadow-xl shadow-black/8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  startTransition(() => {
                    setMode("exceptions")
                    setSelectedId(null)
                  })
                }
                variant={mode === "exceptions" ? "default" : "outline"}
              >
                Exceptions
              </Button>
              <Button
                onClick={() =>
                  startTransition(() => {
                    setMode("data-quality")
                    setSelectedId(null)
                  })
                }
                variant={mode === "data-quality" ? "default" : "outline"}
              >
                Data quality
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Product">
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                  placeholder="FG-011"
                  value={productInput}
                  onChange={(event) => setProductInput(event.target.value.toUpperCase())}
                />
              </FilterField>

              {mode === "exceptions" ? (
                <FilterField label="Severity">
                  <select
                    className="h-11 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                    value={severityFilter}
                    onChange={(event) => setSeverityFilter(event.target.value)}
                  >
                    <option value="">All severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </FilterField>
              ) : (
                <FilterField label="Issue type">
                  <select
                    className="h-11 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                    value={issueTypeFilter}
                    onChange={(event) => setIssueTypeFilter(event.target.value)}
                  >
                    <option value="">All issues</option>
                    <option value="blank_planned_units">Blank planned units</option>
                    <option value="duplicate_plan_key">Duplicate plan keys</option>
                    <option value="unmatched_plan_row">Unmatched plan rows</option>
                    <option value="unmatched_actual_row">Unmatched actual rows</option>
                    <option value="invalid_plan_date">Invalid plan dates</option>
                    <option value="invalid_actual_date">Invalid actual dates</option>
                  </select>
                </FilterField>
              )}

              <FilterField label="Status">
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </select>
              </FilterField>

              <FilterField label="Scope">
                <div className="flex h-11 items-center rounded-2xl border border-border bg-background/75 px-4 text-sm text-muted-foreground">
                  {mode === "exceptions" ? "Deficit triage" : "Data review"}
                </div>
              </FilterField>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="rounded-[32px] border border-white/10 bg-card/92 p-5 shadow-2xl shadow-black/8">
            {isLoadingActiveView ? (
              <DashboardShellSkeleton />
            ) : groupedItems.length > 0 ? (
              <Timeline
                items={groupedItems}
                mode={mode}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            ) : (
              <EmptyState
                message={
                  mode === "exceptions"
                    ? "No exceptions match your current filters."
                    : "No data-quality issues match your current filters."
                }
              />
            )}
          </section>

          <section>
            {mode === "exceptions" ? (
              <ExceptionDetailPanel
                selectedId={selectedId}
                detailQuery={detailExceptionQuery}
              />
            ) : (
              <DataQualityDetailPanel
                selectedId={selectedId}
                detailQuery={detailIssueQuery}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function groupByDate(items: Array<ExceptionItem | DataQualityIssue>) {
  const map = new Map<string, Array<ExceptionItem | DataQualityIssue>>()

  for (const item of items) {
    const date = item.date || "No date"
    const group = map.get(date) || []
    group.push(item)
    map.set(date, group)
  }

  return Array.from(map.entries())
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .map(([date, group]) => ({
      date,
      items: group,
    }))
}

function Timeline({
  items,
  mode,
  onSelect,
  selectedId,
}: {
  items: Array<{ date: string; items: Array<ExceptionItem | DataQualityIssue> }>
  mode: Mode
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  return (
    <div className="space-y-4">
      {items.map((group) => (
        <details key={group.date} open className="group rounded-[28px] border border-border/70 bg-background/70">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Day bucket
              </p>
              <h3 className="mt-1 text-lg font-semibold">{group.date}</h3>
            </div>
            <Badge tone="neutral">{group.items.length} items</Badge>
          </summary>

          <div className="space-y-3 px-4 pb-4">
            {group.items.map((item) =>
              mode === "exceptions" ? (
                <ExceptionCard
                  key={item.id}
                  item={item as ExceptionItem}
                  onSelect={onSelect}
                  selected={selectedId === item.id}
                />
              ) : (
                <DataQualityCard
                  key={item.id}
                  item={item as DataQualityIssue}
                  onSelect={onSelect}
                  selected={selectedId === item.id}
                />
              )
            )}
          </div>
        </details>
      ))}
    </div>
  )
}

function ExceptionCard({
  item,
  onSelect,
  selected,
}: {
  item: ExceptionItem
  onSelect: (id: string) => void
  selected: boolean
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: "acknowledged" | "resolved") =>
      updateExceptionStatus(item.id, status),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: ["exceptions"] },
        (previous: ExceptionItem[] | undefined) =>
          previous?.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      queryClient.setQueryData(["exception-detail", item.id], (previous:
        | { exception: ExceptionItem; trend: TrendPoint[] }
        | undefined) =>
        previous ? { ...previous, exception: updated } : previous
      )
    },
  })

  return (
    <article
      className={cn(
        "rounded-[24px] border border-border/70 bg-card/90 p-4 transition",
        selected && "border-primary shadow-lg shadow-primary/10"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">{item.productCode}</h4>
            <Badge tone={item.severity === "high" ? "high" : "medium"}>
              {item.severity}
            </Badge>
            <Badge tone={item.status === "resolved" ? "success" : "warning"}>
              {item.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Planned {item.plannedUnits}</span>
            <span>Actual {item.actualUnits}</span>
            <span>Deficit {item.deficitPct}%</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelect(item.id)}
            aria-label={`View details for ${item.productCode}`}
          >
            View details
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={item.status !== "open"}
            onClick={() => mutation.mutate("acknowledged")}
          >
            Acknowledge
          </Button>
          <Button
            size="sm"
            disabled={item.status === "resolved"}
            onClick={() => mutation.mutate("resolved")}
          >
            Resolve
          </Button>
        </div>
      </div>
    </article>
  )
}

function DataQualityCard({
  item,
  onSelect,
  selected,
}: {
  item: DataQualityIssue
  onSelect: (id: string) => void
  selected: boolean
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: "acknowledged" | "resolved") =>
      updateDataQualityIssueStatus(item.id, status),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: ["data-quality-issues"] },
        (previous: DataQualityIssue[] | undefined) =>
          previous?.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      queryClient.setQueryData(["data-quality-issue-detail", item.id], updated)
    },
  })

  return (
    <article
      className={cn(
        "rounded-[24px] border border-border/70 bg-card/90 p-4 transition",
        selected && "border-primary shadow-lg shadow-primary/10"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">{item.productCode || "Unknown product"}</h4>
            <Badge tone="warning">{formatIssueType(item.issueType)}</Badge>
            <Badge tone={item.status === "resolved" ? "success" : "warning"}>
              {item.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelect(item.id)}
            aria-label={`View details for ${item.productCode || "issue"}`}
          >
            View details
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={item.status !== "open"}
            onClick={() => mutation.mutate("acknowledged")}
          >
            Acknowledge
          </Button>
          <Button
            size="sm"
            disabled={item.status === "resolved"}
            onClick={() => mutation.mutate("resolved")}
          >
            Resolve
          </Button>
        </div>
      </div>
    </article>
  )
}

function ExceptionDetailPanel({
  detailQuery,
  selectedId,
}: {
  detailQuery: {
    isPending: boolean
    data?: { exception: ExceptionItem; trend: TrendPoint[] }
  }
  selectedId: string | null
}) {
  const queryClient = useQueryClient()
  const item = detailQuery.data?.exception
  const mutation = useMutation({
    mutationFn: (status: "acknowledged" | "resolved") =>
      updateExceptionStatus(selectedId as string, status),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: ["exceptions"] },
        (previous: ExceptionItem[] | undefined) =>
          previous?.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      queryClient.setQueryData(
        ["exception-detail", updated.id],
        (previous: { exception: ExceptionItem; trend: TrendPoint[] } | undefined) =>
          previous ? { ...previous, exception: updated } : previous
      )
    },
  })

  if (!selectedId) {
    return <DetailPlaceholder title="Pick an exception" message="Select any card in the timeline to inspect planned vs actual values, the seven-day trend, and status actions." />
  }

  if (detailQuery.isPending) {
    return <PanelSkeleton label="Loading exception detail" />
  }

  if (!detailQuery.data || !item) {
    return <DetailPlaceholder title="Exception unavailable" message="The selected exception detail could not be loaded." />
  }

  return (
    <aside
      aria-label="Exception detail"
      role="complementary"
      className="rounded-[32px] border border-white/10 bg-card/92 p-5 shadow-2xl shadow-black/8"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold">{item.productCode}</h3>
            <Badge tone={item.severity === "high" ? "high" : "medium"}>
              {item.severity}
            </Badge>
            <Badge tone={item.status === "resolved" ? "success" : "warning"}>
              {item.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Date {item.date} · Planned {item.plannedUnits} · Actual {item.actualUnits}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatBox label="Deficit" value={`${item.deficitPct}%`} />
          <StatBox label="Planned" value={String(item.plannedUnits)} />
          <StatBox label="Actual" value={String(item.actualUnits)} />
        </div>

        <div className="rounded-[28px] border border-border/70 bg-background/75 p-4">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Last 7 days trend
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={detailQuery.data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="plannedUnits"
                  stroke="var(--color-primary)"
                  fill="color-mix(in oklch, var(--color-primary), transparent 76%)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actualUnits"
                  stroke="var(--color-chart-2)"
                  fill="color-mix(in oklch, var(--color-chart-2), transparent 80%)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Planned</th>
                  <th className="px-3 py-2 font-medium">Actual</th>
                </tr>
              </thead>
              <tbody>
                {detailQuery.data.trend.map((point) => (
                  <tr key={point.date} className="border-t border-border/70">
                    <td className="px-3 py-2">{point.date}</td>
                    <td className="px-3 py-2">{point.plannedUnits ?? "—"}</td>
                    <td className="px-3 py-2">{point.actualUnits ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={item.status !== "open"}
            onClick={() => mutation.mutate("acknowledged")}
          >
            Acknowledge
          </Button>
          <Button
            disabled={item.status === "resolved"}
            onClick={() => mutation.mutate("resolved")}
          >
            Resolve
          </Button>
        </div>
      </div>
    </aside>
  )
}

function DataQualityDetailPanel({
  detailQuery,
  selectedId,
}: {
  detailQuery: {
    isPending: boolean
    data?: DataQualityIssue
  }
  selectedId: string | null
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (status: "acknowledged" | "resolved") =>
      updateDataQualityIssueStatus(selectedId as string, status),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: ["data-quality-issues"] },
        (previous: DataQualityIssue[] | undefined) =>
          previous?.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      queryClient.setQueryData(["data-quality-issue-detail", updated.id], updated)
    },
  })

  if (!selectedId) {
    return <DetailPlaceholder title="Pick a data-quality issue" message="Switch into data quality mode and select any issue to inspect its raw source rows and status history." />
  }

  if (detailQuery.isPending) {
    return <PanelSkeleton label="Loading issue detail" />
  }

  if (!detailQuery.data) {
    return <DetailPlaceholder title="Issue unavailable" message="The selected data-quality issue could not be loaded." />
  }

  const issue = detailQuery.data

  return (
    <aside
      aria-label="Issue detail"
      role="complementary"
      className="rounded-[32px] border border-white/10 bg-card/92 p-5 shadow-2xl shadow-black/8"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold">{issue.productCode || "Unknown product"}</h3>
            <Badge tone="warning">{formatIssueType(issue.issueType)}</Badge>
            <Badge tone={issue.status === "resolved" ? "success" : "warning"}>
              {issue.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatBox label="Date" value={issue.date || "No date"} />
          <StatBox label="Status" value={issue.status} />
        </div>

        <div className="rounded-[28px] border border-border/70 bg-background/75 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Raw source payload
          </p>
          <pre className="overflow-auto rounded-2xl bg-muted/70 p-4 text-xs leading-6 text-foreground">
            {JSON.stringify(issue.rawRows, null, 2)}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={issue.status !== "open"}
            onClick={() => mutation.mutate("acknowledged")}
          >
            Acknowledge
          </Button>
          <Button
            disabled={issue.status === "resolved"}
            onClick={() => mutation.mutate("resolved")}
          >
            Resolve
          </Button>
        </div>
      </div>
    </aside>
  )
}

function DetailPlaceholder({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="rounded-[32px] border border-dashed border-border bg-card/80 p-8">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
    </div>
  )
}

function PanelSkeleton({
  label,
}: {
  label: string
}) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-card/92 p-5 shadow-2xl shadow-black/8">
      <span className="sr-only">{label}</span>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "high" | "warning" | "success"
}) {
  return (
    <article className="rounded-[24px] border border-border/70 bg-background/70 p-4">
      <div className="mb-2">
        <Badge tone={tone}>{label}</Badge>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </article>
  )
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function EmptyState({
  message,
}: {
  message: string
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-background/60 px-6 py-10 text-center">
      <p className="text-base font-medium">{message}</p>
    </div>
  )
}

function StatBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function formatIssueType(issueType: DataQualityIssue["issueType"]) {
  return issueType
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ")
}
