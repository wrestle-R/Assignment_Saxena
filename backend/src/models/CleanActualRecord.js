const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const cleanActualRecordSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },
    plantId: { type: String, default: null },
    productCode: { type: String, required: true, index: true },
    actualUnits: { type: Number, required: true },
    rawRowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawActualRow",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("CleanActualRecord", cleanActualRecordSchema)
