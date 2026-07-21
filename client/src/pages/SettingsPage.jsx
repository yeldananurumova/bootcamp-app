import { useEffect, useState } from 'react'
import { useSettings } from '../context/SettingsContext.jsx'
import { updateSettings } from '../api/settings.js'

const THEMES = ['light', 'dark', 'system']
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const PAGE_SIZES = [10, 20, 50, 100]

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return [BROWSER_TIMEZONE]
  }
})()

function toFormState(settings) {
  return {
    theme: settings.theme,
    defaultSeverityForNewBugs: settings.defaultSeverityForNewBugs,
    defaultPageSize: settings.defaultPageSize,
    timezone: settings.timezone || BROWSER_TIMEZONE,
    autoGenerateReportAfterRun: settings.autoGenerateReportAfterRun,
  }
}

function SettingsPage() {
  const { settings, loading, error: loadError, refresh } = useSettings()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(toFormState(settings))
  }, [settings])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      await updateSettings(form)
      await refresh()
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="test-cases-page">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <p>Loading...</p>
      </div>
    )
  }

  if (loadError && !form) {
    return (
      <div className="test-cases-page">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <p className="form-error">{loadError}</p>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="test-cases-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="settings-sections">
        <div className="settings-section">
          <h2>Appearance</h2>
          <label className="settings-field">
            Theme
            <select value={form.theme} onChange={(e) => update('theme', e.target.value)}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <span className="settings-field-hint">"System" follows your OS light/dark setting.</span>
          </label>
        </div>

        <div className="settings-section">
          <h2>Bugs</h2>
          <label className="settings-field">
            Default severity for new bugs
            <select
              value={form.defaultSeverityForNewBugs}
              onChange={(e) => update('defaultSeverityForNewBugs', e.target.value)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-section">
          <h2>Test Cases</h2>
          <label className="settings-field">
            Default page size
            <select
              value={form.defaultPageSize}
              onChange={(e) => update('defaultPageSize', Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-section">
          <h2>Locale</h2>
          <label className="settings-field">
            Timezone
            <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-section">
          <h2>Test Runs</h2>
          <label className="settings-checkbox-field">
            <input
              type="checkbox"
              checked={form.autoGenerateReportAfterRun}
              onChange={(e) => update('autoGenerateReportAfterRun', e.target.checked)}
            />
            Automatically generate a report after a test run completes
          </label>
        </div>

        {saveError && <p className="form-error">{saveError}</p>}

        <div className="settings-actions">
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && !saving && <span className="settings-saved-confirmation">Saved</span>}
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
