export const STATUS_COLORS = {
  draft: { background: '#e3e6ea', color: '#4a5058' },
  ready: { background: '#dcf5e3', color: '#1f7a3d' },
  'in-progress': { background: '#ffe3c2', color: '#9a5100' },
  passed: { background: '#bbead0', color: '#0f5c2e' },
  failed: { background: '#fde2e1', color: '#9a1f1f' },
  skipped: { background: '#e6e9f0', color: '#5b6472' },
  open: { background: '#fde2e1', color: '#9a1f1f' },
  resolved: { background: '#bbead0', color: '#0f5c2e' },
  closed: { background: '#e3e6ea', color: '#4a5058' },
  reopened: { background: '#ede2fd', color: '#5b21b6' },
  completed: { background: '#bbead0', color: '#0f5c2e' },
}

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.draft

  return (
    <span className="status-badge" style={{ background: style.background, color: style.color }}>
      {status}
    </span>
  )
}

export default StatusBadge
