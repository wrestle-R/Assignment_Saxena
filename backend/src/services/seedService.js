const fs = require("fs")
const path = require("path")
const bcrypt = require("bcryptjs")
const { parse } = require("csv-parse/sync")

const { ISSUE_TYPES, SEVERITY, STATUS } = require("../constants")
const CleanActualRecord = require("../models/CleanActualRecord")
const CleanPlanRecord = require("../models/CleanPlanRecord")
const DataQualityIssue = require("../models/DataQualityIssue")
const Exception = require("../models/Exception")
const RawActualRow = require("../models/RawActualRow")
const RawPlanRow = require("../models/RawPlanRow")
const User = require("../models/User")
const { parseSupportedDate } = require("../utils/date")

function readCsvRows(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildIssue({
  issueType,
  sourceTable,
  date = null,
  productCode = null,
  description,
  rawRows,
  metadata = {},
}) {
  return {
    issueType,
    sourceTable,
    date,
    productCode,
    description,
    rawRows,
    metadata,
    status: STATUS.OPEN,
  }
}

async function clearSeedCollections() {
  await Promise.all([
    User.deleteMany({}),
    RawPlanRow.deleteMany({}),
    RawActualRow.deleteMany({}),
    CleanPlanRecord.deleteMany({}),
    CleanActualRecord.deleteMany({}),
    Exception.deleteMany({}),
    DataQualityIssue.deleteMany({}),
  ])
}

async function seedDatabase({ dataDir, adminUsername, adminPassword }) {
  await clearSeedCollections()

  const planFilePath = path.resolve(dataDir, "production_plan.csv")
  const actualFilePath = path.resolve(dataDir, "actual_production.csv")

  const planRows = readCsvRows(planFilePath)
  const actualRows = readCsvRows(actualFilePath)

  const rawPlanDocs = await RawPlanRow.insertMany(
    planRows.map((row, index) => ({
      sourceFile: "production_plan.csv",
      rowNumber: index + 2,
      planDate: row.plan_date ?? null,
      plant: row.plant ?? null,
      sku: row.sku ?? null,
      plannedUnits: row.planned_units ?? null,
      rawData: row,
    }))
  )

  const rawActualDocs = await RawActualRow.insertMany(
    actualRows.map((row, index) => ({
      sourceFile: "actual_production.csv",
      rowNumber: index + 2,
      date: row.date ?? null,
      plantId: row.plant_id ?? null,
      productCode: row.product_code ?? null,
      unitsProduced: row.units_produced ?? null,
      rawData: row,
    }))
  )

  const issues = []
  const planCandidates = []

  for (const rawPlanDoc of rawPlanDocs) {
    const normalizedDate = parseSupportedDate(rawPlanDoc.planDate)
    const productCode = (rawPlanDoc.sku || "").trim() || null
    const plantId = (rawPlanDoc.plant || "").trim() || null
    const plannedUnits = normalizeNumber(rawPlanDoc.plannedUnits)

    if (!normalizedDate) {
      issues.push(
        buildIssue({
          issueType: ISSUE_TYPES.INVALID_PLAN_DATE,
          sourceTable: "production_plan",
          productCode,
          description: "Plan row has an invalid date and could not be normalized.",
          rawRows: [rawPlanDoc.rawData],
          metadata: { rowNumber: rawPlanDoc.rowNumber },
        })
      )
      continue
    }

    if (plannedUnits === null) {
      issues.push(
        buildIssue({
          issueType: ISSUE_TYPES.BLANK_PLANNED_UNITS,
          sourceTable: "production_plan",
          date: normalizedDate,
          productCode,
          description: "Plan row has a blank planned_units value.",
          rawRows: [rawPlanDoc.rawData],
          metadata: { rowNumber: rawPlanDoc.rowNumber, plantId },
        })
      )
      continue
    }

    planCandidates.push({
      date: normalizedDate,
      plantId,
      productCode,
      plannedUnits,
      rawRowId: rawPlanDoc._id,
      rawRow: rawPlanDoc.rawData,
      rowNumber: rawPlanDoc.rowNumber,
    })
  }

  const duplicateGroups = new Map()
  for (const candidate of planCandidates) {
    const key = `${candidate.date}::${candidate.plantId || ""}::${candidate.productCode}`
    const existing = duplicateGroups.get(key) || []
    existing.push(candidate)
    duplicateGroups.set(key, existing)
  }

  const cleanPlanDocs = []
  for (const [key, candidates] of duplicateGroups.entries()) {
    if (candidates.length > 1) {
      const [first] = candidates
      issues.push(
        buildIssue({
          issueType: ISSUE_TYPES.DUPLICATE_PLAN_KEY,
          sourceTable: "production_plan",
          date: first.date,
          productCode: first.productCode,
          description:
            "Multiple plan rows normalized to the same date and product key.",
          rawRows: candidates.map((candidate) => candidate.rawRow),
          metadata: {
            duplicateKey: key,
            rowNumbers: candidates.map((candidate) => candidate.rowNumber),
          },
        })
      )
      continue
    }

    const [candidate] = candidates
    cleanPlanDocs.push({
      date: candidate.date,
      plantId: candidate.plantId,
      productCode: candidate.productCode,
      plannedUnits: candidate.plannedUnits,
      rawRowId: candidate.rawRowId,
    })
  }

  const cleanActualDocs = []
  for (const rawActualDoc of rawActualDocs) {
    const normalizedDate = parseSupportedDate(rawActualDoc.date)
    const productCode = (rawActualDoc.productCode || "").trim() || null
    const actualUnits = normalizeNumber(rawActualDoc.unitsProduced)
    const plantId = (rawActualDoc.plantId || "").trim() || null

    if (!normalizedDate) {
      issues.push(
        buildIssue({
          issueType: ISSUE_TYPES.INVALID_ACTUAL_DATE,
          sourceTable: "actual_production",
          productCode,
          description: "Actual row has an invalid date and could not be normalized.",
          rawRows: [rawActualDoc.rawData],
          metadata: { rowNumber: rawActualDoc.rowNumber },
        })
      )
      continue
    }

    cleanActualDocs.push({
      date: normalizedDate,
      plantId,
      productCode,
      actualUnits,
      rawRowId: rawActualDoc._id,
    })
  }

  await CleanPlanRecord.insertMany(cleanPlanDocs)
  await CleanActualRecord.insertMany(cleanActualDocs)

  const planByKey = new Map(
    cleanPlanDocs.map((record) => [`${record.date}::${record.productCode}`, record])
  )
  const actualByKey = new Map(
    cleanActualDocs.map((record) => [`${record.date}::${record.productCode}`, record])
  )

  const exceptions = []

  for (const planRecord of cleanPlanDocs) {
    const matchKey = `${planRecord.date}::${planRecord.productCode}`
    const actualRecord = actualByKey.get(matchKey)

    if (!actualRecord) {
      issues.push(
        buildIssue({
          issueType: ISSUE_TYPES.UNMATCHED_PLAN_ROW,
          sourceTable: "production_plan",
          date: planRecord.date,
          productCode: planRecord.productCode,
          description: "No matching actual row was found for this plan record.",
          rawRows: [planRecord],
        })
      )
      continue
    }

    if (actualRecord.actualUnits < 0.9 * planRecord.plannedUnits) {
      const deficitPct =
        ((planRecord.plannedUnits - actualRecord.actualUnits) /
          planRecord.plannedUnits) *
        100

      exceptions.push({
        date: planRecord.date,
        productCode: planRecord.productCode,
        plannedUnits: planRecord.plannedUnits,
        actualUnits: actualRecord.actualUnits,
        deficitPct: Number(deficitPct.toFixed(2)),
        severity:
          actualRecord.actualUnits < 0.7 * planRecord.plannedUnits
            ? SEVERITY.HIGH
            : SEVERITY.MEDIUM,
        status: STATUS.OPEN,
      })
    }
  }

  for (const actualRecord of cleanActualDocs) {
    const matchKey = `${actualRecord.date}::${actualRecord.productCode}`
    if (planByKey.has(matchKey)) {
      continue
    }

    issues.push(
      buildIssue({
        issueType: ISSUE_TYPES.UNMATCHED_ACTUAL_ROW,
        sourceTable: "actual_production",
        date: actualRecord.date,
        productCode: actualRecord.productCode,
        description: "No matching plan row was found for this actual record.",
        rawRows: [actualRecord],
      })
    )
  }

  await Exception.insertMany(exceptions)
  await DataQualityIssue.insertMany(issues)

  const passwordHash = await bcrypt.hash(adminPassword, 10)
  await User.create({
    username: adminUsername,
    passwordHash,
    role: "admin",
  })

  return {
    counts: {
      rawPlanRows: rawPlanDocs.length,
      rawActualRows: rawActualDocs.length,
      cleanPlanRecords: cleanPlanDocs.length,
      cleanActualRecords: cleanActualDocs.length,
      exceptions: exceptions.length,
      dataQualityIssues: issues.length,
    },
  }
}

module.exports = {
  seedDatabase,
}
