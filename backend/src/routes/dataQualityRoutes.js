const express = require("express")

const {
  getDataQualityIssueDetail,
  listDataQualityIssues,
  updateDataQualityIssueStatus,
} = require("../controllers/dataQualityController")
const { requireAuth } = require("../middleware/auth")
const { asyncHandler } = require("../utils/http")

const router = express.Router()

router.use(requireAuth)
router.get("/", asyncHandler(listDataQualityIssues))
router.get("/:id", asyncHandler(getDataQualityIssueDetail))
router.patch("/:id", asyncHandler(updateDataQualityIssueStatus))

module.exports = router
