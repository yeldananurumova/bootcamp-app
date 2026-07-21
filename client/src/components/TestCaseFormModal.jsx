import { useRef, useState } from 'react'
import { createTestCase, updateTestCase } from '../api/test-cases.js'
import { useModalA11y } from '../hooks/useModalA11y.js'

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped']

function toFormState(testCase) {
  return {
    title: testCase?.title || '',
    preconditions: testCase?.preconditions || '',
    steps: testCase?.steps?.join('\n') || '',
    expectedResult: testCase?.expectedResult || '',
    severity: testCase?.severity || '',
    status: testCase?.status || 'draft',
  }
}

function TestCaseFormModal({ testCase, onClose, onSaved }) {
  const isEdit = Boolean(testCase)
  const [form, setForm] = useState(() => toFormState(testCase))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const modalRef = useRef(null)
  useModalA11y(modalRef, onClose)

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

    if (!form.title.trim() || steps.length === 0 || !form.expectedResult.trim() || !form.severity) {
      setError('Title, steps, expected result, and severity are all required.')
      return
    }

    const payload = {
      title: form.title.trim(),
      preconditions: form.preconditions.trim() || undefined,
      steps,
      expectedResult: form.expectedResult.trim(),
      severity: form.severity,
      status: form.status,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateTestCase(testCase.id, payload)
      } else {
        await createTestCase(payload)
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
        aria-labelledby="test-case-form-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="test-case-form-modal-title">{isEdit ? 'Edit Test Case' : 'New Test Case'}</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Title *
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </label>

          <label>
            Preconditions
            <textarea
              rows={2}
              value={form.preconditions}
              onChange={(e) => update('preconditions', e.target.value)}
            />
          </label>

          <label>
            Steps * (one per line)
            <textarea
              rows={4}
              value={form.steps}
              onChange={(e) => update('steps', e.target.value)}
            />
          </label>

          <label>
            Expected Result *
            <textarea
              rows={2}
              value={form.expectedResult}
              onChange={(e) => update('expectedResult', e.target.value)}
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
            Status
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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

export default TestCaseFormModal
