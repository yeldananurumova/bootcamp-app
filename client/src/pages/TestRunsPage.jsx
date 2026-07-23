import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTestRuns } from '../api/test-runs.js'
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

function TestRunsPage() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await listTestRuns()
        setRuns(data.items)
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
        <h1>Test Runs</h1>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <div className="table-scroll">
        <table className="test-cases-table">
          <thead>
            <tr>
              <th>Suite</th>
              <th>Status</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Skip</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={6}>No test runs yet.</td>
              </tr>
            )}
            {runs.map((run) => (
              <tr key={run.id} className="clickable-row">
                <td>
                  <Link to={`/test-runs/${run.id}`}>{run.suiteName}</Link>
                </td>
                <td>
                  <StatusBadge status={run.status} />
                </td>
                <td>{run.passCount}</td>
                <td>{run.failCount}</td>
                <td>{run.skipCount}</td>
                <td>{formatDate(run.startTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

export default TestRunsPage
