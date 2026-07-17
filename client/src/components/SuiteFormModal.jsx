import { useState } from 'react'
import { createSuite } from '../api/suites.js'

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed']

function SuiteFormModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [feature, setFeature] = useState('')
  const [status, setStatus] = useState('draft')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !feature.trim()) {
      setError('Name and feature are both required.')
      return
    }

    setSaving(true)
    try {
      const suite = await createSuite({ name: name.trim(), feature: feature.trim(), status })
      onSaved(suite)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Suite</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Name *
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label>
            Feature *
            <input
              type="text"
              placeholder="e.g. login"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
            />
          </label>

          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
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

export default SuiteFormModal
