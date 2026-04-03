import { useState, useRef, useEffect, useCallback } from 'react'
import TopologyCanvas from './TopologyCanvas'
import ResiduePanel from './ResiduePanel'
import ControlPanel from './ControlPanel'
import StatsPanel from './StatsPanel'
import { generateAIData, generateResidueData } from './dataGenerator'

function App() {
  const [data, setData] = useState(() => generateAIData(25, 60))
  const [selectedLink, setSelectedLink] = useState(null)
  const [residueData, setResidueData] = useState(null)
  const [chaosLevel, setChaosLevel] = useState(0.15)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [nodeFilter, setNodeFilter] = useState('all')
  const [stats, setStats] = useState({ criticalCount: 0, avgNovelty: 0, shatterCount: 0, pulsationFreq: 0 })

  const handleLinkClick = useCallback((link) => {
    setSelectedLink(link)
    setResidueData(generateResidueData(link))
  }, [])

  const handleChaosInject = useCallback(() => {
    setData(prev => {
      const noise = Math.random() * chaosLevel
      return {
        ...prev,
        nodes: prev.nodes.map(n => ({
          ...n,
          novelty_index: Math.min(1, Math.max(0, n.novelty_index + (Math.random() - 0.5) * noise)),
        })),
      }
    })
  }, [chaosLevel])

  const handleReset = useCallback(() => {
    setData(generateAIData(25, 60))
    setSelectedLink(null)
    setResidueData(null)
  }, [])

  const handleAddNode = useCallback(() => {
    const types = ['Shell', 'Lens', 'Bridge']
    const specialties = ['Cryptography', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'Cross-Domain Synthesis', 'System Architecture', 'Quantum Computing', 'Neural Architecture Search']
    const type = types[Math.floor(Math.random() * types.length)]
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      specialty: specialties[Math.floor(Math.random() * specialties.length)],
      novelty_index: Math.random() * 0.8 + 0.1,
      compression_ratio: Math.random() * 15 + 1,
      dimensionality: Math.floor(Math.random() * 512 + 64),
    }
    const newLink = {
      source: newNode.id,
      target: data.nodes[Math.floor(Math.random() * data.nodes.length)].id,
      flux: Math.random() * 0.8 + 0.1,
      residue_loss: Math.random() * 0.15 + 0.01,
    }
    setData(prev => ({
      nodes: [...prev.nodes, newNode],
      links: [...prev.links, newLink],
    }))
  }, [data.nodes])

  useEffect(() => {
    const interval = setInterval(() => {
      if (simulationSpeed > 0) {
        setData(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => ({
            ...n,
            novelty_index: Math.min(1, Math.max(0, n.novelty_index + (Math.random() - 0.5) * 0.02 * simulationSpeed)),
          })),
          links: prev.links.map(l => ({
            ...l,
            flux: Math.min(1, Math.max(0, l.flux + (Math.random() - 0.5) * 0.03 * simulationSpeed)),
          })),
        }))
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [simulationSpeed])

  const filteredData = nodeFilter === 'all'
    ? data
    : {
        nodes: data.nodes.filter(n => n.type === nodeFilter),
        links: data.links.filter(l => {
          const filteredIds = new Set(data.nodes.filter(n => n.type === nodeFilter).map(n => n.id))
          return filteredIds.has(typeof l.source === 'object' ? l.source.id : l.source) &&
                 filteredIds.has(typeof l.target === 'object' ? l.target.id : l.target)
        }),
      }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0a0a0f' }}>
      <ControlPanel
        chaosLevel={chaosLevel}
        setChaosLevel={setChaosLevel}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        nodeFilter={nodeFilter}
        setNodeFilter={setNodeFilter}
        onChaosInject={handleChaosInject}
        onReset={handleReset}
        onAddNode={handleAddNode}
        nodeCount={data.nodes.length}
        linkCount={data.links.length}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <TopologyCanvas
          data={filteredData}
          showHeatmap={showHeatmap}
          onLinkClick={handleLinkClick}
          selectedLink={selectedLink}
          onStatsUpdate={setStats}
        />

        <StatsPanel stats={stats} />

        {residueData && selectedLink && (
          <ResiduePanel
            residueData={residueData}
            link={selectedLink}
            onClose={() => { setSelectedLink(null); setResidueData(null) }}
          />
        )}
      </div>
    </div>
  )
}

export default App
