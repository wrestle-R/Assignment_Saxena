const { getEnv } = require("./config/env")
const { connectDatabase } = require("./config/database")
const { createApp } = require("./app")

async function startServer() {
  const env = getEnv()
  await connectDatabase(env.mongoUri)

  const app = createApp()
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`)
  })
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  startServer,
}
