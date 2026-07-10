import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { X } from "lucide-react"

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
  DataQualityIssueUpdateInput,
  ExceptionItem,
  ExceptionUpdateInput,
  TrendPoint,
  User,
} from "@/types"

type Mode = "exceptions" | "data-quality"
type WorkflowStatus = "open" | "acknowledged" | "resolved"

type DashboardPageProps = {
  currentUser: User
  onLogout: () => Promise<void>
}

type QueryDetail<T> = {
  isPending: boolean
  data?: T
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
    queryKey: [
      "data-quality-issues",
      deferredProductCode,
      issueTypeFilter,
      statusFilter,
    ],
    queryFn: () =>
      getDataQualityIssues({
        productCode: deferredProductCode || undefined,
        issueType: issueTypeFilter || undefined,
        status: statusFilter || undefined,
      }),
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

  const isLoadingActiveView =
    mode === "exceptions" ? exceptionsQuery.isPending : issuesQuery.isPending
  const exceptionItems = exceptionsQuery.data || []
  const issueItems = issuesQuery.data || []
  const groupedItems = useMemo(
    () =>
      groupByDate(
        mode === "exceptions" ? exceptionItems : issueItems
      ),
    [exceptionItems, issueItems, mode]
  )
  const dashboardStats = useMemo(
    () => [
      {
        label: "Open reviews",
        value: String(exceptionItems.filter((item) => item.status === "open").length),
        helper: "Exceptions waiting for review",
      },
      {
        label: "Resolved reviews",
        value: String(
          exceptionItems.filter((item) => item.status === "resolved").length
        ),
        helper: "Exceptions already cleaned",
      },
      {
        label: "Cleaning queue",
        value: String(issueItems.filter((item) => item.status !== "resolved").length),
        helper: "Data-quality issues still open",
      },
      {
        label: "Active days",
        value: String(groupedItems.length),
        helper: "Dates currently visible in the lane",
      },
    ],
    [exceptionItems, issueItems, groupedItems.length]
  )

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar
        eyebrow="Saxena"
        title=""
        primaryActionLabel="Jump to filters"
        onPrimaryAction={() => {
          const element = document.getElementById("dashboard-filters")
          element?.scrollIntoView({ behavior: "smooth", block: "start" })
        }}
        onLogout={onLogout}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <OverviewStat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              helper={stat.helper}
            />
          ))}
        </section>

        <section
          id="dashboard-filters"
          className="grid gap-5 border-b border-border/70 pb-6 lg:grid-cols-[260px_1fr] lg:items-end"
        >
          <FilterField label="Mode">
            <div className="grid h-11 grid-cols-2 rounded-lg border border-border bg-card p-1">
              <Button
                onClick={() =>
                  startTransition(() => {
                    setMode("exceptions")
                    setSelectedId(null)
                  })
                }
                variant={mode === "exceptions" ? "default" : "ghost"}
                className={cn(
                  "h-full rounded-md px-4",
                  mode === "exceptions"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
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
                variant={mode === "data-quality" ? "default" : "ghost"}
                className={cn(
                  "h-full rounded-md px-4",
                  mode === "data-quality"
                    ? "shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Data quality
              </Button>
            </div>
          </FilterField>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Product">
              <input
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                placeholder="FG-011"
                value={productInput}
                onChange={(event) => setProductInput(event.target.value.toUpperCase())}
              />
            </FilterField>

            {mode === "exceptions" ? (
              <FilterField label="Severity">
                <select
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
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
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
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
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All active</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </FilterField>

            <FilterField label="Review lane">
              <div className="flex h-11 items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground">
                {mode === "exceptions" ? "Deficit triage" : "Data review"}
              </div>
            </FilterField>
          </div>
        </section>

        <section
          className="mt-6"
        >
          <div>
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
          </div>
        </section>

        {mode === "exceptions" ? (
          <ExceptionDetailModal
            selectedId={selectedId}
            detailQuery={detailExceptionQuery}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
        {mode === "data-quality" ? (
          <DataQualityDetailModal
            selectedId={selectedId}
            detailQuery={detailIssueQuery}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </main>
    </div>
  )
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
    <div className="space-y-10">
      {items.map((group) => (
        <details
          key={group.date}
          open
          className="w-full overflow-hidden rounded-lg border border-border/70 bg-card/50"
        >
          <summary className="grid cursor-pointer list-none gap-4 border-b border-border/70 px-4 py-4 md:grid-cols-[1.1fr_1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Day
              </p>
              <h3 className="mt-1 text-2xl font-semibold">{group.date}</h3>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Display
              </p>
              <p className="mt-1 text-sm text-foreground">{formatLongDate(group.date)}</p>
            </div>
            <span className="text-sm text-muted-foreground md:text-right">
              {group.items.length} item{group.items.length > 1 ? "s" : ""}
            </span>
          </summary>

          <div className="border-b border-border/70 px-4 py-3">
            {mode === "exceptions" ? (
              <div className="hidden gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.8fr_0.8fr]">
                <span>Product</span>
                <span>Severity</span>
                <span>Planned</span>
                <span>Actual</span>
                <span>Status</span>
              </div>
            ) : (
              <div className="hidden gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.5fr)_1fr_0.9fr_0.9fr_0.8fr]">
                <span>Product</span>
                <span>Issue type</span>
                <span>Date</span>
                <span>Source</span>
                <span>Status</span>
              </div>
            )}
          </div>

          <div className="space-y-0">
            {group.items.map((item) =>
              mode === "exceptions" ? (
                <ExceptionRow
                  key={item.id}
                  item={item as ExceptionItem}
                  onSelect={onSelect}
                  selected={selectedId === item.id}
                />
              ) : (
                <DataQualityRow
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

function ExceptionRow({
  item,
  onSelect,
  selected,
}: {
  item: ExceptionItem
  onSelect: (id: string) => void
  selected: boolean
}) {
  return (
    <article
      className={cn(
        "border-b border-border/70 bg-card/80 p-4 transition-colors last:border-b-0",
        selected && "bg-primary/[0.045]"
      )}
    >
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.8fr_0.8fr_0.8fr] lg:items-center">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="grid gap-1 text-left"
          aria-label={`View details for ${item.productCode}`}
        >
          <span className="text-lg font-semibold">{item.productCode}</span>
          <span className="text-sm text-muted-foreground">{formatLongDate(item.date)}</span>
        </button>
        <CellBlock label="Severity">
          <Badge tone={item.severity === "high" ? "high" : "medium"}>
            {item.severity}
          </Badge>
        </CellBlock>
        <CellBlock label="Planned">{item.plannedUnits}</CellBlock>
        <CellBlock label="Actual">{item.actualUnits}</CellBlock>
        <CellBlock label="Status">
          <Badge tone={item.status === "resolved" ? "success" : "neutral"}>
            {item.status}
          </Badge>
        </CellBlock>
      </div>
    </article>
  )
}

function DataQualityRow({
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
    mutationFn: (status: WorkflowStatus) =>
      updateDataQualityIssueStatus(item.id, status),
    onSuccess: (updated) => {
      syncIssueCaches(queryClient, updated)
    },
  })

  return (
    <article
      className={cn(
        "border-b border-border/70 bg-card/80 p-4 transition-colors last:border-b-0",
        selected && "bg-primary/[0.045]"
      )}
    >
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.5fr)_1fr_0.9fr_0.9fr_0.8fr] lg:items-center">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="grid gap-1 text-left"
          aria-label={`View details for ${item.productCode || "issue"}`}
        >
          <span className="text-lg font-semibold">
            {item.productCode || "Unknown product"}
          </span>
          <span className="text-sm text-muted-foreground">
            {item.description}
          </span>
        </button>
        <CellBlock label="Issue type">
          <Badge tone="warning">{formatIssueType(item.issueType)}</Badge>
        </CellBlock>
        <CellBlock label="Date">{formatLongDate(item.date)}</CellBlock>
        <CellBlock label="Source">
          {item.sourceTable ? item.sourceTable.replaceAll("_", " ") : "Raw rows"}
        </CellBlock>
        <CellBlock label="Status">
          <Badge tone={item.status === "resolved" ? "success" : "neutral"}>
            {item.status}
          </Badge>
        </CellBlock>
      </div>
    </article>
  )
}

function StatusActions({
  status,
  onResolve,
  onOpen,
}: {
  status: WorkflowStatus
  onResolve: () => void
  onOpen: () => void
}) {
  if (status === "resolved") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" className="rounded-full px-4" onClick={onOpen}>
          Reopen
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button className="rounded-full px-4" onClick={onResolve}>
        Resolve
      </Button>
      {status !== "open" ? (
        <Button variant="ghost" className="rounded-full px-4" onClick={onOpen}>
          Mark open
        </Button>
      ) : null}
    </div>
  )
}

function ExceptionDetailModal({
  detailQuery,
  onClose,
  selectedId,
}: {
  detailQuery: QueryDetail<{ exception: ExceptionItem; trend: TrendPoint[] }>
  onClose: () => void
  selectedId: string | null
}) {
  const queryClient = useQueryClient()
  const item = detailQuery.data?.exception
  const [resolveDate, setResolveDate] = useState("")
  const [resolvePlannedUnits, setResolvePlannedUnits] = useState("")
  const [resolveActualUnits, setResolveActualUnits] = useState("")
  const mutation = useMutation({
    mutationFn: (update: ExceptionUpdateInput) =>
      updateExceptionStatus(selectedId as string, update),
    onSuccess: (updated) => {
      syncExceptionCaches(queryClient, updated)
      setResolveDate(updated.date)
      setResolvePlannedUnits(String(updated.plannedUnits))
      setResolveActualUnits(String(updated.actualUnits))
    },
  })

  useEffect(() => {
    if (!item) {
      setResolveDate("")
      setResolvePlannedUnits("")
      setResolveActualUnits("")
      return
    }

    setResolveDate(item.date)
    setResolvePlannedUnits(String(item.plannedUnits))
    setResolveActualUnits(String(item.actualUnits))
  }, [item?.id, item?.date, item?.plannedUnits, item?.actualUnits])

  const isEdited =
    item &&
    (resolveDate !== item.date ||
      resolvePlannedUnits !== String(item.plannedUnits) ||
      resolveActualUnits !== String(item.actualUnits))

  const handleResolve = () => {
    const plannedUnits = Number(resolvePlannedUnits)
    const actualUnits = Number(resolveActualUnits)

    if (!item || !resolveDate.trim() || Number.isNaN(plannedUnits) || Number.isNaN(actualUnits)) {
      return
    }

    mutation.mutate({
      status: "resolved",
      date: resolveDate.trim(),
      plannedUnits,
      actualUnits,
    })
  }

  if (!selectedId) {
    return null
  }

  if (detailQuery.isPending) {
    return <PanelSkeleton label="Loading exception detail" />
  }

  if (!detailQuery.data || !item) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Exception detail"
      onClick={onClose}
    >
      <aside
        role="document"
        className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl border border-border/70 bg-card p-7 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 pb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-4xl font-semibold">{item.productCode}</h3>
              <Badge tone={item.severity === "high" ? "high" : "medium"}>
                {item.severity}
              </Badge>
              <Badge tone={item.status === "resolved" ? "success" : "neutral"}>
                {item.status}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              On {formatLongDate(item.date)}, actual production landed at {item.actualUnits} units
              against a plan of {item.plannedUnits}. The current deficit is{" "}
              {item.deficitPct}%.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close exception detail"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <StatBox label="Deficit" value={`${item.deficitPct}%`} />
            <StatBox label="Planned" value={String(item.plannedUnits)} />
            <StatBox label="Actual" value={String(item.actualUnits)} />
          </div>

        <section className="space-y-4 border-b border-border/70 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Seven-day context
            </p>
            <h4 className="mt-2 text-2xl font-semibold">Trend review</h4>
          </div>

          <div className="h-56 border border-border/70 bg-background/55 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={detailQuery.data.trend}>
                <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="plannedUnits"
                  stroke="var(--color-primary)"
                  fill="color-mix(in oklch, var(--color-primary), transparent 82%)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actualUnits"
                  stroke="var(--color-chart-2)"
                  fill="color-mix(in oklch, var(--color-chart-2), transparent 84%)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden border border-border/70">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/70 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Display</th>
                  <th className="px-4 py-3 font-medium">Planned</th>
                  <th className="px-4 py-3 font-medium">Actual</th>
                </tr>
              </thead>
              <tbody>
                {detailQuery.data.trend.map((point) => (
                  <tr key={point.date} className="border-t border-border/70">
                    <td className="px-4 py-3">{point.date}</td>
                    <td className="px-4 py-3">{formatLongDate(point.date)}</td>
                    <td className="px-4 py-3">{point.plannedUnits ?? "—"}</td>
                    <td className="px-4 py-3">{point.actualUnits ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-b border-border/70 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Resolve update
            </p>
            <h4 className="mt-2 text-2xl font-semibold">Corrected values</h4>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FilterField label="Updated date">
              <input
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                value={resolveDate}
                onChange={(event) => setResolveDate(event.target.value)}
              />
            </FilterField>
            <FilterField label="Updated planned">
              <input
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                inputMode="numeric"
                value={resolvePlannedUnits}
                onChange={(event) => setResolvePlannedUnits(event.target.value)}
              />
            </FilterField>
            <FilterField label="Updated actual">
              <input
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                inputMode="numeric"
                value={resolveActualUnits}
                onChange={(event) => setResolveActualUnits(event.target.value)}
              />
            </FilterField>
          </div>
          {isEdited ? (
            <p className="text-sm text-muted-foreground">
              Resolve will use these updated values.
            </p>
          ) : null}
        </section>

          <StatusActions
            status={item.status}
            onResolve={handleResolve}
            onOpen={() => mutation.mutate({ status: "open" })}
          />
        </div>
      </aside>
    </div>
  )
}

function DataQualityDetailModal({
  detailQuery,
  onClose,
  selectedId,
}: {
  detailQuery: QueryDetail<DataQualityIssue>
  onClose: () => void
  selectedId: string | null
}) {
  const queryClient = useQueryClient()
  const [editedDate, setEditedDate] = useState("")
  const [editedProductCode, setEditedProductCode] = useState("")
  const [editedSourceTable, setEditedSourceTable] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedRawRows, setEditedRawRows] = useState<Array<Record<string, string>>>([])
  const mutation = useMutation({
    mutationFn: (update: DataQualityIssueUpdateInput) =>
      updateDataQualityIssueStatus(selectedId as string, update),
    onSuccess: (updated) => {
      syncIssueCaches(queryClient, updated)
      setEditedDate(updated.date || "")
      setEditedProductCode(updated.productCode || "")
      setEditedSourceTable(updated.sourceTable || "")
      setEditedDescription(updated.description)
      setEditedRawRows(normalizeEditableRows(updated.rawRows))
    },
  })

  if (!selectedId) {
    return null
  }

  if (detailQuery.isPending) {
    return <PanelSkeleton label="Loading issue detail" />
  }

  if (!detailQuery.data) {
    return (
      <DetailPlaceholder
        title="Issue unavailable"
        message="The selected data-quality issue could not be loaded."
      />
    )
  }

  const issue = detailQuery.data
  const evidenceCards = issue.rawRows.length > 0 ? issue.rawRows : [{}]

  useEffect(() => {
    setEditedDate(issue.date || "")
    setEditedProductCode(issue.productCode || "")
    setEditedSourceTable(issue.sourceTable || "")
    setEditedDescription(issue.description)
    setEditedRawRows(normalizeEditableRows(issue.rawRows))
  }, [
    issue.id,
    issue.date,
    issue.productCode,
    issue.sourceTable,
    issue.description,
    issue.rawRows,
  ])

  const handleRawRowChange = (
    rowIndex: number,
    key: string,
    value: string
  ) => {
    setEditedRawRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    )
  }

  const handleResolve = () => {
    mutation.mutate({
      status: "resolved",
      date: editedDate.trim() || null,
      productCode: editedProductCode.trim() || null,
      sourceTable: editedSourceTable.trim() || issue.sourceTable || "raw_rows",
      description: editedDescription.trim() || issue.description,
      rawRows: editedRawRows,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Issue detail"
      onClick={onClose}
    >
      <aside
        role="document"
        className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl border border-border/70 bg-card p-7 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 pb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-4xl font-semibold">
                {issue.productCode || "Unknown product"}
              </h3>
              <Badge tone="warning">{formatIssueType(issue.issueType)}</Badge>
              <Badge tone={issue.status === "resolved" ? "success" : "neutral"}>
                {issue.status}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {issue.description}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close issue detail"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <StatBox label="Date" value={formatLongDate(issue.date)} />
            <StatBox
              label="Source"
              value={issue.sourceTable ? issue.sourceTable.replaceAll("_", " ") : "Raw rows"}
            />
            <StatBox label="Status" value={issue.status} />
          </div>

          <section className="space-y-4 border-b border-border/70 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Source payload
              </p>
              <h4 className="mt-2 text-2xl font-semibold">Evidence cards</h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {evidenceCards.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="rounded-lg border border-border/70 bg-background/55 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Evidence {rowIndex + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(row).length} fields
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(row).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-md border border-border/70 bg-card px-3 py-2"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {key.replaceAll("_", " ")}
                        </p>
                        <p className="mt-2 text-sm">{String(value || "—")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-b border-border/70 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Resolve update
              </p>
              <h4 className="mt-2 text-2xl font-semibold">Corrected values</h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Updated date">
                <input
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                  value={editedDate}
                  onChange={(event) => setEditedDate(event.target.value)}
                />
              </FilterField>
              <FilterField label="Updated product">
                <input
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                  value={editedProductCode}
                  onChange={(event) => setEditedProductCode(event.target.value.toUpperCase())}
                />
              </FilterField>
              <FilterField label="Updated source">
                <input
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                  value={editedSourceTable}
                  onChange={(event) => setEditedSourceTable(event.target.value)}
                />
              </FilterField>
              <FilterField label="Updated description">
                <input
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                  value={editedDescription}
                  onChange={(event) => setEditedDescription(event.target.value)}
                />
              </FilterField>
            </div>

            <div className="grid gap-4">
              {editedRawRows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="rounded-lg border border-border/70 bg-background/55 p-4"
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Row {rowIndex + 1}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(row).map(([key, value]) => (
                      <FilterField key={key} label={key.replaceAll("_", " ")}>
                        <input
                          className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary"
                          value={value}
                          onChange={(event) =>
                            handleRawRowChange(rowIndex, key, event.target.value)
                          }
                        />
                      </FilterField>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <StatusActions
            status={issue.status}
            onResolve={handleResolve}
            onOpen={() => mutation.mutate({ status: "open" })}
          />
        </div>
      </aside>
    </div>
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
    <div className="border border-dashed border-border/70 bg-card/62 p-7">
      <h3 className="text-4xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

function PanelSkeleton({
  label,
}: {
  label: string
}) {
  return (
    <div className="border border-border/70 bg-card/82 p-7">
      <span className="sr-only">{label}</span>
      <div className="space-y-4">
        <Skeleton className="h-10 w-52 border border-border/70 bg-background/65" />
        <Skeleton className="h-24 w-full border border-border/70 bg-background/65" />
        <Skeleton className="h-64 w-full border border-border/70 bg-background/65" />
      </div>
    </div>
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
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
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
    <div className="border border-dashed border-border/70 bg-card/60 px-8 py-14">
      <p className="text-lg font-medium">{message}</p>
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
    <div className="border border-border/70 bg-background/55 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function OverviewStat({
  helper,
  label,
  value,
}: {
  helper: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

function CellBlock({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  )
}

function formatLongDate(date: string | null | undefined) {
  if (!date) {
    return "No date"
  }

  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed)
}

function normalizeEditableRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, String(value ?? "")])
    )
  )
}

function formatIssueType(issueType: DataQualityIssue["issueType"]) {
  return issueType
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ")
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

function syncExceptionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updated: ExceptionItem
) {
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
}

function syncIssueCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updated: DataQualityIssue
) {
  queryClient.setQueriesData(
    { queryKey: ["data-quality-issues"] },
    (previous: DataQualityIssue[] | undefined) =>
      previous?.map((entry) => (entry.id === updated.id ? updated : entry))
  )
  queryClient.setQueryData(["data-quality-issue-detail", updated.id], updated)
}
