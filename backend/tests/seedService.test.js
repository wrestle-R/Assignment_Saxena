const path = require("path")
const mongoose = require("mongoose")

const {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} = require("./helpers/testDb")

describe("seedDatabase", () => {
  let seedDatabase
  let models

  beforeAll(async () => {
    await setupTestDatabase()

    ;({ seedDatabase } = require("../src/services/seedService"))
    models = {
      CleanActualRecord: require("../src/models/CleanActualRecord"),
      CleanPlanRecord: require("../src/models/CleanPlanRecord"),
      DataQualityIssue: require("../src/models/DataQualityIssue"),
      Exception: require("../src/models/Exception"),
      RawActualRow: require("../src/models/RawActualRow"),
      RawPlanRow: require("../src/models/RawPlanRow"),
      User: require("../src/models/User"),
    }
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  test("loads raw rows, creates clean records, generates exceptions, and records data-quality issues", async () => {
    const summary = await seedDatabase({
      dataDir: path.resolve(__dirname, "../../candidate_pack/data"),
      adminUsername: "admin",
      adminPassword: "123456",
    })

    expect(summary.counts.rawPlanRows).toBe(1085)
    expect(summary.counts.rawActualRows).toBe(1080)
    expect(summary.counts.cleanPlanRecords).toBe(1055)
    expect(summary.counts.cleanActualRecords).toBe(1080)
    expect(summary.counts.exceptions).toBe(374)
    expect(summary.counts.dataQualityIssues).toBe(61)

    expect(await models.RawPlanRow.countDocuments()).toBe(1085)
    expect(await models.RawActualRow.countDocuments()).toBe(1080)
    expect(await models.CleanPlanRecord.countDocuments()).toBe(1055)
    expect(await models.CleanActualRecord.countDocuments()).toBe(1080)
    expect(await models.Exception.countDocuments()).toBe(374)
    expect(await models.DataQualityIssue.countDocuments()).toBe(61)
    expect(await models.User.countDocuments()).toBe(1)
  })

  test("normalizes dates, excludes duplicate plan keys from clean data, and classifies unmatched rows as issues", async () => {
    await seedDatabase({
      dataDir: path.resolve(__dirname, "../../candidate_pack/data"),
      adminUsername: "admin",
      adminPassword: "123456",
    })

    const nonIsoPlanDate = await models.CleanPlanRecord.findOne({
      date: { $regex: "/" },
    }).lean()
    expect(nonIsoPlanDate).toBeNull()

    const duplicateKey = {
      date: "2017-03-24",
      productCode: "FG-008",
    }

    const cleanDuplicate = await models.CleanPlanRecord.findOne(duplicateKey).lean()
    expect(cleanDuplicate).toBeNull()

    const duplicateIssue = await models.DataQualityIssue.findOne({
      issueType: "duplicate_plan_key",
      date: duplicateKey.date,
      productCode: duplicateKey.productCode,
    }).lean()
    expect(duplicateIssue).toBeTruthy()
    expect(duplicateIssue.rawRows).toHaveLength(2)

    const blankUnitsIssue = await models.DataQualityIssue.findOne({
      issueType: "blank_planned_units",
      productCode: "FG-012",
      date: "2017-01-26",
    }).lean()
    expect(blankUnitsIssue).toBeTruthy()

    const unmatchedPlanIssueCount = await models.DataQualityIssue.countDocuments({
      issueType: "unmatched_plan_row",
    })
    const unmatchedActualIssueCount = await models.DataQualityIssue.countDocuments({
      issueType: "unmatched_actual_row",
    })

    expect(unmatchedPlanIssueCount).toBe(10)
    expect(unmatchedActualIssueCount).toBe(35)
  })

  test("assigns severity based on the required thresholds", async () => {
    await seedDatabase({
      dataDir: path.resolve(__dirname, "../../candidate_pack/data"),
      adminUsername: "admin",
      adminPassword: "123456",
    })

    const highCount = await models.Exception.countDocuments({ severity: "high" })
    const mediumCount = await models.Exception.countDocuments({ severity: "medium" })

    expect(highCount).toBe(9)
    expect(mediumCount).toBe(365)

    const highExample = await models.Exception.findOne({
      date: "2017-02-09",
      productCode: "FG-011",
    }).lean()

    expect(highExample).toMatchObject({
      severity: "high",
      plannedUnits: 104,
      actualUnits: 65,
    })
    expect(highExample.deficitPct).toBeCloseTo(37.5, 2)
  })
})
