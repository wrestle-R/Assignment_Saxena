const DataQualityIssue = require("../models/DataQualityIssue")
const { createHttpError, serializeDocument } = require("../utils/http")

function mapIssue(document) {
  return serializeDocument(document)
}

async function listDataQualityIssues(req, res) {
  const filter = {}

  if (req.query.issueType) {
    filter.issueType = req.query.issueType
  }
  if (req.query.status) {
    filter.status = req.query.status
  }
  if (req.query.productCode) {
    filter.productCode = req.query.productCode
  }

  const items = await DataQualityIssue.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .lean()

  res.json({
    items: items.map(mapIssue),
  })
}

async function getDataQualityIssueDetail(req, res) {
  const issue = await DataQualityIssue.findById(req.params.id).lean()
  if (!issue) {
    throw createHttpError(404, "Data-quality issue not found")
  }

  res.json({
    issue: mapIssue(issue),
  })
}

async function updateDataQualityIssueStatus(req, res) {
  const {
    status,
    date,
    productCode,
    sourceTable,
    description,
    rawRows,
  } = req.body || {}
  if (!["open", "acknowledged", "resolved"].includes(status)) {
    throw createHttpError(
      400,
      "Status must be open, acknowledged, or resolved"
    )
  }

  const update = { status }

  if (status === "resolved") {
    if (date !== undefined) {
      if (date !== null && typeof date !== "string") {
        throw createHttpError(400, "Date must be a string or null")
      }
      update.date = typeof date === "string" ? date.trim() : null
    }

    if (productCode !== undefined) {
      if (productCode !== null && typeof productCode !== "string") {
        throw createHttpError(400, "Product code must be a string or null")
      }
      update.productCode = typeof productCode === "string" ? productCode.trim() : null
    }

    if (sourceTable !== undefined) {
      if (typeof sourceTable !== "string" || !sourceTable.trim()) {
        throw createHttpError(400, "Source table must be a non-empty string")
      }
      update.sourceTable = sourceTable.trim()
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        throw createHttpError(400, "Description must be a non-empty string")
      }
      update.description = description.trim()
    }

    if (rawRows !== undefined) {
      if (!Array.isArray(rawRows)) {
        throw createHttpError(400, "Raw rows must be an array")
      }
      update.rawRows = rawRows
    }
  }

  const issue = await DataQualityIssue.findByIdAndUpdate(
    req.params.id,
    update,
    { returnDocument: "after" }
  ).lean()

  if (!issue) {
    throw createHttpError(404, "Data-quality issue not found")
  }

  res.json({
    issue: mapIssue(issue),
  })
}

module.exports = {
  getDataQualityIssueDetail,
  listDataQualityIssues,
  updateDataQualityIssueStatus,
}
