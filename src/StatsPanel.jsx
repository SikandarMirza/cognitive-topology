function StatsPanel({ stats }) {
  const panelStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(18, 18, 26, 0.9)',
    border: '1px solid #2a2a4a',
    borderRadius: '10px',
    padding: '14px',
    minWidth: '200px',
    backdropFilter: 'blur(8px)',
  }

  const titleStyle = {
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '1px solid #2a2a4a',
  }

  const statRow = (label, value, color, icon) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: '12px',
  })

  const indicatorDot = (active, color) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: active ? color : '#333',
    boxShadow: active ? `0 0 6px ${color}` : 'none',
    animation: active ? 'pulse 1.5s infinite' : 'none',
  })

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>System Metrics</div>

      <div style={statRow()}>
        <span style={{ color: '#888' }}>
          <span style={indicatorDot(stats.criticalCount > 0, '#ff4500')} />{' '}
          Critical Clusters
        </span>
        <span style={{ color: stats.criticalCount > 0 ? '#ff4500' : '#555', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {stats.criticalCount}
        </span>
      </div>

      <div style={statRow()}>
        <span style={{ color: '#888' }}>Avg Novelty</span>
        <span style={{ color: '#00d4ff', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {(stats.avgNovelty * 100).toFixed(1)}%
        </span>
      </div>

      <div style={statRow()}>
        <span style={{ color: '#888' }}>
          <span style={indicatorDot(stats.shatterCount > 0, '#ff4444')} />{' '}
          Shatter Events
        </span>
        <span style={{ color: '#ff6b35', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {stats.shatterCount}
        </span>
      </div>

      <div style={statRow()}>
        <span style={{ color: '#888' }}>Pulsations/min</span>
        <span style={{ color: '#a855f7', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {stats.pulsationFreq}
        </span>
      </div>

      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #2a2a4a', fontSize: '9px', color: '#444', textAlign: 'center' }}>
        Emergent Computation Monitor
      </div>
    </div>
  )
}

export default StatsPanel
