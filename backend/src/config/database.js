const mongoose = require("mongoose")

async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required")
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  await mongoose.connect(mongoUri)
  return mongoose.connection
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return
  }

  await mongoose.disconnect()
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
}
