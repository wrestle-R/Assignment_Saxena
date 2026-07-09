const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const dataQualityIssueSchema = new mongoose.Schema(
  {
    issueType: {
      type: String,
      enum: [
        "duplicate_plan_key",
        "blank_planned_units",
        "unmatched_plan_row",
        "unmatched_actual_row",
        "invalid_plan_date",
        "invalid_actual_date",
      ],
      required: true,
      index: true,
    },
    sourceTable: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: null,
      index: true,
    },
    productCode: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved"],
      default: "open",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    rawRows: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("DataQualityIssue", dataQualityIssueSchema)
