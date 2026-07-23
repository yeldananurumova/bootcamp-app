import { Router } from 'express'
import db from '../db.js'

const router = Router()

function ok(res, data) {
  res.json({ success: true, data, error: null })
}

function fail(res, statusCode, error) {
  res.status(statusCode).json({ success: false, data: null, error })
}

function serializeReportSummary(row) {
  return {
    id: row.id,
    runId: row.run_id,
    suiteName: row.suite_name,
    runDate: row.run_date,
    totalCount: row.total_count,
    passedCount: row.passed_count,
    failedCount: row.failed_count,
    skippedCount: row.skipped_count,
    generatedAt: row.generated_at,
  }
}

function serializeReport(row) {
  return {
    ...serializeReportSummary(row),
    results: JSON.parse(row.results),
  }
}

function getReportRow(id) {
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(id)
}

function buildReportResults(runId) {
  return db
    .prepare(`
      SELECT rr.*, tc.title AS title, tc.severity AS severity
      FROM test_run_results rr
      JOIN test_cases tc ON tc.id = rr.test_case_id
      WHERE rr.run_id = ?
      ORDER BY rr.sort_order ASC
    `)
    .all(runId)
    .map((row) => ({
      testCaseId: row.test_case_id,
      title: row.title,
      severity: row.severity,
      result: row.result,
      notes: row.notes,
      durationMs: row.duration_ms,
      failedAt: row.failed_at,
      githubIssueUrl: row.github_issue_url,
    }))
}

function handleListReports(req, res) {
  const rows = db.prepare('SELECT * FROM reports ORDER BY generated_at DESC').all()
  ok(res, { items: rows.map(serializeReportSummary) })
}

function handleGetReport(req, res) {
  const row = getReportRow(req.params.id)
  if (!row) return fail(res, 404, 'report not found')

  ok(res, serializeReport(row))
}

function handleCreateReport(req, res) {
  const { runId } = req.body
  if (!runId) return fail(res, 400, 'runId is required')

  const run = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      WHERE tr.id = ?
    `)
    .get(runId)
  if (!run) return fail(res, 404, 'run not found')

  const results = buildReportResults(runId)
  const now = new Date().toISOString()

  const info = db
    .prepare(`
      INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
      VALUES (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
    `)
    .run({
      run_id: run.id,
      suite_name: run.suite_name,
      run_date: run.start_time,
      total_count: results.length,
      passed_count: run.pass_count,
      failed_count: run.fail_count,
      skipped_count: run.skip_count,
      results: JSON.stringify(results),
      generated_at: now,
    })

  ok(res, serializeReport(getReportRow(info.lastInsertRowid)))
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const RESULT_COLORS = {
  passed: { background: '#bbead0', color: '#0f5c2e' },
  failed: { background: '#fde2e1', color: '#9a1f1f' },
  skipped: { background: '#e6e9f0', color: '#5b6472' },
}

const SEVERITY_COLORS = {
  Critical: { background: '#fde2e1', color: '#9a1f1f' },
  Major: { background: '#fde8cc', color: '#9a5b1f' },
  Minor: { background: '#fdf3c7', color: '#7a5f16' },
  Trivial: { background: '#e3e6ea', color: '#4a5058' },
}

function badgeHtml(text, colorMap) {
  const style = colorMap[text] || { background: '#e3e6ea', color: '#4a5058' }
  return `<span class="badge" style="background:${style.background};color:${style.color}">${escapeHtml(text)}</span>`
}

function buildReportHtml(report) {
  const passRate =
    report.passedCount + report.failedCount > 0
      ? Math.round((report.passedCount / (report.passedCount + report.failedCount)) * 1000) / 10
      : null

  const rows = report.results
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.title)}</td>
        <td>${badgeHtml(r.severity, SEVERITY_COLORS)}</td>
        <td>${r.result ? badgeHtml(r.result, RESULT_COLORS) : '—'}</td>
        <td>${r.durationMs != null ? `${r.durationMs}ms` : '—'}</td>
        <td>${escapeHtml(r.notes) || '—'}</td>
        <td>${r.githubIssueUrl ? `<a href="${escapeHtml(r.githubIssueUrl)}">${escapeHtml(r.githubIssueUrl)}</a>` : '—'}</td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Test Report — ${escapeHtml(report.suiteName)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
    background: #f7f6f4;
    color: #22252a;
    line-height: 1.6;
    padding: 2.5rem;
  }
  .report {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e4e8;
    border-radius: 8px;
    padding: 2.5rem;
  }
  h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .meta { color: #6b7280; margin: 0 0 1.5rem; }
  .metric-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .metric-card {
    background: #f7f6f4;
    border: 1px solid #e2e4e8;
    border-radius: 8px;
    padding: 1.25rem;
  }
  .metric-label {
    color: #6b7280;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 0.4rem;
  }
  .metric-value { font-size: 1.5rem; font-weight: 700; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 0.7rem 0.85rem;
    border-bottom: 1px solid #eef0f2;
    font-size: 0.9rem;
    line-height: 1.4;
    vertical-align: top;
  }
  th { color: #6b7280; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; }
  .badge {
    display: inline-block;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  a { color: #0d5c56; }
  @media print {
    body { background: #ffffff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report { border: none; border-radius: 0; max-width: none; padding: 0.5in; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    a { color: #22252a; text-decoration: none; }
  }
</style>
</head>
<body>
  <div class="report">
    <h1>${escapeHtml(report.suiteName)}</h1>
    <p class="meta">Run: ${formatDateTime(report.runDate)} &bull; Generated: ${formatDateTime(report.generatedAt)}</p>

    <div class="metric-cards">
      <div class="metric-card">
        <p class="metric-label">Total</p>
        <p class="metric-value">${report.totalCount}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Passed</p>
        <p class="metric-value">${report.passedCount}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Failed</p>
        <p class="metric-value">${report.failedCount}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Skipped</p>
        <p class="metric-value">${report.skippedCount}</p>
      </div>
      <div class="metric-card">
        <p class="metric-label">Pass Rate</p>
        <p class="metric-value">${passRate == null ? 'N/A' : `${passRate}%`}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Severity</th>
          <th>Result</th>
          <th>Duration</th>
          <th>Notes</th>
          <th>Issue</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6">No results in this run.</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`
}

function handleExportReportHtml(req, res) {
  const row = getReportRow(req.params.id)
  if (!row) return fail(res, 404, 'report not found')

  const report = serializeReport(row)
  const html = buildReportHtml(report)
  const filename = `report-${report.id}-${report.suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(html)
}

router.get('/', handleListReports)
router.post('/', handleCreateReport)
router.get('/:id', handleGetReport)
router.get('/:id/export/html', handleExportReportHtml)

export default router
