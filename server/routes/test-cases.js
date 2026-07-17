import { Router } from 'express'
import db from '../db.js'

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped']
const PAGE_SIZE = 20

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeRow(row) {
  return {
    id: row.id,
    title: row.title,
    preconditions: row.preconditions,
    steps: JSON.parse(row.steps_json),
    expectedResult: row.expected_result,
    severity: row.severity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function validateTestCase(body) {
  const errors = []

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required')
  }

  if (!Array.isArray(body.steps) || body.steps.filter((s) => typeof s === 'string' && s.trim()).length === 0) {
    errors.push('steps is required and must be a non-empty list')
  }

  if (!body.expectedResult || typeof body.expectedResult !== 'string' || !body.expectedResult.trim()) {
    errors.push('expectedResult is required')
  }

  if (!SEVERITIES.includes(body.severity)) {
    errors.push(`severity must be one of: ${SEVERITIES.join(', ')}`)
  }

  const status = body.status || 'draft'
  if (!STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`)
  }

  return errors
}

function handleListTestCases(req, res) {
  const { search = '', status = '', sortBy = 'updatedAt', sortDir = 'desc', page = '1' } = req.query

  const sortColumn = sortBy === 'severity' ? 'severity_rank' : 'updated_at'
  const direction = sortDir === 'asc' ? 'ASC' : 'DESC'
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  const where = []
  const params = {}

  if (search) {
    where.push('title LIKE @search COLLATE NOCASE')
    params.search = `%${search}%`
  }

  if (status && STATUSES.includes(status)) {
    where.push('status = @status')
    params.status = status
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const baseQuery = `
    SELECT *,
      CASE severity
        WHEN 'Critical' THEN 1
        WHEN 'Major' THEN 2
        WHEN 'Minor' THEN 3
        WHEN 'Trivial' THEN 4
      END AS severity_rank
    FROM test_cases
    ${whereClause}
  `

  const total = db.prepare(`SELECT COUNT(*) AS count FROM (${baseQuery})`).get(params).count

  const rows = db
    .prepare(`${baseQuery} ORDER BY ${sortColumn} ${direction}, id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: PAGE_SIZE, offset })

  ok(res, {
    items: rows.map(serializeRow),
    total,
    page: pageNum,
    pageSize: PAGE_SIZE,
  })
}

function handleGetTestCase(req, res) {
  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id)
  if (!row) return fail(res, 404, 'test case not found')
  ok(res, serializeRow(row))
}

function handleCreateTestCase(req, res) {
  const errors = validateTestCase(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  const now = new Date().toISOString()
  const info = db
    .prepare(`
      INSERT INTO test_cases (title, preconditions, steps_json, expected_result, severity, status, created_at, updated_at)
      VALUES (@title, @preconditions, @steps_json, @expected_result, @severity, @status, @created_at, @updated_at)
    `)
    .run({
      title: req.body.title.trim(),
      preconditions: req.body.preconditions?.trim() || null,
      steps_json: JSON.stringify(req.body.steps.filter((s) => s.trim())),
      expected_result: req.body.expectedResult.trim(),
      severity: req.body.severity,
      status: req.body.status || 'draft',
      created_at: now,
      updated_at: now,
    })

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(info.lastInsertRowid)
  ok(res, serializeRow(row))
}

function handleUpdateTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'test case not found')

  const errors = validateTestCase(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  db.prepare(`
    UPDATE test_cases
    SET title = @title,
        preconditions = @preconditions,
        steps_json = @steps_json,
        expected_result = @expected_result,
        severity = @severity,
        status = @status,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: req.body.title.trim(),
    preconditions: req.body.preconditions?.trim() || null,
    steps_json: JSON.stringify(req.body.steps.filter((s) => s.trim())),
    expected_result: req.body.expectedResult.trim(),
    severity: req.body.severity,
    status: req.body.status || 'draft',
    updated_at: new Date().toISOString(),
  })

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id)
  ok(res, serializeRow(row))
}

function handleDeleteTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'test case not found')

  db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id)
  ok(res, { id: Number(req.params.id) })
}

router.get('/', handleListTestCases)
router.get('/:id', handleGetTestCase)
router.post('/', handleCreateTestCase)
router.put('/:id', handleUpdateTestCase)
router.delete('/:id', handleDeleteTestCase)

export default router
