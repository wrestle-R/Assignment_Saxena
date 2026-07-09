const cookieParser = require("cookie-parser")
const cors = require("cors")
const express = require("express")

const { getEnv } = require("./config/env")
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler")
const authRoutes = require("./routes/authRoutes")
const dataQualityRoutes = require("./routes/dataQualityRoutes")
const exceptionRoutes = require("./routes/exceptionRoutes")

function createApp() {
  const env = getEnv()
  const app = express()

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  )
  app.use(express.json())
  app.use(cookieParser())

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })

  app.use("/api/auth", authRoutes)
  app.use("/api/exceptions", exceptionRoutes)
  app.use("/api/data-quality-issues", dataQualityRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = {
  createApp,
}
