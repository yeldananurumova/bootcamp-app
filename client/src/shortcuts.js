function isMod(e) {
  return e.metaKey || e.ctrlKey
}

export const SHORTCUTS = [
  {
    id: 'quick-search',
    label: '⌘K / Ctrl+K',
    description: 'Open quick search (across test cases, bugs, and suites)',
    kind: 'combo',
    isMatch: (e) => isMod(e) && !e.altKey && e.key.toLowerCase() === 'k',
    action: { type: 'quick-search' },
  },
  {
    id: 'help',
    label: '?',
    description: 'Show this list of keyboard shortcuts',
    kind: 'combo',
    isMatch: (e) => !isMod(e) && !e.altKey && e.key === '?',
    action: { type: 'help' },
  },
  {
    id: 'goto-dashboard',
    label: 'G then D',
    description: 'Go to Dashboard',
    kind: 'chord',
    chord: ['g', 'd'],
    action: { type: 'navigate', path: '/' },
  },
  {
    id: 'goto-test-cases',
    label: 'G then T',
    description: 'Go to Test Cases',
    kind: 'chord',
    chord: ['g', 't'],
    action: { type: 'navigate', path: '/test-cases' },
  },
  {
    id: 'goto-bugs',
    label: 'G then B',
    description: 'Go to Bugs',
    kind: 'chord',
    chord: ['g', 'b'],
    action: { type: 'navigate', path: '/bugs' },
  },
  {
    id: 'goto-test-runs',
    label: 'G then R',
    description: 'Go to Test Runs',
    kind: 'chord',
    chord: ['g', 'r'],
    action: { type: 'navigate', path: '/test-runs' },
  },
]
