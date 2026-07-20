import { useState } from 'react'
import { CHART_COLORS } from './chart-colors.js'

const WIDTH = 600
const HEIGHT = 220
const PAD_LEFT = 36
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM
const GRID_VALUES = [0, 25, 50, 75, 100]

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function PassRateTrendChart({ data }) {
  const [hovered, setHovered] = useState(null)

  if (data.length === 0) {
    return <p className="chart-empty">No test runs yet.</p>
  }

  const points = data.map((d, i) => ({
    ...d,
    x: data.length > 1 ? PAD_LEFT + (i / (data.length - 1)) * PLOT_WIDTH : PAD_LEFT + PLOT_WIDTH / 2,
    y: d.passRate == null ? null : PAD_TOP + PLOT_HEIGHT - (d.passRate / 100) * PLOT_HEIGHT,
  }))

  const segments = []
  let current = []
  for (const p of points) {
    if (p.y == null) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push(p)
    }
  }
  if (current.length) segments.push(current)

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {GRID_VALUES.map((v) => {
          const y = PAD_TOP + PLOT_HEIGHT - (v / 100) * PLOT_HEIGHT
          return (
            <g key={v}>
              <line className="chart-grid-line" x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} />
              <text className="chart-axis-label" x={PAD_LEFT - 8} y={y + 3} textAnchor="end">
                {v}%
              </text>
            </g>
          )
        })}

        {segments.map((seg, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={CHART_COLORS.blue}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        ))}

        {points.map(
          (p, i) =>
            p.y != null && (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill={CHART_COLORS.blue} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                />
              </g>
            )
        )}

        {points.map((p, i) => (
          <text key={i} className="chart-axis-label" x={p.x} y={HEIGHT - 6} textAnchor="middle">
            {formatShortDate(p.date)}
          </text>
        ))}
      </svg>

      {hovered != null && points[hovered].y != null && (
        <div
          className="chart-tooltip"
          style={{ left: `${(points[hovered].x / WIDTH) * 100}%`, top: `${(points[hovered].y / HEIGHT) * 100}%` }}
        >
          {formatShortDate(points[hovered].date)}: {points[hovered].passRate}%
        </div>
      )}
    </div>
  )
}

export default PassRateTrendChart
