const path = require("path")
const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")

let mongoServer

async function setupTestDatabase() {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  process.env.NODE_ENV = "test"
  process.env.MONGODB_URI = uri
  process.env.JWT_SECRET = "test-secret"
  process.env.CLIENT_ORIGIN = "http://localhost:5173"
  process.env.AUTH_COOKIE_NAME = "assignment_token"
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "123456"
  process.env.DATA_DIR = path.resolve(__dirname, "../../../candidate_pack/data")

  await mongoose.connect(uri, {
    dbName: "mini-exception-inbox-test",
  })

  return uri
}

async function clearDatabase() {
  const { collections } = mongoose.connection

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  )
}

async function teardownTestDatabase() {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()

  if (mongoServer) {
    await mongoServer.stop()
  }
}

module.exports = {
  clearDatabase,
  setupTestDatabase,
  teardownTestDatabase,
}
