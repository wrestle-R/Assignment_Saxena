const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const cleanPlanRecordSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },
    plantId: { type: String, default: null },
    productCode: { type: String, required: true, index: true },
    plannedUnits: { type: Number, required: true },
    rawRowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawPlanRow",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("CleanPlanRecord", cleanPlanRecordSchema)
