import { Router } from 'express'
import db from '../db.js'

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed']

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeSuite(row) {
  return {
    id: row.id,
    name: row.name,
    feature: row.feature,
    status: row.status,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function validateSuite(body) {
  const errors = []

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required')
  }

  if (!body.feature || typeof body.feature !== 'string' || !body.feature.trim()) {
    errors.push('feature is required')
  }

  const status = body.status || 'draft'
  if (!STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`)
  }

  return errors
}

function getSuiteCases(suiteId) {
  return db
    .prepare(`
      SELECT tc.id AS id, tc.title AS title, tc.severity AS severity, tc.status AS status, stc.sort_order AS sort_order
      FROM suite_test_cases stc
      JOIN test_cases tc ON tc.id = stc.test_case_id
      WHERE stc.suite_id = ?
      ORDER BY stc.sort_order ASC
    `)
    .all(suiteId)
    .map((row) => ({
      id: row.id,
      title: row.title,
      severity: row.severity,
      status: row.status,
      sortOrder: row.sort_order,
    }))
}

function handleListSuites(req, res) {
  const { status = '' } = req.query

  const where = []
  const params = {}

  if (status && STATUSES.includes(status)) {
    where.push('s.status = @status')
    params.status = status
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = db
    .prepare(`
      SELECT s.*, COUNT(stc.id) AS case_count
      FROM suites s
      LEFT JOIN suite_test_cases stc ON stc.suite_id = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `)
    .all(params)

  ok(res, { items: rows.map(serializeSuite) })
}

function handleGetSuite(req, res) {
  const row = db
    .prepare(`
      SELECT s.*, COUNT(stc.id) AS case_count
      FROM suites s
      LEFT JOIN suite_test_cases stc ON stc.suite_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `)
    .get(req.params.id)

  if (!row) return fail(res, 404, 'suite not found')

  ok(res, { ...serializeSuite(row), cases: getSuiteCases(row.id) })
}

function handleCreateSuite(req, res) {
  const errors = validateSuite(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  const now = new Date().toISOString()
  const info = db
    .prepare(`
      INSERT INTO suites (name, feature, status, created_at, updated_at)
      VALUES (@name, @feature, @status, @created_at, @updated_at)
    `)
    .run({
      name: req.body.name.trim(),
      feature: req.body.feature.trim(),
      status: req.body.status || 'draft',
      created_at: now,
      updated_at: now,
    })

  const row = db
    .prepare(`SELECT *, 0 AS case_count FROM suites WHERE id = ?`)
    .get(info.lastInsertRowid)
  ok(res, serializeSuite(row))
}

function handleUpdateSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'suite not found')

  const errors = validateSuite(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  db.prepare(`
    UPDATE suites
    SET name = @name, feature = @feature, status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: req.body.name.trim(),
    feature: req.body.feature.trim(),
    status: req.body.status || 'draft',
    updated_at: new Date().toISOString(),
  })

  const row = db
    .prepare(`
      SELECT s.*, COUNT(stc.id) AS case_count
      FROM suites s
      LEFT JOIN suite_test_cases stc ON stc.suite_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `)
    .get(req.params.id)
  ok(res, serializeSuite(row))
}

function handleDeleteSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'suite not found')

  db.prepare('DELETE FROM suites WHERE id = ?').run(req.params.id)
  ok(res, { id: Number(req.params.id) })
}

function handleReorderSuiteCases(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id)
  if (!suite) return fail(res, 404, 'suite not found')

  const { testCaseIds } = req.body
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    return fail(res, 400, 'testCaseIds is required and must be a non-empty list')
  }

  const existingRows = db
    .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ?')
    .all(req.params.id)
  const existingIds = new Set(existingRows.map((r) => r.test_case_id))
  const incomingIds = new Set(testCaseIds)

  if (existingIds.size !== incomingIds.size || [...existingIds].some((id) => !incomingIds.has(id))) {
    return fail(res, 400, 'testCaseIds must contain exactly the test cases currently in this suite')
  }

  const reorder = db.transaction((ids) => {
    const update = db.prepare(
      'UPDATE suite_test_cases SET sort_order = ? WHERE suite_id = ? AND test_case_id = ?'
    )
    ids.forEach((testCaseId, index) => {
      update.run(index + 1, req.params.id, testCaseId)
    })
  })

  reorder(testCaseIds)
  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)

  ok(res, { cases: getSuiteCases(req.params.id) })
}

function handleAddSuiteCase(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id)
  if (!suite) return fail(res, 404, 'suite not found')

  const { testCaseId } = req.body
  if (!testCaseId) return fail(res, 400, 'testCaseId is required')

  const testCase = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(testCaseId)
  if (!testCase) return fail(res, 404, 'test case not found')

  const alreadyInSuite = db
    .prepare('SELECT 1 FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?')
    .get(req.params.id, testCaseId)
  if (alreadyInSuite) return fail(res, 400, 'test case is already in this suite')

  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM suite_test_cases WHERE suite_id = ?')
    .get(req.params.id).max_order

  db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (?, ?, ?)
  `).run(req.params.id, testCaseId, maxOrder + 1)

  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)

  ok(res, { cases: getSuiteCases(req.params.id) })
}

function handleRemoveSuiteCase(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id)
  if (!suite) return fail(res, 404, 'suite not found')

  const existing = db
    .prepare('SELECT * FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?')
    .get(req.params.id, req.params.testCaseId)
  if (!existing) return fail(res, 404, 'test case not found in this suite')

  const renumber = db.transaction(() => {
    db.prepare('DELETE FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?').run(
      req.params.id,
      req.params.testCaseId
    )

    const remaining = db
      .prepare('SELECT id FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
      .all(req.params.id)

    const update = db.prepare('UPDATE suite_test_cases SET sort_order = ? WHERE id = ?')
    remaining.forEach((row, index) => update.run(index + 1, row.id))
  })

  renumber()
  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id)

  ok(res, { cases: getSuiteCases(req.params.id) })
}

router.get('/', handleListSuites)
router.get('/:id', handleGetSuite)
router.post('/', handleCreateSuite)
router.put('/:id', handleUpdateSuite)
router.delete('/:id', handleDeleteSuite)
router.put('/:id/reorder', handleReorderSuiteCases)
router.post('/:id/cases', handleAddSuiteCase)
router.delete('/:id/cases/:testCaseId', handleRemoveSuiteCase)

export default router
