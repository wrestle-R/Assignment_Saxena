const ISSUE_TYPES = {
  DUPLICATE_PLAN_KEY: "duplicate_plan_key",
  BLANK_PLANNED_UNITS: "blank_planned_units",
  UNMATCHED_PLAN_ROW: "unmatched_plan_row",
  UNMATCHED_ACTUAL_ROW: "unmatched_actual_row",
  INVALID_PLAN_DATE: "invalid_plan_date",
  INVALID_ACTUAL_DATE: "invalid_actual_date",
}

const STATUS = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
}

const SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
}

module.exports = {
  ISSUE_TYPES,
  SEVERITY,
  STATUS,
}
