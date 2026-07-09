const mongoose = require("mongoose")
const { createModel } = require("./helpers")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = createModel("User", userSchema)
