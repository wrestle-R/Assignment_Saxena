const mongoose = require("mongoose")

function createModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema)
}

module.exports = {
  createModel,
}
