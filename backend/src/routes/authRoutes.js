const express = require("express")

const { login, logout, me } = require("../controllers/authController")
const { requireAuth } = require("../middleware/auth")
const { asyncHandler } = require("../utils/http")

const router = express.Router()

router.post("/login", asyncHandler(login))
router.post("/logout", asyncHandler(logout))
router.get("/me", requireAuth, asyncHandler(me))

module.exports = router
