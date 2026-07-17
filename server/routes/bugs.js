import { Router } from 'express'
import db from '../db.js'

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']
const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened']

const TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
}

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeBug(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    steps: JSON.parse(row.steps_json),
    expected: row.expected,
    actual: row.actual,
    environment: row.environment,
    severity: row.severity,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function serializeActivity(row) {
  return {
    id: row.id,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    message: row.message,
    createdAt: row.created_at,
  }
}

function getBugActivity(bugId) {
  return db
    .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY created_at ASC, id ASC')
    .all(bugId)
    .map(serializeActivity)
}

function validateBug(body) {
  const errors = []

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required')
  }

  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.push('description is required')
  }

  if (!Array.isArray(body.steps) || body.steps.filter((s) => typeof s === 'string' && s.trim()).length === 0) {
    errors.push('steps is required and must be a non-empty list')
  }

  if (!body.expected || typeof body.expected !== 'string' || !body.expected.trim()) {
    errors.push('expected is required')
  }

  if (!body.actual || typeof body.actual !== 'string' || !body.actual.trim()) {
    errors.push('actual is required')
  }

  if (!SEVERITIES.includes(body.severity)) {
    errors.push(`severity must be one of: ${SEVERITIES.join(', ')}`)
  }

  const priority = body.priority || 'Medium'
  if (!PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`)
  }

  return errors
}

function handleListBugs(req, res) {
  const { status = '', severity = '', priority = '', search = '' } = req.query

  const where = []
  const params = {}

  if (status && STATUSES.includes(status)) {
    where.push('status = @status')
    params.status = status
  }

  if (severity && SEVERITIES.includes(severity)) {
    where.push('severity = @severity')
    params.severity = severity
  }

  if (priority && PRIORITIES.includes(priority)) {
    where.push('priority = @priority')
    params.priority = priority
  }

  if (search) {
    where.push('(title LIKE @search COLLATE NOCASE OR description LIKE @search COLLATE NOCASE)')
    params.search = `%${search}%`
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = db
    .prepare(`SELECT * FROM bugs ${whereClause} ORDER BY updated_at DESC`)
    .all(params)

  ok(res, { items: rows.map(serializeBug) })
}

function handleGetBug(req, res) {
  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  if (!row) return fail(res, 404, 'bug not found')

  ok(res, { ...serializeBug(row), activity: getBugActivity(row.id) })
}

function handleCreateBug(req, res) {
  const errors = validateBug(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  const now = new Date().toISOString()
  const info = db
    .prepare(`
      INSERT INTO bugs (title, description, steps_json, expected, actual, environment, severity, priority, status, created_at, updated_at)
      VALUES (@title, @description, @steps_json, @expected, @actual, @environment, @severity, @priority, @status, @created_at, @updated_at)
    `)
    .run({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      steps_json: JSON.stringify(req.body.steps.filter((s) => typeof s === 'string' && s.trim())),
      expected: req.body.expected.trim(),
      actual: req.body.actual.trim(),
      environment: req.body.environment?.trim() || null,
      severity: req.body.severity,
      priority: req.body.priority || 'Medium',
      status: 'open',
      created_at: now,
      updated_at: now,
    })

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(info.lastInsertRowid)
  ok(res, { ...serializeBug(row), activity: [] })
}

function handleUpdateBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'bug not found')

  const errors = validateBug(req.body)
  if (errors.length) return fail(res, 400, errors.join('; '))

  db.prepare(`
    UPDATE bugs
    SET title = @title,
        description = @description,
        steps_json = @steps_json,
        expected = @expected,
        actual = @actual,
        environment = @environment,
        severity = @severity,
        priority = @priority,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    steps_json: JSON.stringify(req.body.steps.filter((s) => typeof s === 'string' && s.trim())),
    expected: req.body.expected.trim(),
    actual: req.body.actual.trim(),
    environment: req.body.environment?.trim() || null,
    severity: req.body.severity,
    priority: req.body.priority || 'Medium',
    updated_at: new Date().toISOString(),
  })

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  ok(res, { ...serializeBug(row), activity: getBugActivity(row.id) })
}

function handleDeleteBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'bug not found')

  db.prepare('DELETE FROM bugs WHERE id = ?').run(req.params.id)
  ok(res, { id: Number(req.params.id) })
}

function handleChangeBugStatus(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'bug not found')

  const { status: newStatus, message } = req.body

  if (!STATUSES.includes(newStatus)) {
    return fail(res, 400, `status must be one of: ${STATUSES.join(', ')}`)
  }

  const allowedNext = TRANSITIONS[existing.status] || []
  if (!allowedNext.includes(newStatus)) {
    return fail(
      res,
      400,
      `cannot transition from ${existing.status} to ${newStatus}; allowed: ${allowedNext.join(', ') || 'none'}`
    )
  }

  const now = new Date().toISOString()

  const changeStatus = db.transaction(() => {
    db.prepare('UPDATE bugs SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, req.params.id)
    db.prepare(`
      INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at)
      VALUES (?, 'status_change', ?, ?, ?, ?)
    `).run(req.params.id, existing.status, newStatus, message?.trim() || null, now)
  })

  changeStatus()

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  ok(res, { ...serializeBug(row), activity: getBugActivity(row.id) })
}

function handleAddBugComment(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id)
  if (!existing) return fail(res, 404, 'bug not found')

  const { message } = req.body
  if (!message || typeof message !== 'string' || !message.trim()) {
    return fail(res, 400, 'message is required')
  }

  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at)
    VALUES (?, 'comment', NULL, NULL, ?, ?)
  `).run(req.params.id, message.trim(), now)

  db.prepare('UPDATE bugs SET updated_at = ? WHERE id = ?').run(now, req.params.id)

  ok(res, { activity: getBugActivity(req.params.id) })
}

router.get('/', handleListBugs)
router.get('/:id', handleGetBug)
router.post('/', handleCreateBug)
router.put('/:id', handleUpdateBug)
router.delete('/:id', handleDeleteBug)
router.patch('/:id/status', handleChangeBugStatus)
router.post('/:id/comments', handleAddBugComment)

export default router
