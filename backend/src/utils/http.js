function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

function serializeDocument(document) {
  if (!document) {
    return null
  }

  const plain = typeof document.toObject === "function" ? document.toObject() : document
  const { _id, __v, ...rest } = plain

  return {
    id: String(_id),
    ...rest,
  }
}

module.exports = {
  asyncHandler,
  createHttpError,
  serializeDocument,
}
