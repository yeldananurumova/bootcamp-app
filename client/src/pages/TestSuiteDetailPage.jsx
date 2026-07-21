import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getSuite,
  updateSuite,
  deleteSuite,
  reorderSuiteCases,
  addSuiteCase,
  removeSuiteCase,
} from '../api/suites.js'
import { listAllTestCases } from '../api/test-cases.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatusBadge, { STATUS_COLORS } from '../components/StatusBadge.jsx'

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed']

function TestSuiteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [suite, setSuite] = useState(null)
  const [availableCases, setAvailableCases] = useState([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [suiteData, allCases] = await Promise.all([getSuite(id), listAllTestCases()])
      setSuite(suiteData)
      const inSuiteIds = new Set(suiteData.cases.map((c) => c.id))
      setAvailableCases(allCases.filter((c) => !inSuiteIds.has(c.id)))
      setSelectedCaseId('')
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

  async function handleStatusChange(newStatus) {
    try {
      await updateSuite(id, { name: suite.name, feature: suite.feature, status: newStatus })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddCase() {
    if (!selectedCaseId) return
    try {
      await addSuiteCase(id, Number(selectedCaseId))
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveCase(testCase) {
    if (!window.confirm(`Remove "${testCase.title}" from this suite?`)) return
    try {
      await removeSuiteCase(id, testCase.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteSuite() {
    if (!window.confirm(`Delete the suite "${suite.name}"? This can't be undone.`)) return
    try {
      await deleteSuite(id)
      navigate('/test-suites')
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDragStart(index) {
    setDragIndex(index)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) return

    const reordered = [...suite.cases]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    setSuite({ ...suite, cases: reordered })
    setDragIndex(null)

    try {
      await reorderSuiteCases(
        id,
        reordered.map((c) => c.id)
      )
      load()
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  if (loading && !suite) {
    return (
      <div className="test-cases-page">
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !suite) {
    return (
      <div className="test-cases-page">
        <p className="form-error">{error}</p>
      </div>
    )
  }

  if (!suite) return null

  return (
    <div className="test-cases-page">
      <Link to="/test-suites" className="back-link">
        &larr; Back to Test Suites
      </Link>

      <div className="page-header">
        <div>
          <h1>{suite.name}</h1>
          <p className="suite-feature">Feature: {suite.feature}</p>
        </div>
        <label className="suite-status-field">
          Status
          <select
            value={suite.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              background: STATUS_COLORS[suite.status]?.background,
              color: STATUS_COLORS[suite.status]?.color,
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleDeleteSuite}>Delete Suite</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <h2>Cases ({suite.cases.length})</h2>
      <p className="drag-hint">Drag rows to reorder.</p>

      <table className="test-cases-table">
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {suite.cases.length === 0 && (
            <tr>
              <td colSpan={5}>No cases in this suite yet.</td>
            </tr>
          )}
          {suite.cases.map((tc, index) => (
            <tr
              key={tc.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="draggable-row"
            >
              <td className="drag-handle" aria-hidden="true">⠿</td>
              <td>{tc.title}</td>
              <td>
                <SeverityBadge severity={tc.severity} />
              </td>
              <td>
                <StatusBadge status={tc.status} />
              </td>
              <td>
                <button onClick={() => handleRemoveCase(tc)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-case-row">
        <select
          aria-label="Add a test case to this suite"
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
        >
          <option value="">Add a test case...</option>
          {availableCases.map((tc) => (
            <option key={tc.id} value={tc.id}>
              {tc.title}
            </option>
          ))}
        </select>
        <button className="primary" onClick={handleAddCase} disabled={!selectedCaseId}>
          Add to Suite
        </button>
      </div>
    </div>
  )
}

export default TestSuiteDetailPage
