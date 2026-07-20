import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports } from '../api/reports.js'

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

function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await listReports()
        setReports(data.items)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Suite</th>
              <th>Run Date</th>
              <th>Total</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Skipped</th>
              <th>Generated</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={7}>No reports yet.</td>
              </tr>
            )}
            {reports.map((report) => (
              <tr key={report.id} className="clickable-row">
                <td>
                  <Link to={`/reports/${report.id}`}>{report.suiteName}</Link>
                </td>
                <td>{formatDate(report.runDate)}</td>
                <td>{report.totalCount}</td>
                <td>{report.passedCount}</td>
                <td>{report.failedCount}</td>
                <td>{report.skippedCount}</td>
                <td>{formatDate(report.generatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ReportsPage
