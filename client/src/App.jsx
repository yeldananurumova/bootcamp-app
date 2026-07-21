import { useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Logo from './components/Logo.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TestCasesPage from './pages/TestCasesPage.jsx'
import ImportTestCasesPage from './pages/ImportTestCasesPage.jsx'
import TestSuitesPage from './pages/TestSuitesPage.jsx'
import TestSuiteDetailPage from './pages/TestSuiteDetailPage.jsx'
import BugsPage from './pages/BugsPage.jsx'
import BugDetailPage from './pages/BugDetailPage.jsx'
import TestRunsPage from './pages/TestRunsPage.jsx'
import TestRunDetailPage from './pages/TestRunDetailPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ReportDetailPage from './pages/ReportDetailPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import QuickSearchModal from './components/QuickSearchModal.jsx'
import ShortcutsHelpModal from './components/ShortcutsHelpModal.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'

function App() {
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useKeyboardShortcuts({
    onQuickSearch: () => setQuickSearchOpen(true),
    onHelp: () => setHelpOpen(true),
  })

  return (
    <div>
      <nav className="top-nav">
        <Link to="/" className="brand-logo">
          <Logo size={24} />
          <span>Verity</span>
        </Link>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/test-cases">Test Cases</NavLink>
        <NavLink to="/test-suites">Test Suites</NavLink>
        <NavLink to="/test-runs">Test Runs</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/bugs">Bugs</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <button className="quick-search-trigger" onClick={() => setQuickSearchOpen(true)}>
          Search <kbd>⌘K</kbd>
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-cases/import" element={<ImportTestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<TestSuiteDetailPage />} />
        <Route path="/test-runs" element={<TestRunsPage />} />
        <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {quickSearchOpen && <QuickSearchModal onClose={() => setQuickSearchOpen(false)} />}
      {helpOpen && <ShortcutsHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

export default App
