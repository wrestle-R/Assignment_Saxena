const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const rawPlanRowSchema = new mongoose.Schema(
  {
    sourceFile: { type: String, required: true },
    rowNumber: { type: Number, required: true },
    planDate: { type: String, default: null },
    plant: { type: String, default: null },
    sku: { type: String, default: null },
    plannedUnits: { type: String, default: null },
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("RawPlanRow", rawPlanRowSchema)
