const path = require("path")
const dotenv = require("dotenv")

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
})

function getEnv() {
  return {
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET || "change-me",
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    authCookieName: process.env.AUTH_COOKIE_NAME || "assignment_token",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "123456",
    dataDir:
      process.env.DATA_DIR ||
      path.resolve(process.cwd(), "../candidate_pack/data"),
    isProduction: process.env.NODE_ENV === "production",
  }
}

module.exports = {
  getEnv,
}
