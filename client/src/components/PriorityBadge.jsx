const COLORS = {
  Low: { background: '#e3e6ea', color: '#4a5058' },
  Medium: { background: '#dbeafe', color: '#1e40af' },
  High: { background: '#ffe3c2', color: '#9a5100' },
  Urgent: { background: '#fde2e1', color: '#9a1f1f' },
}

function PriorityBadge({ priority }) {
  const style = COLORS[priority] || COLORS.Medium

  return (
    <span className="priority-badge" style={{ background: style.background, color: style.color }}>
      {priority}
    </span>
  )
}

export default PriorityBadge
