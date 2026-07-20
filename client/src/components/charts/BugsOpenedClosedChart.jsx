import { useState } from 'react'
import { CHART_COLORS } from './chart-colors.js'

const WIDTH = 600
const HEIGHT = 220
const PAD_LEFT = 28
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM
const BAR_GAP = 3
const GROUP_GAP = 14
const CORNER_RADIUS = 3

function formatWeekLabel(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function niceMax(value) {
  if (value <= 0) return 4
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const steps = [1, 2, 2.5, 5, 10]
  for (const s of steps) {
    if (value <= s * pow) return s * pow
  }
  return 10 * pow
}

function roundedTopRectPath(x, y, width, height, radius) {
  if (height <= 0) return ''
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
}

function BugsOpenedClosedChart({ data }) {
  const [hovered, setHovered] = useState(null)

  if (data.every((d) => d.opened === 0 && d.closed === 0)) {
    return <p className="chart-empty">No bug activity in the last 8 weeks.</p>
  }

  const maxValue = niceMax(Math.max(1, ...data.flatMap((d) => [d.opened, d.closed])))
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f))
  const groupWidth = PLOT_WIDTH / data.length
  const barWidth = Math.max(4, (groupWidth - GROUP_GAP - BAR_GAP) / 2)
  const baseY = PAD_TOP + PLOT_HEIGHT

  function barHeight(value) {
    return (value / maxValue) * PLOT_HEIGHT
  }

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {gridValues.map((v) => {
          const y = PAD_TOP + PLOT_HEIGHT - (v / maxValue) * PLOT_HEIGHT
          return (
            <g key={v}>
              <line className="chart-grid-line" x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} />
              <text className="chart-axis-label" x={PAD_LEFT - 6} y={y + 3} textAnchor="end">
                {v}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const groupX = PAD_LEFT + i * groupWidth
          const openedX = groupX + (groupWidth - (barWidth * 2 + BAR_GAP)) / 2
          const closedX = openedX + barWidth + BAR_GAP
          const openedH = barHeight(d.opened)
          const closedH = barHeight(d.closed)

          return (
            <g key={i}>
              <path
                d={roundedTopRectPath(openedX, baseY - openedH, barWidth, openedH, CORNER_RADIUS)}
                fill={CHART_COLORS.critical}
                onMouseEnter={() => setHovered({ i, series: 'opened' })}
                onMouseLeave={() => setHovered(null)}
              />
              <path
                d={roundedTopRectPath(closedX, baseY - closedH, barWidth, closedH, CORNER_RADIUS)}
                fill={CHART_COLORS.good}
                onMouseEnter={() => setHovered({ i, series: 'closed' })}
                onMouseLeave={() => setHovered(null)}
              />
              <text className="chart-axis-label" x={groupX + groupWidth / 2} y={HEIGHT - 6} textAnchor="middle">
                {formatWeekLabel(d.weekStart)}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD_LEFT + hovered.i * groupWidth + groupWidth / 2) / WIDTH) * 100}%`,
            top: `${(PAD_TOP / HEIGHT) * 100}%`,
          }}
        >
          Week of {formatWeekLabel(data[hovered.i].weekStart)} — {hovered.series}: {data[hovered.i][hovered.series]}
        </div>
      )}

      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: CHART_COLORS.critical }} />
          Opened
        </span>
        <span className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: CHART_COLORS.good }} />
          Closed
        </span>
      </div>
    </div>
  )
}

export default BugsOpenedClosedChart
