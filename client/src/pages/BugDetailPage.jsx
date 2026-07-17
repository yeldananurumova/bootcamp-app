import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBug, deleteBug, changeBugStatus, addBugComment } from '../api/bugs.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import StatusBadge, { STATUS_COLORS } from '../components/StatusBadge.jsx'
import BugFormModal from '../components/BugFormModal.jsx'

const TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BugDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bug, setBug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [statusChoice, setStatusChoice] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getBug(id)
      setBug(data)
      setStatusChoice(data.status)
      setStatusMessage('')
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

  async function handleStatusSubmit(e) {
    e.preventDefault()
    if (statusChoice === bug.status) return
    setSaving(true)
    try {
      await changeBugStatus(id, statusChoice, statusMessage.trim() || undefined)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      await addBugComment(id, comment.trim())
      setComment('')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the bug "${bug.title}"? This can't be undone.`)) return
    try {
      await deleteBug(id)
      navigate('/bugs')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading && !bug) {
    return (
      <div className="test-cases-page">
        <Link to="/bugs" className="back-link">
          &larr; Back to Bugs
        </Link>
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !bug) {
    return (
      <div className="test-cases-page">
        <Link to="/bugs" className="back-link">
          &larr; Back to Bugs
        </Link>
        <p className="form-error">{error}</p>
      </div>
    )
  }

  if (!bug) return null

  const allowedNext = TRANSITIONS[bug.status] || []

  return (
    <div className="test-cases-page">
      <Link to="/bugs" className="back-link">
        &larr; Back to Bugs
      </Link>

      <div className="page-header">
        <div>
          <h1>{bug.title}</h1>
          <div className="detail-row">
            <SeverityBadge severity={bug.severity} />
            <PriorityBadge priority={bug.priority} />
            <StatusBadge status={bug.status} />
          </div>
        </div>
        <div className="bug-detail-actions">
          <button onClick={() => setShowEditForm(true)}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="detail-view">
        <div className="detail-field">
          <h3>Description</h3>
          <p>{bug.description}</p>
        </div>

        <div className="detail-field">
          <h3>Steps to Reproduce</h3>
          <ol>
            {bug.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="detail-field">
          <h3>Expected</h3>
          <p>{bug.expected}</p>
        </div>

        <div className="detail-field">
          <h3>Actual</h3>
          <p>{bug.actual}</p>
        </div>

        {bug.environment && (
          <div className="detail-field">
            <h3>Environment</h3>
            <p>{bug.environment}</p>
          </div>
        )}

        <div className="detail-field">
          <h3>Reported</h3>
          <p>{formatDate(bug.createdAt)}</p>
        </div>
      </div>

      <h2>Change Status</h2>
      <form className="status-change-form" onSubmit={handleStatusSubmit}>
        <select
          value={statusChoice}
          onChange={(e) => setStatusChoice(e.target.value)}
          style={{
            background: STATUS_COLORS[statusChoice]?.background,
            color: STATUS_COLORS[statusChoice]?.color,
          }}
        >
          <option value={bug.status}>{bug.status} (current)</option>
          {allowedNext.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Optional note about this change..."
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
        />
        <button type="submit" className="primary" disabled={saving || statusChoice === bug.status}>
          Update Status
        </button>
      </form>

      <h2>Activity</h2>
      <ul className="activity-timeline">
        {bug.activity.length === 0 && <li className="activity-empty">No activity yet.</li>}
        {bug.activity.map((entry) => (
          <li key={entry.id} className="activity-entry">
            <div className="activity-meta">
              <span className="activity-date">{formatDate(entry.createdAt)}</span>
            </div>
            {entry.action === 'status_change' ? (
              <p>
                Status changed from <StatusBadge status={entry.oldValue} /> to{' '}
                <StatusBadge status={entry.newValue} />
                {entry.message && `: ${entry.message}`}
              </p>
            ) : (
              <p>{entry.message}</p>
            )}
          </li>
        ))}
      </ul>

      <form className="add-comment-form" onSubmit={handleAddComment}>
        <textarea
          rows={2}
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" className="primary" disabled={saving || !comment.trim()}>
          Add Comment
        </button>
      </form>

      {showEditForm && (
        <BugFormModal
          bug={bug}
          onClose={() => setShowEditForm(false)}
          onSaved={() => {
            setShowEditForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

export default BugDetailPage
