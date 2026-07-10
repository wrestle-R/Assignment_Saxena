const CleanActualRecord = require("../models/CleanActualRecord")
const CleanPlanRecord = require("../models/CleanPlanRecord")
const Exception = require("../models/Exception")
const { getDateWindow } = require("../utils/date")
const { createHttpError, serializeDocument } = require("../utils/http")

function mapException(document) {
  return serializeDocument(document)
}

async function listExceptions(req, res) {
  const filter = {}

  if (req.query.productCode) {
    filter.productCode = req.query.productCode
  }
  if (req.query.severity) {
    filter.severity = req.query.severity
  }
  if (req.query.status) {
    filter.status = req.query.status
  }

  const items = await Exception.find(filter)
    .sort({ date: -1, deficitPct: -1 })
    .lean()

  res.json({
    items: items.map(mapException),
  })
}

async function getExceptionDetail(req, res) {
  const exception = await Exception.findById(req.params.id).lean()
  if (!exception) {
    throw createHttpError(404, "Exception not found")
  }

  const dates = getDateWindow(exception.date, 7)
  const rangeFilter = {
    productCode: exception.productCode,
    date: { $in: dates },
  }

  const [planRecords, actualRecords] = await Promise.all([
    CleanPlanRecord.find(rangeFilter).lean(),
    CleanActualRecord.find(rangeFilter).lean(),
  ])

  const planByDate = new Map(planRecords.map((record) => [record.date, record]))
  const actualByDate = new Map(actualRecords.map((record) => [record.date, record]))

  const trend = dates.map((date) => ({
    date,
    plannedUnits: planByDate.get(date)?.plannedUnits ?? null,
    actualUnits: actualByDate.get(date)?.actualUnits ?? null,
  }))

  res.json({
    exception: mapException(exception),
    trend,
  })
}

async function updateExceptionStatus(req, res) {
  const { status, date, plannedUnits, actualUnits } = req.body || {}
  if (!["open", "acknowledged", "resolved"].includes(status)) {
    throw createHttpError(
      400,
      "Status must be open, acknowledged, or resolved"
    )
  }

  const update = { status }

  if (status === "resolved") {
    if (date !== undefined) {
      if (typeof date !== "string" || !date.trim()) {
        throw createHttpError(400, "Resolved exception date must be a non-empty string")
      }
      update.date = date.trim()
    }

    if (plannedUnits !== undefined) {
      if (!Number.isFinite(plannedUnits) || plannedUnits < 0) {
        throw createHttpError(400, "Planned units must be a valid non-negative number")
      }
      update.plannedUnits = plannedUnits
    }

    if (actualUnits !== undefined) {
      if (!Number.isFinite(actualUnits) || actualUnits < 0) {
        throw createHttpError(400, "Actual units must be a valid non-negative number")
      }
      update.actualUnits = actualUnits
    }
  }

  if (
    update.plannedUnits !== undefined ||
    update.actualUnits !== undefined
  ) {
    const nextPlannedUnits = update.plannedUnits
    const nextActualUnits = update.actualUnits
    const baseException = await Exception.findById(req.params.id).lean()

    if (!baseException) {
      throw createHttpError(404, "Exception not found")
    }

    const planned = nextPlannedUnits ?? baseException.plannedUnits
    const actual = nextActualUnits ?? baseException.actualUnits
    const deficitPct =
      planned > 0 ? Number((((planned - actual) / planned) * 100).toFixed(1)) : 0

    update.deficitPct = deficitPct
    update.severity = deficitPct >= 30 ? "high" : "medium"
  }

  const exception = await Exception.findByIdAndUpdate(
    req.params.id,
    update,
    { returnDocument: "after" }
  ).lean()

  if (!exception) {
    throw createHttpError(404, "Exception not found")
  }

  res.json({
    exception: mapException(exception),
  })
}

module.exports = {
  getExceptionDetail,
  listExceptions,
  updateExceptionStatus,
}
