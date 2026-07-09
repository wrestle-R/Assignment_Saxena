const express = require("express")

const {
  getExceptionDetail,
  listExceptions,
  updateExceptionStatus,
} = require("../controllers/exceptionsController")
const { requireAuth } = require("../middleware/auth")
const { asyncHandler } = require("../utils/http")

const router = express.Router()

router.use(requireAuth)
router.get("/", asyncHandler(listExceptions))
router.get("/:id", asyncHandler(getExceptionDetail))
router.patch("/:id", asyncHandler(updateExceptionStatus))

module.exports = router
