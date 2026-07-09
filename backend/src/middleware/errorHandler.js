function notFoundHandler(_req, _res, next) {
  const error = new Error("Route not found")
  error.status = 404
  next(error)
}

function errorHandler(error, _req, res, _next) {
  const status = error.status || 500
  const message =
    status === 500 ? "Internal server error" : error.message || "Request failed"

  res.status(status).json({ message })
}

module.exports = {
  errorHandler,
  notFoundHandler,
}
