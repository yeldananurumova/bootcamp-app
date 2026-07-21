import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { previewTestCaseImport, importTestCases } from '../api/test-cases.js'
import SeverityBadge from '../components/SeverityBadge.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

function ErrorRows({ rows, columns }) {
  return rows.map((r) => (
    <Fragment key={r.rowNumber}>
      <tr className={r.errors.length ? 'import-row-invalid' : 'import-row-valid'}>
        <td>{r.rowNumber}</td>
        <td>{r.title || <em>(no title)</em>}</td>
        <td>{r.steps.length} step(s)</td>
        <td>{r.severity ? <SeverityBadge severity={r.severity} /> : '—'}</td>
        <td>
          <StatusBadge status={r.status} />
        </td>
        <td>{r.errors.length === 0 ? 'Valid' : `${r.errors.length} error(s)`}</td>
      </tr>
      {r.errors.length > 0 && (
        <tr className="import-row-errors">
          <td colSpan={columns}>
            <ul className="error-list">
              {r.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </Fragment>
  ))
}

function ImportTestCasesPage() {
  const [phase, setPhase] = useState('pick')
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [error, setError] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setFileName(file.name)
    setPhase('previewing')

    try {
      const text = await file.text()
      setCsvText(text)
      const data = await previewTestCaseImport(text)
      setPreviewData(data)
      setPhase('preview')
    } catch (err) {
      setError(err.message)
      setPhase('pick')
    }
  }

  async function handleImport() {
    setPhase('importing')
    setError(null)
    try {
      const data = await importTestCases(csvText)
      setResultData(data)
      setPhase('result')
    } catch (err) {
      setError(err.message)
      setPhase('preview')
    }
  }

  function reset() {
    setPhase('pick')
    setFileName('')
    setCsvText('')
    setPreviewData(null)
    setResultData(null)
    setError(null)
  }

  return (
    <div className="test-cases-page">
      <Link to="/test-cases" className="back-link">
        &larr; Back to Test Cases
      </Link>

      <div className="page-header">
        <h1>Import Test Cases</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      {(phase === 'pick' || phase === 'previewing') && (
        <div className="file-picker">
          <input
            type="file"
            aria-label="Choose a CSV file to import"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={phase === 'previewing'}
          />
          {phase === 'previewing' && <span>Reading {fileName}...</span>}
        </div>
      )}

      {phase === 'preview' && previewData && (
        <>
          <div className="metric-cards">
            <div className="metric-card">
              <p className="metric-label">Total Rows</p>
              <p className="metric-value">{previewData.totalRows}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Valid</p>
              <p className="metric-value">{previewData.validCount}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Invalid</p>
              <p className="metric-value">{previewData.invalidCount}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Blank Rows Skipped</p>
              <p className="metric-value">{previewData.blankRowCount}</p>
            </div>
          </div>

          {previewData.ignoredColumns.length > 0 && (
            <p className="form-error">Ignored unrecognized column(s): {previewData.ignoredColumns.join(', ')}</p>
          )}

          <table className="test-cases-table import-preview-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Title</th>
                <th>Steps</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {previewData.rows.length === 0 && (
                <tr>
                  <td colSpan={6}>No data rows found in this file.</td>
                </tr>
              )}
              <ErrorRows rows={previewData.rows} columns={6} />
            </tbody>
          </table>

          <div className="add-case-row">
            <button onClick={reset}>Choose a different file</button>
            <button className="primary" onClick={handleImport} disabled={previewData.validCount === 0}>
              Import {previewData.validCount} valid row(s)
            </button>
          </div>
        </>
      )}

      {phase === 'importing' && <p>Importing...</p>}

      {phase === 'result' && resultData && (
        <>
          <div className="metric-cards">
            <div className="metric-card">
              <p className="metric-label">Imported</p>
              <p className="metric-value">{resultData.importedCount}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Skipped</p>
              <p className="metric-value">{resultData.skippedCount}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Blank Rows Skipped</p>
              <p className="metric-value">{resultData.blankRowCount}</p>
            </div>
          </div>

          {resultData.skipped.length > 0 && (
            <>
              <h2>Skipped Rows</h2>
              <table className="test-cases-table import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Title</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.skipped.map((r) => (
                    <Fragment key={r.rowNumber}>
                      <tr className="import-row-invalid">
                        <td>{r.rowNumber}</td>
                        <td>{r.title || <em>(no title)</em>}</td>
                        <td>{r.errors.length} error(s)</td>
                      </tr>
                      <tr className="import-row-errors">
                        <td colSpan={3}>
                          <ul className="error-list">
                            {r.errors.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="add-case-row">
            <Link className="button-link" to="/test-cases">
              Back to Test Cases
            </Link>
            <button onClick={reset}>Import another file</button>
          </div>
        </>
      )}
    </div>
  )
}

export default ImportTestCasesPage
