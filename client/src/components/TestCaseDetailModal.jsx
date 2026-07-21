import { useRef } from 'react'
import SeverityBadge from './SeverityBadge.jsx'
import StatusBadge from './StatusBadge.jsx'
import { useModalA11y } from '../hooks/useModalA11y.js'

function TestCaseDetailModal({ testCase, onClose, onEdit }) {
  const modalRef = useRef(null)
  useModalA11y(modalRef, onClose)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-case-detail-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="test-case-detail-modal-title">{testCase.title}</h2>

        <div className="detail-view">
          <div className="detail-row">
            <SeverityBadge severity={testCase.severity} />
            <StatusBadge status={testCase.status} />
          </div>

          {testCase.preconditions && (
            <div className="detail-field">
              <h3>Preconditions</h3>
              <p>{testCase.preconditions}</p>
            </div>
          )}

          <div className="detail-field">
            <h3>Steps</h3>
            <ol>
              {testCase.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="detail-field">
            <h3>Expected Result</h3>
            <p>{testCase.expectedResult}</p>
          </div>

          <div className="detail-field">
            <h3>Updated</h3>
            <p>{new Date(testCase.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestCaseDetailModal
