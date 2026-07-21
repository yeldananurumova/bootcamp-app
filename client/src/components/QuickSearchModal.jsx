import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTestCases } from '../api/test-cases.js'
import { listBugs } from '../api/bugs.js'
import { listSuites } from '../api/suites.js'
import SeverityBadge from './SeverityBadge.jsx'
import StatusBadge from './StatusBadge.jsx'
import { useModalA11y } from '../hooks/useModalA11y.js'

const DEBOUNCE_MS = 200

function QuickSearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ testCases: [], bugs: [], suites: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const modalRef = useRef(null)
  const navigate = useNavigate()
  useModalA11y(modalRef, onClose)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults({ testCases: [], bugs: [], suites: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const [tcData, bugsData, suitesData] = await Promise.all([
          listTestCases({ search: trimmed, page: 1 }),
          listBugs({ search: trimmed }),
          listSuites(),
        ])
        setResults({
          testCases: tcData.items,
          bugs: bugsData.items,
          suites: suitesData.items.filter((s) => s.name.toLowerCase().includes(trimmed.toLowerCase())),
        })
      } catch {
        setResults({ testCases: [], bugs: [], suites: [] })
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [query])

  const flatResults = useMemo(
    () => [
      ...results.testCases.map((item) => ({ type: 'testCase', item })),
      ...results.bugs.map((item) => ({ type: 'bug', item })),
      ...results.suites.map((item) => ({ type: 'suite', item })),
    ],
    [results]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [flatResults.length])

  function activate(entry) {
    if (!entry) return
    onClose()
    if (entry.type === 'testCase') {
      navigate('/test-cases', { state: { openTestCaseId: entry.item.id } })
    } else if (entry.type === 'bug') {
      navigate(`/bugs/${entry.item.id}`)
    } else if (entry.type === 'suite') {
      navigate(`/test-suites/${entry.item.id}`)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(flatResults[selectedIndex])
    }
  }

  const hasQuery = query.trim().length > 0

  function renderGroup(title, items, type) {
    if (items.length === 0) return null
    return (
      <div className="quick-search-group">
        <h3>{title}</h3>
        {items.map((item) => {
          const flatIndex = flatResults.findIndex((r) => r.type === type && r.item.id === item.id)
          const isSelected = flatIndex === selectedIndex
          return (
            <button
              key={item.id}
              className={`quick-search-result${isSelected ? ' selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(flatIndex)}
              onClick={() => activate({ type, item })}
            >
              <span>{type === 'suite' ? item.name : item.title}</span>
              {type === 'testCase' && <SeverityBadge severity={item.severity} />}
              {type === 'bug' && <StatusBadge status={item.status} />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal quick-search-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          className="quick-search-input"
          aria-label="Search test cases, bugs, and suites"
          placeholder="Search test cases, bugs, and suites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="quick-search-results">
          {loading && <p className="quick-search-status">Searching...</p>}
          {!loading && hasQuery && flatResults.length === 0 && <p className="quick-search-status">No results.</p>}
          {!loading && !hasQuery && <p className="quick-search-status">Start typing to search everything.</p>}

          {!loading && renderGroup('Test Cases', results.testCases, 'testCase')}
          {!loading && renderGroup('Bugs', results.bugs, 'bug')}
          {!loading && renderGroup('Suites', results.suites, 'suite')}
        </div>
      </div>
    </div>
  )
}

export default QuickSearchModal
