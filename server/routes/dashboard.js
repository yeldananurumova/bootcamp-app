import { Router } from 'express'
import db from '../db.js'

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

const MAX_SUMMARY_LEN = 80

function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function summarizeActivity(row) {
  if (row.action === 'status_change') {
    return `bug #${row.bug_id} marked ${row.new_value}`
  }
  return `bug #${row.bug_id} commented: "${truncate(row.message, MAX_SUMMARY_LEN)}"`
}

function serializeRun(row) {
  return {
    id: row.id,
    suiteName: row.suite_name,
    status: row.status,
    passCount: row.pass_count,
    failCount: row.fail_count,
    skipCount: row.skip_count,
    startTime: row.start_time,
    endTime: row.end_time,
  }
}

function serializeActivity(row) {
  return {
    id: row.id,
    bugId: row.bug_id,
    bugTitle: row.bug_title,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    message: row.message,
    createdAt: row.created_at,
    summary: summarizeActivity(row),
  }
}

function handleGetDashboardMetrics(req, res) {
  const totalTestCases = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get().count

  const resultCounts = db
    .prepare(`
      SELECT result, COUNT(*) AS count
      FROM test_run_results
      WHERE result IS NOT NULL
      GROUP BY result
    `)
    .all()
  const counts = { passed: 0, failed: 0, skipped: 0 }
  for (const row of resultCounts) counts[row.result] = row.count
  const executedTotal = counts.passed + counts.failed
  const passRate = executedTotal > 0 ? Math.round((counts.passed / executedTotal) * 1000) / 10 : null

  const openBugs = db
    .prepare(`SELECT COUNT(*) AS count FROM bugs WHERE status NOT IN ('resolved', 'closed')`)
    .get().count

  const completedRuns = db
    .prepare(`SELECT start_time, end_time FROM test_runs_v2 WHERE status = 'completed' AND end_time IS NOT NULL`)
    .all()
  let avgRunDurationSeconds = null
  if (completedRuns.length > 0) {
    const totalSeconds = completedRuns.reduce((sum, run) => {
      const durationMs = new Date(run.end_time).getTime() - new Date(run.start_time).getTime()
      return sum + durationMs / 1000
    }, 0)
    avgRunDurationSeconds = Math.round(totalSeconds / completedRuns.length)
  }

  const recentRuns = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      ORDER BY tr.start_time DESC
      LIMIT 10
    `)
    .all()
    .map(serializeRun)

  const recentActivity = db
    .prepare(`
      SELECT ba.*, b.title AS bug_title
      FROM bug_activity ba
      JOIN bugs b ON b.id = ba.bug_id
      ORDER BY ba.created_at DESC
      LIMIT 10
    `)
    .all()
    .map(serializeActivity)

  ok(res, {
    metrics: {
      totalTestCases,
      passRate,
      openBugs,
      avgRunDurationSeconds,
    },
    recentRuns,
    recentActivity,
  })
}

const TEST_CASE_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped']
const WEEKS_OF_BUG_HISTORY = 8
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const RUN_TREND_LIMIT = 10

function getPassRateTrend() {
  const runs = db
    .prepare(`
      SELECT id, start_time, pass_count, fail_count
      FROM test_runs_v2
      ORDER BY start_time DESC
      LIMIT ?
    `)
    .all(RUN_TREND_LIMIT)
    .reverse()

  return runs.map((run) => {
    const executed = run.pass_count + run.fail_count
    return {
      runId: run.id,
      date: run.start_time,
      passRate: executed > 0 ? Math.round((run.pass_count / executed) * 1000) / 10 : null,
    }
  })
}

function getBugsPerWeek() {
  const now = Date.now()
  const buckets = Array.from({ length: WEEKS_OF_BUG_HISTORY }, (_, i) => {
    const end = now - (WEEKS_OF_BUG_HISTORY - 1 - i) * WEEK_MS
    return { start: end - WEEK_MS, end, opened: 0, closed: 0 }
  })

  function bucketFor(iso) {
    const t = new Date(iso).getTime()
    return buckets.find((bucket) => t >= bucket.start && t < bucket.end)
  }

  for (const row of db.prepare('SELECT created_at FROM bugs').all()) {
    const bucket = bucketFor(row.created_at)
    if (bucket) bucket.opened += 1
  }

  const closedEvents = db
    .prepare(`SELECT created_at FROM bug_activity WHERE action = 'status_change' AND new_value = 'closed'`)
    .all()
  for (const row of closedEvents) {
    const bucket = bucketFor(row.created_at)
    if (bucket) bucket.closed += 1
  }

  return buckets.map((bucket) => ({
    weekStart: new Date(bucket.start).toISOString(),
    weekEnd: new Date(bucket.end).toISOString(),
    opened: bucket.opened,
    closed: bucket.closed,
  }))
}

function getTestCoverage() {
  const rows = db.prepare('SELECT status, COUNT(*) AS count FROM test_cases GROUP BY status').all()
  const counts = Object.fromEntries(TEST_CASE_STATUSES.map((status) => [status, 0]))
  for (const row of rows) counts[row.status] = row.count
  return TEST_CASE_STATUSES.map((status) => ({ status, count: counts[status] }))
}

function handleGetDashboardTrends(req, res) {
  ok(res, {
    passRateTrend: getPassRateTrend(),
    bugsPerWeek: getBugsPerWeek(),
    testCoverage: getTestCoverage(),
  })
}

router.get('/metrics', handleGetDashboardMetrics)
router.get('/trends', handleGetDashboardTrends)

export default router
