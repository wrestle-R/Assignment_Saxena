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
  const { status } = req.body || {}
  if (!["acknowledged", "resolved"].includes(status)) {
    throw createHttpError(
      400,
      "Status must be either acknowledged or resolved"
    )
  }

  const issue = await DataQualityIssue.findByIdAndUpdate(
    req.params.id,
    { status },
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
