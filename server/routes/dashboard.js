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

router.get('/metrics', handleGetDashboardMetrics)

export default router
