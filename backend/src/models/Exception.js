const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const exceptionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },
    productCode: { type: String, required: true, index: true },
    plannedUnits: { type: Number, required: true },
    actualUnits: { type: Number, required: true },
    deficitPct: { type: Number, required: true, index: true },
    severity: {
      type: String,
      enum: ["high", "medium"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "acknowledged", "resolved"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("Exception", exceptionSchema)
