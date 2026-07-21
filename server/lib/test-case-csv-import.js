import { parse } from 'csv-parse/sync'

export const MAX_IMPORT_ROWS = 2000

const HEADER_ALIASES = {
  title: 'title',
  preconditions: 'preconditions',
  steps: 'steps',
  expectedresult: 'expectedResult',
  severity: 'severity',
  status: 'status',
}

const REQUIRED_FIELDS = ['title', 'severity', 'steps']

function normalizeHeaderName(header) {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '')
}

function splitSteps(raw) {
  if (!raw) return []
  return raw
    .split(/\r\n|\r|\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseTestCaseCsv(csvText, validateTestCase) {
  let records
  try {
    records = parse(csvText, {
      bom: true,
      skip_empty_lines: false,
      relax_column_count: true,
      trim: false,
    })
  } catch (err) {
    return { error: `could not parse CSV: ${err.message}` }
  }

  if (records.length === 0) {
    return { error: 'CSV file is empty' }
  }

  const headerRow = records[0]
  const columnMap = {}
  const ignoredColumns = []
  const duplicates = []

  headerRow.forEach((cell, i) => {
    const field = HEADER_ALIASES[normalizeHeaderName(cell)]
    if (!field) {
      if (cell.trim()) ignoredColumns.push(cell)
      return
    }
    if (columnMap[field] !== undefined) {
      duplicates.push(cell)
    } else {
      columnMap[field] = i
    }
  })

  if (duplicates.length) {
    return { error: `duplicate column header(s): ${duplicates.join(', ')}` }
  }

  const missing = REQUIRED_FIELDS.filter((field) => columnMap[field] === undefined)
  if (missing.length) {
    return { error: `CSV is missing required column(s): ${missing.join(', ')}` }
  }

  const dataRecords = records.slice(1)
  if (dataRecords.length > MAX_IMPORT_ROWS) {
    return {
      error: `CSV has ${dataRecords.length} data rows; the maximum supported is ${MAX_IMPORT_ROWS}. Split the file and import in batches.`,
    }
  }

  const rows = []
  let blankRowCount = 0

  dataRecords.forEach((rawRow, index) => {
    const rowNumber = index + 2

    const isBlank = rawRow.every((cell) => !cell || !String(cell).trim())
    if (isBlank) {
      blankRowCount += 1
      return
    }

    const get = (field) => {
      const i = columnMap[field]
      return i === undefined ? '' : String(rawRow[i] ?? '')
    }

    const title = get('title').trim()
    const preconditions = get('preconditions').trim() || null
    const steps = splitSteps(get('steps'))
    const expectedResult = get('expectedResult').trim()
    const severity = get('severity').trim()
    const status = get('status').trim() || 'draft'

    const errors = validateTestCase({ title, steps, expectedResult, severity, status })
    if (rawRow.length !== headerRow.length) {
      errors.push(`row has ${rawRow.length} column(s), expected ${headerRow.length}`)
    }

    rows.push({ rowNumber, title, preconditions, steps, expectedResult, severity, status, errors })
  })

  return { rows, blankRowCount, ignoredColumns }
}
