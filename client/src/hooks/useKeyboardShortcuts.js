import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SHORTCUTS } from '../shortcuts.js'

const CHORD_TIMEOUT_MS = 1000

function isEditableTarget(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useKeyboardShortcuts({ onQuickSearch, onHelp }) {
  const navigate = useNavigate()
  const chordKeyRef = useRef(null)
  const chordTimerRef = useRef(null)

  useEffect(() => {
    function clearChord() {
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current)
      chordKeyRef.current = null
      chordTimerRef.current = null
    }

    function dispatch(action) {
      if (action.type === 'navigate') navigate(action.path)
      else if (action.type === 'quick-search') onQuickSearch()
      else if (action.type === 'help') onHelp()
    }

    function handleKeyDown(e) {
      if (isEditableTarget(e.target)) return

      const combo = SHORTCUTS.find((s) => s.kind === 'combo' && s.isMatch(e))
      if (combo) {
        e.preventDefault()
        clearChord()
        dispatch(combo.action)
        return
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        clearChord()
        return
      }

      const key = e.key.toLowerCase()

      if (chordKeyRef.current) {
        const match = SHORTCUTS.find(
          (s) => s.kind === 'chord' && s.chord[0] === chordKeyRef.current && s.chord[1] === key
        )
        clearChord()
        if (match) {
          e.preventDefault()
          dispatch(match.action)
        }
        return
      }

      const startsChord = SHORTCUTS.some((s) => s.kind === 'chord' && s.chord[0] === key)
      if (startsChord) {
        chordKeyRef.current = key
        chordTimerRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearChord()
    }
  }, [navigate, onQuickSearch, onHelp])
}
