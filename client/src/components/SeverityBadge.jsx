const COLORS = {
  Critical: { background: '#fde2e1', color: '#9a1f1f' },
  Major: { background: '#fde8cc', color: '#9a5b1f' },
  Minor: { background: '#fdf3c7', color: '#8a6d1f' },
  Trivial: { background: '#e3e6ea', color: '#4a5058' },
}

function SeverityBadge({ severity }) {
  const style = COLORS[severity] || COLORS.Trivial

  return (
    <span
      className="severity-badge"
      style={{ background: style.background, color: style.color }}
    >
      {severity}
    </span>
  )
}

export default SeverityBadge
