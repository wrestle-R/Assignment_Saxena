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
  const { status } = req.body || {}
  if (!["acknowledged", "resolved"].includes(status)) {
    throw createHttpError(
      400,
      "Status must be either acknowledged or resolved"
    )
  }

  const exception = await Exception.findByIdAndUpdate(
    req.params.id,
    { status },
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
