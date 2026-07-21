import { useRef } from 'react'
import { SHORTCUTS } from '../shortcuts.js'
import { useModalA11y } from '../hooks/useModalA11y.js'

function ShortcutsHelpModal({ onClose }) {
  const modalRef = useRef(null)
  useModalA11y(modalRef, onClose)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-help-modal-title">Keyboard Shortcuts</h2>

        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.id}>
                <td>
                  <kbd className="shortcut-key">{s.label}</kbd>
                </td>
                <td>{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsHelpModal
