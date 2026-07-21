import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBugs } from '../api/bugs.js'
import { onActivateKey } from '../utils/a11y.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import BugFormModal from '../components/BugFormModal.jsx'

const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened']
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']

const SEVERITY_RANK = { Critical: 1, Major: 2, Minor: 3, Trivial: 4 }
const PRIORITY_RANK = { Urgent: 1, High: 2, Medium: 3, Low: 4 }

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BugsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listBugs({ status, severity, search })
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
  }, [status, severity, search])

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }

  function sortIndicator(column) {
    if (sortBy !== column) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const sortedItems = [...items].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'severity') {
      cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    } else if (sortBy === 'priority') {
      cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    } else {
      cmp = new Date(a.updatedAt) - new Date(b.updatedAt)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Bugs</h1>
        <button className="primary" onClick={() => setShowForm(true)}>
          + New Bug
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          aria-label="Search by title or description"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select aria-label="Filter by severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="test-cases-table">
        <thead>
          <tr>
            <th>Title</th>
            <th
              className="sortable"
              tabIndex={0}
              role="button"
              aria-sort={sortBy === 'severity' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              onClick={() => toggleSort('severity')}
              onKeyDown={onActivateKey(() => toggleSort('severity'))}
            >
              Severity{sortIndicator('severity')}
            </th>
            <th
              className="sortable"
              tabIndex={0}
              role="button"
              aria-sort={sortBy === 'priority' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              onClick={() => toggleSort('priority')}
              onKeyDown={onActivateKey(() => toggleSort('priority'))}
            >
              Priority{sortIndicator('priority')}
            </th>
            <th>Status</th>
            <th
              className="sortable"
              tabIndex={0}
              role="button"
              aria-sort={sortBy === 'updatedAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              onClick={() => toggleSort('updatedAt')}
              onKeyDown={onActivateKey(() => toggleSort('updatedAt'))}
            >
              Updated{sortIndicator('updatedAt')}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5}>Loading...</td>
            </tr>
          )}
          {!loading && sortedItems.length === 0 && (
            <tr>
              <td colSpan={5}>No bugs found.</td>
            </tr>
          )}
          {!loading &&
            sortedItems.map((bug) => (
              <tr
                key={bug.id}
                className="clickable-row"
                tabIndex={0}
                role="button"
                aria-label={`View ${bug.title}`}
                onClick={() => navigate(`/bugs/${bug.id}`)}
                onKeyDown={onActivateKey(() => navigate(`/bugs/${bug.id}`))}
              >
                <td>{bug.title}</td>
                <td>
                  <SeverityBadge severity={bug.severity} />
                </td>
                <td>
                  <PriorityBadge priority={bug.priority} />
                </td>
                <td>
                  <StatusBadge status={bug.status} />
                </td>
                <td>{formatDate(bug.updatedAt)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {showForm && (
        <BugFormModal
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

export default BugsPage
