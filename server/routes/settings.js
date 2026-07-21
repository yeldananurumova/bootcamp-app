import { Router } from 'express'
import db from '../db.js'

const THEMES = ['light', 'dark', 'system']
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const PAGE_SIZES = [10, 20, 50, 100]

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeSettings(row) {
  return {
    theme: row.theme,
    defaultSeverityForNewBugs: row.default_severity_for_new_bugs,
    defaultPageSize: row.default_page_size,
    timezone: row.timezone,
    autoGenerateReportAfterRun: Boolean(row.auto_generate_report_after_run),
    updatedAt: row.updated_at,
  }
}

function isValidTimezone(value) {
  if (typeof value !== 'string') return false
  if (value === '') return true
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return true
  } catch {
    return false
  }
}

function validateSettings(body) {
  const errors = []

  if (!THEMES.includes(body.theme)) {
    errors.push(`theme must be one of: ${THEMES.join(', ')}`)
  }

  if (!SEVERITIES.includes(body.defaultSeverityForNewBugs)) {
    errors.push(`defaultSeverityForNewBugs must be one of: ${SEVERITIES.join(', ')}`)
  }

  if (!PAGE_SIZES.includes(body.defaultPageSize)) {
    errors.push(`defaultPageSize must be one of: ${PAGE_SIZES.join(', ')}`)
  }

  if (!isValidTimezone(body.timezone)) {
    errors.push('timezone must be a valid IANA timezone name')
  }

  if (typeof body.autoGenerateReportAfterRun !== 'boolean') {
    errors.push('autoGenerateReportAfterRun must be a boolean')
  }

  return errors
}

function getSettingsRow() {
  return db.prepare('SELECT * FROM user_preferences ORDER BY id ASC LIMIT 1').get()
}

function handleGetSettings(req, res) {
  const row = getSettingsRow()
  if (!row) return fail(res, 404, 'settings not found')
  ok(res, serializeSettings(row))
}

function handleUpdateSettings(req, res) {
  const errors = validateSettings(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  const existing = getSettingsRow()
  if (!existing) return fail(res, 404, 'settings not found')

  db.prepare(`
    UPDATE user_preferences
    SET theme = @theme,
        default_severity_for_new_bugs = @default_severity_for_new_bugs,
        default_page_size = @default_page_size,
        timezone = @timezone,
        auto_generate_report_after_run = @auto_generate_report_after_run,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: existing.id,
    theme: req.body.theme,
    default_severity_for_new_bugs: req.body.defaultSeverityForNewBugs,
    default_page_size: req.body.defaultPageSize,
    timezone: req.body.timezone,
    auto_generate_report_after_run: req.body.autoGenerateReportAfterRun ? 1 : 0,
    updated_at: new Date().toISOString(),
  })

  ok(res, serializeSettings(getSettingsRow()))
}

router.get('/', handleGetSettings)
router.put('/', handleUpdateSettings)

export default router
