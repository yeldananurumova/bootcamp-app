import { useEffect, useState } from 'react'
import { getDashboardMetrics, getDashboardTrends } from '../api/dashboard.js'
import StatusBadge from '../components/StatusBadge.jsx'
import PassRateTrendChart from '../components/charts/PassRateTrendChart.jsx'
import BugsOpenedClosedChart from '../components/charts/BugsOpenedClosedChart.jsx'
import TestCoverageDonutChart from '../components/charts/TestCoverageDonutChart.jsx'

const REFRESH_INTERVAL_MS = 30000

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds) {
  if (seconds == null) return 'N/A'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function formatPassRate(rate) {
  return rate == null ? 'N/A' : `${rate}%`
}

function DashboardSkeleton() {
  return (
    <>
      <div className="metric-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-row" style={{ width: '100%' }} />
      <div className="skeleton skeleton-row" style={{ width: '90%' }} />
      <div className="skeleton skeleton-row" style={{ width: '95%' }} />
    </>
  )
}

function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [recentRuns, setRecentRuns] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [trends, setTrends] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load(isInitial) {
    if (isInitial) setInitialLoading(true)
    try {
      const [metricsData, trendsData] = await Promise.all([getDashboardMetrics(), getDashboardTrends()])
      setMetrics(metricsData.metrics)
      setRecentRuns(metricsData.recentRuns)
      setRecentActivity(metricsData.recentActivity)
      setTrends(trendsData)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (isInitial) setInitialLoading(false)
    }
  }

  useEffect(() => {
    load(true)
    const interval = setInterval(() => load(false), REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isEmpty =
    metrics && metrics.totalTestCases === 0 && recentRuns.length === 0 && recentActivity.length === 0

  return (
    <div className="test-cases-page dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {initialLoading && <DashboardSkeleton />}

      {!initialLoading && error && !metrics && <p className="form-error">Couldn't load dashboard: {error}</p>}

      {!initialLoading && metrics && isEmpty && (
        <p className="dashboard-empty">
          Nothing to show yet — add some test cases, suites, or bugs to see metrics here.
        </p>
      )}

      {!initialLoading && metrics && !isEmpty && (
        <>
          {error && <p className="form-error">Auto-refresh failed: {error} (showing last known data)</p>}

          <div className="metric-cards">
            <div className="metric-card">
              <p className="metric-label">Total Test Cases</p>
              <p className="metric-value">{metrics.totalTestCases}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Pass Rate</p>
              <p className="metric-value">{formatPassRate(metrics.passRate)}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Open Bugs</p>
              <p className="metric-value">{metrics.openBugs}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Avg Run Duration</p>
              <p className="metric-value">{formatDuration(metrics.avgRunDurationSeconds)}</p>
            </div>
          </div>

          {trends && (
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Pass Rate Trend (Last 10 Runs)</h3>
                <PassRateTrendChart data={trends.passRateTrend} />
              </div>
              <div className="chart-card">
                <h3>Bugs Opened vs Closed (Last 8 Weeks)</h3>
                <BugsOpenedClosedChart data={trends.bugsPerWeek} />
              </div>
              <div className="chart-card">
                <h3>Test Coverage by Status</h3>
                <TestCoverageDonutChart data={trends.testCoverage} />
              </div>
            </div>
          )}

          <h2>Recent Test Runs</h2>
          <div className="table-scroll">
          <table className="test-cases-table">
            <thead>
              <tr>
                <th>Suite</th>
                <th>Status</th>
                <th>Pass</th>
                <th>Fail</th>
                <th>Skip</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.length === 0 && (
                <tr>
                  <td colSpan={6}>No test runs yet.</td>
                </tr>
              )}
              {recentRuns.map((run) => (
                <tr key={run.id}>
                  <td>{run.suiteName}</td>
                  <td>
                    <StatusBadge status={run.status} />
                  </td>
                  <td>{run.passCount}</td>
                  <td>{run.failCount}</td>
                  <td>{run.skipCount}</td>
                  <td>{formatDate(run.startTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <h2>Recent Activity</h2>
          <ul className="activity-timeline">
            {recentActivity.length === 0 && <li className="activity-empty">No recent activity.</li>}
            {recentActivity.map((entry) => (
              <li key={entry.id} className="activity-entry">
                <div className="activity-meta">
                  <span className="activity-date">{formatDate(entry.createdAt)}</span>
                </div>
                <p>{entry.summary}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default DashboardPage
