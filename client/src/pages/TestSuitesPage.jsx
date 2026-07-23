import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listSuites } from '../api/suites.js'
import { onActivateKey } from '../utils/a11y.js'
import SuiteFormModal from '../components/SuiteFormModal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed']

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TestSuitesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listSuites({ status })
      setItems(data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Suites</h1>
        <button className="primary" onClick={() => setShowForm(true)}>
          + New Suite
        </button>
      </div>

      <div className="toolbar">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="table-scroll">
      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Feature</th>
            <th>Status</th>
            <th># Cases</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5}>Loading...</td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={5}>No suites found.</td>
            </tr>
          )}
          {!loading &&
            items.map((suite) => (
              <tr
                key={suite.id}
                className="clickable-row"
                tabIndex={0}
                role="button"
                aria-label={`View ${suite.name}`}
                onClick={() => navigate(`/test-suites/${suite.id}`)}
                onKeyDown={onActivateKey(() => navigate(`/test-suites/${suite.id}`))}
              >
                <td>{suite.name}</td>
                <td>{suite.feature}</td>
                <td>
                  <StatusBadge status={suite.status} />
                </td>
                <td>{suite.caseCount}</td>
                <td>{formatDate(suite.updatedAt)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>

      {showForm && (
        <SuiteFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

export default TestSuitesPage
