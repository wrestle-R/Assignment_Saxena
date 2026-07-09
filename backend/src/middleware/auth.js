const jwt = require("jsonwebtoken")

const { getEnv } = require("../config/env")
const { createHttpError } = require("../utils/http")

function requireAuth(req, _res, next) {
  const env = getEnv()
  const token = req.cookies?.[env.authCookieName]

  if (!token) {
    return next(createHttpError(401, "Authentication required"))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.user = payload
    return next()
  } catch {
    return next(createHttpError(401, "Authentication required"))
  }
}

module.exports = {
  requireAuth,
}
