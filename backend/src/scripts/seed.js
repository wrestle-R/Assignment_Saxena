const { getEnv } = require("../config/env")
const { connectDatabase, disconnectDatabase } = require("../config/database")
const { seedDatabase } = require("../services/seedService")

async function run() {
  const env = getEnv()
  await connectDatabase(env.mongoUri)

  const summary = await seedDatabase({
    dataDir: env.dataDir,
    adminUsername: env.adminUsername,
    adminPassword: env.adminPassword,
  })

  console.log("Seed completed")
  console.table(summary.counts)
  await disconnectDatabase()
}

run().catch(async (error) => {
  console.error(error)
  await disconnectDatabase()
  process.exit(1)
})
