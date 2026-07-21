import { useRef, useState } from 'react'
import { createBug, updateBug } from '../api/bugs.js'
import { useSettings } from '../context/SettingsContext.jsx'
import { useModalA11y } from '../hooks/useModalA11y.js'

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']

function toFormState(bug, defaultSeverity) {
  return {
    title: bug?.title || '',
    description: bug?.description || '',
    steps: bug?.steps?.join('\n') || '',
    expected: bug?.expected || '',
    actual: bug?.actual || '',
    environment: bug?.environment || '',
    severity: bug?.severity || defaultSeverity || '',
    priority: bug?.priority || 'Medium',
  }
}

function BugFormModal({ bug, onClose, onSaved }) {
  const isEdit = Boolean(bug)
  const { settings } = useSettings()
  const [form, setForm] = useState(() => toFormState(bug, settings?.defaultSeverityForNewBugs))
  const [error, setError] = useState(null)
  const modalRef = useRef(null)
  useModalA11y(modalRef, onClose)
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const steps = form.steps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      steps.length === 0 ||
      !form.expected.trim() ||
      !form.actual.trim() ||
      !form.severity
    ) {
      setError('Title, description, steps, expected, actual, and severity are all required.')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      steps,
      expected: form.expected.trim(),
      actual: form.actual.trim(),
      environment: form.environment.trim() || undefined,
      severity: form.severity,
      priority: form.priority,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateBug(bug.id, payload)
      } else {
        await createBug(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-form-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bug-form-modal-title">{isEdit ? 'Edit Bug' : 'New Bug'}</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Title *
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </label>

          <label>
            Description *
            <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>

          <label>
            Steps to Reproduce * (one per line)
            <textarea rows={4} value={form.steps} onChange={(e) => update('steps', e.target.value)} />
          </label>

          <label>
            Expected *
            <textarea rows={2} value={form.expected} onChange={(e) => update('expected', e.target.value)} />
          </label>

          <label>
            Actual *
            <textarea rows={2} value={form.actual} onChange={(e) => update('actual', e.target.value)} />
          </label>

          <label>
            Environment
            <input
              type="text"
              placeholder="e.g. Chrome 120 on macOS 14"
              value={form.environment}
              onChange={(e) => update('environment', e.target.value)}
            />
          </label>

          <label>
            Severity *
            <select value={form.severity} onChange={(e) => update('severity', e.target.value)}>
              <option value="" disabled>
                Select severity
              </option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BugFormModal
