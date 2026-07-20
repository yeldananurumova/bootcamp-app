import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getReport, exportReportHtmlUrl } from '../api/reports.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ReportDetailPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getReport(id)
        setReport(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handlePrint() {
    setPrinting(true)
    try {
      const res = await fetch(exportReportHtmlUrl(id))
      const html = await res.text()
      const printWindow = window.open('', '_blank')
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => printWindow.print()
    } catch (err) {
      setError(err.message)
    } finally {
      setPrinting(false)
    }
  }

  if (loading && !report) {
    return (
      <div className="test-cases-page">
        <Link to="/reports" className="back-link">
          &larr; Back to Reports
        </Link>
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="test-cases-page">
        <Link to="/reports" className="back-link">
          &larr; Back to Reports
        </Link>
        <p className="form-error">{error}</p>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="test-cases-page">
      <Link to="/reports" className="back-link">
        &larr; Back to Reports
      </Link>

      <div className="page-header">
        <div>
          <h1>{report.suiteName}</h1>
          <p className="suite-feature">
            Run: {formatDate(report.runDate)} &bull; Generated: {formatDate(report.generatedAt)}
          </p>
        </div>
        <div className="bug-detail-actions">
          <a className="button-link" href={exportReportHtmlUrl(report.id)} download>
            Download HTML
          </a>
          <button onClick={handlePrint} disabled={printing}>
            {printing ? 'Preparing…' : 'Print / Save as PDF'}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="metric-cards">
        <div className="metric-card">
          <p className="metric-label">Total</p>
          <p className="metric-value">{report.totalCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Passed</p>
          <p className="metric-value">{report.passedCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Failed</p>
          <p className="metric-value">{report.failedCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Skipped</p>
          <p className="metric-value">{report.skippedCount}</p>
        </div>
      </div>

      <h2>Results</h2>
      <table className="test-cases-table">
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
          {report.results.length === 0 && (
            <tr>
              <td colSpan={6}>No results in this run.</td>
            </tr>
          )}
          {report.results.map((r) => (
            <tr key={r.testCaseId}>
              <td>{r.title}</td>
              <td>
                <SeverityBadge severity={r.severity} />
              </td>
              <td>{r.result ? <StatusBadge status={r.result} /> : '—'}</td>
              <td>{r.durationMs != null ? `${r.durationMs}ms` : '—'}</td>
              <td>{r.notes || '—'}</td>
              <td>
                {r.githubIssueUrl ? (
                  <a href={r.githubIssueUrl} target="_blank" rel="noreferrer">
                    Issue
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReportDetailPage
