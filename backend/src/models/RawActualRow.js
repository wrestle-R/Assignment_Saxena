const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const rawActualRowSchema = new mongoose.Schema(
  {
    sourceFile: { type: String, required: true },
    rowNumber: { type: Number, required: true },
    date: { type: String, default: null },
    plantId: { type: String, default: null },
    productCode: { type: String, default: null },
    unitsProduced: { type: String, default: null },
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("RawActualRow", rawActualRowSchema)
