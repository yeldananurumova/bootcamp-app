import { NavLink, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import TestCasesPage from './pages/TestCasesPage.jsx'
import TestSuitesPage from './pages/TestSuitesPage.jsx'
import TestSuiteDetailPage from './pages/TestSuiteDetailPage.jsx'
import BugsPage from './pages/BugsPage.jsx'
import BugDetailPage from './pages/BugDetailPage.jsx'
import TestRunsPage from './pages/TestRunsPage.jsx'
import TestRunDetailPage from './pages/TestRunDetailPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ReportDetailPage from './pages/ReportDetailPage.jsx'

function App() {
  return (
    <div>
      <nav className="top-nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/test-cases">Test Cases</NavLink>
        <NavLink to="/test-suites">Test Suites</NavLink>
        <NavLink to="/test-runs">Test Runs</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/bugs">Bugs</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/test-cases" element={<TestCasesPage />} />
        <Route path="/test-suites" element={<TestSuitesPage />} />
        <Route path="/test-suites/:id" element={<TestSuiteDetailPage />} />
        <Route path="/test-runs" element={<TestRunsPage />} />
        <Route path="/test-runs/:id" element={<TestRunDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/bugs/:id" element={<BugDetailPage />} />
      </Routes>
    </div>
  )
}

export default App
