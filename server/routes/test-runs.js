import { Router } from 'express'
import db from '../db.js'

const RESULTS = ['passed', 'failed', 'skipped']

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeRun(row) {
  return {
    id: row.id,
    suiteId: row.suite_id,
    suiteName: row.suite_name,
    status: row.status,
    passCount: row.pass_count,
    failCount: row.fail_count,
    skipCount: row.skip_count,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
  }
}

function serializeResult(row) {
  return {
    id: row.id,
    testCaseId: row.test_case_id,
    title: row.title,
    severity: row.severity,
    result: row.result,
    durationMs: row.duration_ms,
    notes: row.notes,
    failedAt: row.failed_at,
    githubIssueUrl: row.github_issue_url,
    sortOrder: row.sort_order,
  }
}

function getRunResults(runId) {
  return db
    .prepare(`
      SELECT rr.*, tc.title AS title, tc.severity AS severity
      FROM test_run_results rr
      JOIN test_cases tc ON tc.id = rr.test_case_id
      WHERE rr.run_id = ?
      ORDER BY rr.sort_order ASC
    `)
    .all(runId)
    .map(serializeResult)
}

async function createGithubIssue(title, notes) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_ISSUES_REPO

  if (!token || !repo) {
    console.error('GitHub issue creation skipped: GITHUB_TOKEN or GITHUB_ISSUES_REPO not configured')
    return null
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'bootcamp-app-test-runner',
      },
      body: JSON.stringify({
        title: `Test failed: ${title}`,
        body: notes?.trim() || '(no additional notes provided)',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`GitHub issue creation failed: ${res.status} ${errBody}`)
      return null
    }

    const issue = await res.json()
    return issue.html_url
  } catch (err) {
    console.error('GitHub issue creation threw:', err)
    return null
  }
}

function handleListTestRuns(req, res) {
  const rows = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      ORDER BY tr.start_time DESC
    `)
    .all()

  ok(res, { items: rows.map(serializeRun) })
}

function handleGetTestRun(req, res) {
  const row = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(req.params.id)

  if (!row) return fail(res, 404, 'run not found')

  ok(res, { ...serializeRun(row), results: getRunResults(row.id) })
}

function handleCreateTestRun(req, res) {
  const { suiteId } = req.body
  if (!suiteId) return fail(res, 400, 'suiteId is required')

  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(suiteId)
  if (!suite) return fail(res, 404, 'suite not found')

  const cases = db
    .prepare('SELECT test_case_id, sort_order FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suiteId)

  const now = new Date().toISOString()

  const createRun = db.transaction(() => {
    const info = db
      .prepare(`
        INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
        VALUES (?, 'in-progress', 0, 0, 0, ?, NULL, 'local-user')
      `)
      .run(suiteId, now)
    const runId = info.lastInsertRowid

    const insertResult = db.prepare(`
      INSERT INTO test_run_results (run_id, test_case_id, result, notes, sort_order)
      VALUES (?, ?, NULL, NULL, ?)
    `)
    for (const c of cases) {
      insertResult.run(runId, c.test_case_id, c.sort_order)
    }

    return runId
  })

  const runId = createRun()

  const row = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(runId)

  ok(res, { ...serializeRun(row), results: getRunResults(runId) })
}

async function handleUpdateTestRunResult(req, res) {
  const run = db.prepare('SELECT * FROM test_runs_v2 WHERE id = ?').get(req.params.id)
  if (!run) return fail(res, 404, 'run not found')

  const existing = db
    .prepare('SELECT * FROM test_run_results WHERE run_id = ? AND test_case_id = ?')
    .get(req.params.id, req.params.testCaseId)
  if (!existing) return fail(res, 404, 'test case not found in this run')

  const { result: newResult, notes } = req.body
  if (!RESULTS.includes(newResult)) {
    return fail(res, 400, `result must be one of: ${RESULTS.join(', ')}`)
  }

  const now = new Date().toISOString()
  let githubIssueUrl = existing.github_issue_url

  if (newResult === 'failed') {
    const testCase = db.prepare('SELECT title FROM test_cases WHERE id = ?').get(req.params.testCaseId)
    githubIssueUrl = await createGithubIssue(testCase.title, notes)
  }

  const updateResult = db.transaction(() => {
    db.prepare(`
      UPDATE test_run_results
      SET result = @result,
          notes = @notes,
          failed_at = @failed_at,
          github_issue_url = @github_issue_url
      WHERE run_id = @run_id AND test_case_id = @test_case_id
    `).run({
      result: newResult,
      notes: notes?.trim() || null,
      failed_at: newResult === 'failed' ? now : existing.failed_at,
      github_issue_url: githubIssueUrl,
      run_id: req.params.id,
      test_case_id: req.params.testCaseId,
    })

    const counts = { passed: 0, failed: 0, skipped: 0 }
    if (existing.result) counts[existing.result]--
    counts[newResult]++

    const newPassCount = run.pass_count + counts.passed
    const newFailCount = run.fail_count + counts.failed
    const newSkipCount = run.skip_count + counts.skipped

    const totalCases = db
      .prepare('SELECT COUNT(*) AS count FROM test_run_results WHERE run_id = ?')
      .get(req.params.id).count
    const doneCases = newPassCount + newFailCount + newSkipCount
    const isComplete = doneCases === totalCases
    const wasComplete = run.status === 'completed'

    db.prepare(`
      UPDATE test_runs_v2
      SET pass_count = ?, fail_count = ?, skip_count = ?, status = ?, end_time = ?
      WHERE id = ?
    `).run(
      newPassCount,
      newFailCount,
      newSkipCount,
      isComplete ? 'completed' : 'in-progress',
      isComplete ? (wasComplete ? run.end_time : now) : null,
      req.params.id
    )
  })

  updateResult()

  const row = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(req.params.id)

  ok(res, { ...serializeRun(row), results: getRunResults(req.params.id) })
}

router.get('/', handleListTestRuns)
router.get('/:id', handleGetTestRun)
router.post('/', handleCreateTestRun)
router.patch('/:id/cases/:testCaseId', handleUpdateTestRunResult)

export default router
