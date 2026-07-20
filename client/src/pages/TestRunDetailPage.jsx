import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTestRun, updateTestRunResult } from '../api/test-runs.js'
import { createReport } from '../api/reports.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const RESULTS = ['passed', 'failed', 'skipped']

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

function TestRunDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notesDraft, setNotesDraft] = useState({})
  const [generating, setGenerating] = useState(false)

  async function load() {
    setError(null)
    try {
      const data = await getTestRun(id)
      setRun(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleRecordResult(testCaseId, result) {
    try {
      await updateTestRunResult(id, testCaseId, result, notesDraft[testCaseId])
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGenerateReport() {
    setGenerating(true)
    setError(null)
    try {
      const report = await createReport(run.id)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading && !run) {
    return (
      <div className="test-cases-page">
        <Link to="/test-runs" className="back-link">
          &larr; Back to Test Runs
        </Link>
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !run) {
    return (
      <div className="test-cases-page">
        <Link to="/test-runs" className="back-link">
          &larr; Back to Test Runs
        </Link>
        <p className="form-error">{error}</p>
      </div>
    )
  }

  if (!run) return null

  return (
    <div className="test-cases-page">
      <Link to="/test-runs" className="back-link">
        &larr; Back to Test Runs
      </Link>

      <div className="page-header">
        <div>
          <h1>{run.suiteName}</h1>
          <div className="detail-row">
            <StatusBadge status={run.status} />
            <span>Started {formatDate(run.startTime)}</span>
            {run.endTime && <span>Ended {formatDate(run.endTime)}</span>}
          </div>
        </div>
        <button className="primary" onClick={handleGenerateReport} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="metric-cards">
        <div className="metric-card">
          <p className="metric-label">Passed</p>
          <p className="metric-value">{run.passCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Failed</p>
          <p className="metric-value">{run.failCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Skipped</p>
          <p className="metric-value">{run.skipCount}</p>
        </div>
      </div>

      <h2>Results</h2>
      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Severity</th>
            <th>Result</th>
            <th>Notes</th>
            <th>Issue</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {run.results.map((r) => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>
                <SeverityBadge severity={r.severity} />
              </td>
              <td>{r.result ? <StatusBadge status={r.result} /> : '—'}</td>
              <td>
                <input
                  type="text"
                  placeholder="Notes..."
                  defaultValue={r.notes || ''}
                  onChange={(e) => setNotesDraft({ ...notesDraft, [r.testCaseId]: e.target.value })}
                />
              </td>
              <td>
                {r.githubIssueUrl ? (
                  <a href={r.githubIssueUrl} target="_blank" rel="noreferrer">
                    Issue
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td>
                <div className="result-actions">
                  {RESULTS.map((option) => (
                    <button key={option} onClick={() => handleRecordResult(r.testCaseId, option)}>
                      {option}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TestRunDetailPage
