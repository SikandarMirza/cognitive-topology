function ControlPanel({
  chaosLevel, setChaosLevel, simulationSpeed, setSimulationSpeed,
  showHeatmap, setShowHeatmap, nodeFilter, setNodeFilter,
  onChaosInject, onReset, onAddNode, nodeCount, linkCount
}) {
  const panelStyle = {
    width: '280px',
    background: 'linear-gradient(180deg, #12121a 0%, #0d0d14 100%)',
    borderRight: '1px solid #1a1a2e',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
  }

  const sectionStyle = {
    background: '#16162a',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #2a2a4a',
  }

  const labelStyle = {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block',
  }

  const buttonStyle = (variant = 'primary') => ({
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: variant === 'primary' ? '1px solid #00d4ff' : variant === 'danger' ? '1px solid #ff4444' : '1px solid #333',
    background: variant === 'primary' ? 'rgba(0, 212, 255, 0.1)' : variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
    color: variant === 'primary' ? '#00d4ff' : variant === 'danger' ? '#ff4444' : '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  })

  const sliderStyle = {
    width: '100%',
    accentColor: '#00d4ff',
  }

  return (
    <div style={panelStyle}>
      <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid #2a2a4a' }}>
        <h1 style={{ fontSize: '16px', color: '#00d4ff', margin: 0 }}>Cognitive Topology</h1>
        <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>AI Network Visualizer</p>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Network Stats</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#aaa' }}>Nodes: <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>{nodeCount}</span></span>
          <span style={{ color: '#aaa' }}>Links: <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{linkCount}</span></span>
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Node Filter</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'Shell', 'Lens', 'Bridge'].map(type => (
            <button
              key={type}
              onClick={() => setNodeFilter(type)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: nodeFilter === type ? '1px solid #00d4ff' : '1px solid #333',
                background: nodeFilter === type ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                color: nodeFilter === type ? '#00d4ff' : '#666',
                cursor: 'pointer',
                fontSize: '10px',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Chaos Level: {(chaosLevel * 100).toFixed(0)}%</span>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={chaosLevel}
          onChange={e => setChaosLevel(parseFloat(e.target.value))}
          style={sliderStyle}
        />
        <button onClick={onChaosInject} style={buttonStyle('danger')}>
          Inject Entropy Seed
        </button>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Simulation Speed: {simulationSpeed.toFixed(1)}x</span>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={simulationSpeed}
          onChange={e => setSimulationSpeed(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#aaa' }}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={e => setShowHeatmap(e.target.checked)}
            style={{ accentColor: '#ff4500' }}
          />
          Show Information Currents
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <button onClick={onAddNode} style={buttonStyle('primary')}>
          + Add AI Node
        </button>
        <button onClick={onReset} style={buttonStyle('secondary')}>
          Reset Network
        </button>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Legend</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00d4ff' }} />
            <span style={{ color: '#aaa' }}>Shell - Specialized Executor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff6b35' }} />
            <span style={{ color: '#aaa' }}>Lens - Multimodal Synthesizer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7' }} />
            <span style={{ color: '#aaa' }}>Bridge - Translation Node</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
