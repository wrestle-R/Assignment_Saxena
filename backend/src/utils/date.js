function parseSupportedDate(value) {
  if (!value || typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (isoMatch) {
    return trimmed
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (!slashMatch) {
    return null
  }

  const day = Number(slashMatch[1])
  const month = Number(slashMatch[2])
  const year = Number(slashMatch[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function shiftIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getDateWindow(endDate, length = 7) {
  return Array.from({ length }, (_, index) =>
    shiftIsoDate(endDate, index - (length - 1))
  )
}

module.exports = {
  getDateWindow,
  parseSupportedDate,
  shiftIsoDate,
}
