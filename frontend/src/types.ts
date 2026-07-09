export type User = {
  username: string
  role: string
}

export type ExceptionItem = {
  id: string
  date: string
  productCode: string
  plannedUnits: number
  actualUnits: number
  deficitPct: number
  severity: "high" | "medium"
  status: "open" | "acknowledged" | "resolved"
}

export type TrendPoint = {
  date: string
  plannedUnits: number | null
  actualUnits: number | null
}

export type ExceptionDetailResponse = {
  exception: ExceptionItem
  trend: TrendPoint[]
}

export type DataQualityIssue = {
  id: string
  issueType:
    | "duplicate_plan_key"
    | "blank_planned_units"
    | "unmatched_plan_row"
    | "unmatched_actual_row"
    | "invalid_plan_date"
    | "invalid_actual_date"
  sourceTable?: string
  date: string | null
  productCode: string | null
  description: string
  status: "open" | "acknowledged" | "resolved"
  rawRows: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
}
