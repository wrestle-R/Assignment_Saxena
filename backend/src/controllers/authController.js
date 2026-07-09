const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const { getEnv } = require("../config/env")
const User = require("../models/User")
const { createHttpError, serializeDocument } = require("../utils/http")

function buildAuthCookieOptions() {
  const env = getEnv()

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  }
}

async function login(req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) {
    throw createHttpError(400, "Username and password are required")
  }

  const user = await User.findOne({ username }).lean()
  if (!user) {
    throw createHttpError(401, "Invalid username or password")
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    throw createHttpError(401, "Invalid username or password")
  }

  const env = getEnv()
  const token = jwt.sign(
    {
      sub: String(user._id),
      username: user.username,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "8h" }
  )

  res.cookie(env.authCookieName, token, buildAuthCookieOptions())
  res.json({
    user: {
      username: user.username,
      role: user.role,
    },
  })
}

async function logout(_req, res) {
  const env = getEnv()
  res.clearCookie(env.authCookieName, buildAuthCookieOptions())
  res.json({ success: true })
}

async function me(req, res) {
  const user = await User.findById(req.user.sub)
  if (!user) {
    throw createHttpError(401, "Authentication required")
  }

  const serialized = serializeDocument(user)
  res.json({
    user: {
      username: serialized.username,
      role: serialized.role,
    },
  })
}

module.exports = {
  login,
  logout,
  me,
}
