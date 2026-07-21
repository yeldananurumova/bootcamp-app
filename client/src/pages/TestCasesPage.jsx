import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listTestCases, getTestCase, deleteTestCase } from '../api/test-cases.js'
import { onActivateKey } from '../utils/a11y.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import TestCaseFormModal from '../components/TestCaseFormModal.jsx'
import TestCaseDetailModal from '../components/TestCaseDetailModal.jsx'

const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped']

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TestCasesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [modalState, setModalState] = useState(null) // null | 'new' | testCase object
  const [viewingTestCase, setViewingTestCase] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listTestCases({ search, status, sortBy, sortDir, page })
      setItems(data.items)
      setTotal(data.total)
      setPageSize(data.pageSize)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sortBy, sortDir, page])

  useEffect(() => {
    const openTestCaseId = location.state?.openTestCaseId
    if (!openTestCaseId) return

    navigate(location.pathname, { replace: true, state: null })

    getTestCase(openTestCaseId)
      .then(setViewingTestCase)
      .catch((err) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function handleSearchChange(value) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value) {
    setStatus(value)
    setPage(1)
  }

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

  async function handleDelete(testCase) {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${testCase.title}"? This can't be undone.`)) return
    try {
      await deleteTestCase(testCase.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Test Cases</h1>
        <div className="page-header-actions">
          <Link className="button-link" to="/test-cases/import">
            Import CSV
          </Link>
          <button className="primary" onClick={() => setModalState('new')}>
            + Add Test Case
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          aria-label="Search by title"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        <select aria-label="Filter by status" value={status} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
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
            <th></th>
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
              <td colSpan={5}>No test cases found.</td>
            </tr>
          )}
          {!loading &&
            items.map((tc) => (
              <tr
                key={tc.id}
                className="clickable-row"
                tabIndex={0}
                role="button"
                aria-label={`View ${tc.title}`}
                onClick={() => setViewingTestCase(tc)}
                onKeyDown={onActivateKey(() => setViewingTestCase(tc))}
              >
                <td>{tc.title}</td>
                <td>
                  <SeverityBadge severity={tc.severity} />
                </td>
                <td>
                  <StatusBadge status={tc.status} />
                </td>
                <td>{formatDate(tc.updatedAt)}</td>
                <td className="row-menu-cell" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="row-menu-trigger"
                    aria-label="More actions"
                    onClick={() => setOpenMenuId(openMenuId === tc.id ? null : tc.id)}
                  >
                    ⋮
                  </button>
                  {openMenuId === tc.id && (
                    <div className="row-menu">
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          setModalState(tc)
                        }}
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(tc)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {modalState && (
        <TestCaseFormModal
          testCase={modalState === 'new' ? null : modalState}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null)
            load()
          }}
        />
      )}

      {viewingTestCase && (
        <TestCaseDetailModal
          testCase={viewingTestCase}
          onClose={() => setViewingTestCase(null)}
          onEdit={() => {
            setModalState(viewingTestCase)
            setViewingTestCase(null)
          }}
        />
      )}
    </div>
  )
}

export default TestCasesPage
