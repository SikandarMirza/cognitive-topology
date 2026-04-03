function ResiduePanel({ residueData, link, onClose }) {
  const panelStyle = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '340px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #12121f 100%)',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #2a2a4a',
  }

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #1a1a2e',
    fontSize: '12px',
  }

  const sourceId = typeof link.source === 'object' ? link.source.id : link.source
  const targetId = typeof link.target === 'object' ? link.target.id : link.target
  const sourceType = typeof link.source === 'object' ? link.source.type : 'Unknown'
  const targetType = typeof link.target === 'object' ? link.target.type : 'Unknown'

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ fontSize: '13px', color: '#a855f7', margin: 0 }}>Translation Residue</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          x
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
        {sourceType} ({sourceId}) → {targetType} ({targetId})
      </div>

      <div style={rowStyle}>
        <span style={{ color: '#666' }}>Translation Quality</span>
        <span style={{
          color: residueData.translationQuality === 'High Fidelity' ? '#00ff88' :
                 residueData.translationQuality === 'Moderate' ? '#ffaa00' : '#ff4444',
          fontWeight: 'bold',
        }}>
          {residueData.translationQuality}
        </span>
      </div>

      <div style={rowStyle}>
        <span style={{ color: '#666' }}>Information Lost</span>
        <span style={{ color: '#ff6b35' }}>{residueData.informationLost}</span>
      </div>

      <div style={rowStyle}>
        <span style={{ color: '#666' }}>Compression Delta</span>
        <span style={{ color: '#00d4ff' }}>{residueData.compressionDelta}</span>
      </div>

      <div style={rowStyle}>
        <span style={{ color: '#666' }}>Dimension Mismatch</span>
        <span style={{ color: '#a855f7' }}>{residueData.dimMismatch} dims</span>
      </div>

      <div style={rowStyle}>
        <span style={{ color: '#666' }}>Entropy Cost</span>
        <span style={{ color: '#ff4500' }}>{residueData.entropyCost}</span>
      </div>

      <div style={{ marginTop: '12px' }}>
        <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Residue Vector (first 16 dims)</span>
        <div style={{
          marginTop: '6px',
          padding: '8px',
          background: '#0a0a14',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#00d4ff',
          wordBreak: 'break-all',
          lineHeight: '1.6',
        }}>
          [{residueData.residueVector.join(', ')}]
        </div>
      </div>

      <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', fontSize: '10px', color: '#a855f7' }}>
        <strong>Residue Theorem:</strong> The information lost during cross-AI translation is not destroyed - it reveals structural differences between architectures.
      </div>
    </div>
  )
}

export default ResiduePanel
