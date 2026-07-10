const path = require("path")
const request = require("supertest")

const {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} = require("./helpers/testDb")

describe("API contracts", () => {
  let app
  let createApp
  let seedDatabase

  beforeAll(async () => {
    await setupTestDatabase()
    ;({ createApp } = require("../src/app"))
    ;({ seedDatabase } = require("../src/services/seedService"))
    app = createApp()
  })

  beforeEach(async () => {
    await clearDatabase()
    await seedDatabase({
      dataDir: path.resolve(__dirname, "../../candidate_pack/data"),
      adminUsername: "admin",
      adminPassword: "123456",
    })
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  test("rejects unauthenticated access to protected resources", async () => {
    const response = await request(app).get("/api/exceptions")

    expect(response.status).toBe(401)
    expect(response.body.message).toMatch(/authentication/i)
  })

  test("logs in the demo admin and returns the current user", async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "123456",
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.user).toEqual({
      username: "admin",
      role: "admin",
    })
    expect(loginResponse.headers["set-cookie"]).toBeTruthy()

    const cookie = loginResponse.headers["set-cookie"][0]
    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie)

    expect(meResponse.status).toBe(200)
    expect(meResponse.body.user).toEqual({
      username: "admin",
      role: "admin",
    })
  })

  test("filters and sorts exceptions, returns detail trend, and persists status updates", async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "123456",
    })
    const cookie = loginResponse.headers["set-cookie"][0]

    const listResponse = await request(app)
      .get("/api/exceptions")
      .query({ severity: "high", productCode: "FG-011", status: "open" })
      .set("Cookie", cookie)

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.items.length).toBeGreaterThan(0)
    expect(listResponse.body.items.every((item) => item.productCode === "FG-011")).toBe(
      true
    )
    expect(listResponse.body.items.every((item) => item.severity === "high")).toBe(
      true
    )

    const [firstItem] = listResponse.body.items
    const detailResponse = await request(app)
      .get(`/api/exceptions/${firstItem.id}`)
      .set("Cookie", cookie)

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.exception.id).toBe(firstItem.id)
    expect(detailResponse.body.trend).toHaveLength(7)
    expect(detailResponse.body.trend.at(-1)).toMatchObject({
      date: firstItem.date,
      plannedUnits: firstItem.plannedUnits,
      actualUnits: firstItem.actualUnits,
    })

    const resolveResponse = await request(app)
      .patch(`/api/exceptions/${firstItem.id}`)
      .send({
        status: "resolved",
        date: "2017-03-31",
        plannedUnits: 100,
        actualUnits: 80,
      })
      .set("Cookie", cookie)

    expect(resolveResponse.status).toBe(200)
    expect(resolveResponse.body.exception.status).toBe("resolved")
    expect(resolveResponse.body.exception.date).toBe("2017-03-31")
    expect(resolveResponse.body.exception.plannedUnits).toBe(100)
    expect(resolveResponse.body.exception.actualUnits).toBe(80)
    expect(resolveResponse.body.exception.deficitPct).toBe(20)
    expect(resolveResponse.body.exception.severity).toBe("medium")

    const refetchResponse = await request(app)
      .get(`/api/exceptions/${firstItem.id}`)
      .set("Cookie", cookie)

    expect(refetchResponse.body.exception.status).toBe("resolved")
    expect(refetchResponse.body.exception.plannedUnits).toBe(100)
    expect(refetchResponse.body.exception.actualUnits).toBe(80)

    const reopenResponse = await request(app)
      .patch(`/api/exceptions/${firstItem.id}`)
      .send({ status: "open" })
      .set("Cookie", cookie)

    expect(reopenResponse.status).toBe(200)
    expect(reopenResponse.body.exception.status).toBe("open")
  })

  test("lists, details, and updates data-quality issues separately from exceptions", async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "123456",
    })
    const cookie = loginResponse.headers["set-cookie"][0]

    const listResponse = await request(app)
      .get("/api/data-quality-issues")
      .query({ issueType: "blank_planned_units", status: "open" })
      .set("Cookie", cookie)

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.items).toHaveLength(2)

    const [issue] = listResponse.body.items
    const detailResponse = await request(app)
      .get(`/api/data-quality-issues/${issue.id}`)
      .set("Cookie", cookie)

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.issue.id).toBe(issue.id)
    expect(detailResponse.body.issue.rawRows.length).toBeGreaterThan(0)

    const patchResponse = await request(app)
      .patch(`/api/data-quality-issues/${issue.id}`)
      .send({
        status: "resolved",
        date: "2017-03-31",
        productCode: "FG-004",
        sourceTable: "production_plan",
        description: "Duplicate plan rows corrected.",
        rawRows: [
          {
            plan_date: "2017-03-31",
            plant: "PLANT-1",
            sku: "FG-004",
            planned_units: "15.0",
          },
        ],
      })
      .set("Cookie", cookie)

    expect(patchResponse.status).toBe(200)
    expect(patchResponse.body.issue.status).toBe("resolved")
    expect(patchResponse.body.issue.date).toBe("2017-03-31")
    expect(patchResponse.body.issue.productCode).toBe("FG-004")
    expect(patchResponse.body.issue.sourceTable).toBe("production_plan")
    expect(patchResponse.body.issue.description).toBe("Duplicate plan rows corrected.")
    expect(patchResponse.body.issue.rawRows).toHaveLength(1)

    const reopenResponse = await request(app)
      .patch(`/api/data-quality-issues/${issue.id}`)
      .send({ status: "open" })
      .set("Cookie", cookie)

    expect(reopenResponse.status).toBe(200)
    expect(reopenResponse.body.issue.status).toBe("open")
  })
})
