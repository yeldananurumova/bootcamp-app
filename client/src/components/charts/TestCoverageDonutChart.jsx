import { useState } from 'react'
import { CHART_COLORS } from './chart-colors.js'

const SIZE = 220
const STROKE_WIDTH = 34
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CENTER = SIZE / 2
const GAP_PERCENT = 0.6

const STATUS_COLOR = {
  draft: CHART_COLORS.violet,
  ready: CHART_COLORS.blue,
  passed: CHART_COLORS.good,
  failed: CHART_COLORS.critical,
  skipped: CHART_COLORS.orange,
}

const STATUS_LABEL = {
  draft: 'Draft',
  ready: 'Ready',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
}

function TestCoverageDonutChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return <p className="chart-empty">No test cases yet.</p>
  }

  let cumulative = 0
  const segments = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const percent = (d.count / total) * 100
      const segment = { ...d, percent, offset: -cumulative }
      cumulative += percent
      return segment
    })

  const hoveredEntry = hovered ? data.find((d) => d.status === hovered) : null

  return (
    <div className="chart-wrap donut-wrap">
      <svg className="chart-svg donut-svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={STATUS_COLOR[seg.status]}
              strokeWidth={STROKE_WIDTH}
              pathLength={100}
              strokeDasharray={`${Math.max(seg.percent - GAP_PERCENT, 0)} ${100 - Math.max(seg.percent - GAP_PERCENT, 0)}`}
              strokeDashoffset={seg.offset}
              onMouseEnter={() => setHovered(seg.status)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </g>
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="donut-center-value">
          {total}
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" className="donut-center-label">
          Test Cases
        </text>
      </svg>

      {hoveredEntry && (
        <div className="chart-tooltip donut-tooltip">
          {STATUS_LABEL[hoveredEntry.status]}: {hoveredEntry.count} ({Math.round((hoveredEntry.count / total) * 100)}%)
        </div>
      )}

      <div className="chart-legend">
        {data.map((d) => (
          <span className="chart-legend-item" key={d.status}>
            <span className="chart-legend-swatch round" style={{ background: STATUS_COLOR[d.status] }} />
            {STATUS_LABEL[d.status]} ({d.count})
          </span>
        ))}
      </div>
    </div>
  )
}

export default TestCoverageDonutChart
