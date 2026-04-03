import { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = {
  Shell: '#00d4ff',
  Lens: '#ff6b35',
  Bridge: '#a855f7',
  Cooldown: '#333355',
}

const NODE_SIZES = {
  Shell: 18,
  Lens: 22,
  Bridge: 28,
  Cooldown: 10,
}

const CRITICALITY_NOVELTY_THRESHOLD = 0.7
const CRITICALITY_FLUX_THRESHOLD = 0.5
const SUPER_CONDUCTION_DISTANCE = 20
const NORMAL_DISTANCE_BASE = 150
const NORMAL_DISTANCE_REDUCTION = 80
const SHATTER_JITTER_TIME = 5000
const SHATTER_EXPLODE_TIME = 10000
const COOLDOWN_DURATION = 8000

function computeClusters(nodes, links) {
  const parent = {}
  nodes.forEach(n => parent[n.id] = n.id)
  function find(x) {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] }
    return x
  }
  function union(a, b) {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }
  links.forEach(l => {
    const sid = typeof l.source === 'object' ? l.source.id : l.source
    const tid = typeof l.target === 'object' ? l.target.id : l.target
    union(sid, tid)
  })
  const clusters = {}
  nodes.forEach(n => {
    const root = find(n.id)
    if (!clusters[root]) clusters[root] = []
    clusters[root].push(n)
  })
  return Object.values(clusters).filter(c => c.length >= 2)
}

function computeCriticalClusters(nodes, links) {
  const clusters = computeClusters(nodes, links)
  const criticalIds = new Set()
  clusters.forEach(cluster => {
    const activeNodes = cluster.filter(n => !n.cooldownUntil)
    if (activeNodes.length < 2) return
    const avgNovelty = activeNodes.reduce((s, n) => s + n.novelty_index, 0) / activeNodes.length
    const clusterIds = new Set(activeNodes.map(n => n.id))
    const clusterLinks = links.filter(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source
      const tid = typeof l.target === 'object' ? l.target.id : l.target
      return clusterIds.has(sid) && clusterIds.has(tid)
    })
    const fluxDensity = clusterLinks.length > 0
      ? clusterLinks.reduce((s, l) => s + l.flux, 0) / activeNodes.length
      : 0
    if (avgNovelty > CRITICALITY_NOVELTY_THRESHOLD && fluxDensity > CRITICALITY_FLUX_THRESHOLD) {
      activeNodes.forEach(n => criticalIds.add(n.id))
    }
  })
  return criticalIds
}

function TopologyCanvas({ data, svgRef, showHeatmap, onLinkClick, selectedLink, onStatsUpdate }) {
  const containerRef = useRef(null)
  const simulationRef = useRef(null)
  const animFrameRef = useRef(null)
  const criticalTimersRef = useRef({})
  const shatteredNodesRef = useRef(new Set())
  const shatterCountRef = useRef(0)
  const pulsationLogRef = useRef([])
  const [criticalClusters, setCriticalClusters] = useState(new Set())
  const [shatterEffects, setShatterEffects] = useState([])

  useEffect(() => {
    const cc = computeCriticalClusters(data.nodes, data.links)
    const now = Date.now()

    cc.forEach(id => {
      if (!criticalTimersRef.current[id]) {
        criticalTimersRef.current[id] = now
      }
    })

    Object.keys(criticalTimersRef.current).forEach(id => {
      if (!cc.has(id)) {
        delete criticalTimersRef.current[id]
      } else {
        const elapsed = now - criticalTimersRef.current[id]
        if (elapsed >= SHATTER_EXPLODE_TIME && !shatteredNodesRef.current.has(id)) {
          shatteredNodesRef.current.add(id)
          shatterCountRef.current++

          const node = data.nodes.find(n => n.id === id)
          if (node) {
            setShatterEffects(prev => [...prev, {
              x: node.x || 0,
              y: node.y || 0,
              time: now,
              color: NODE_COLORS[node.type] || '#888',
            }])

            setTimeout(() => {
              data.nodes.forEach(n => {
                if (n.id === id) {
                  n.cooldownUntil = now + COOLDOWN_DURATION
                  n.novelty_index = Math.random() * 0.3 + 0.1
                }
              })
              data.links.forEach(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source
                const tid = typeof l.target === 'object' ? l.target.id : l.target
                if (sid === id || tid === id) {
                  l.flux = 0
                }
              })

              setTimeout(() => {
                shatteredNodesRef.current.delete(id)
                const node = data.nodes.find(n => n.id === id)
                if (node) {
                  node.cooldownUntil = undefined
                  node.novelty_index = Math.random() * 0.5 + 0.3
                }
                data.links.forEach(l => {
                  const sid = typeof l.source === 'object' ? l.source.id : l.source
                  const tid = typeof l.target === 'object' ? l.target.id : l.target
                  if (sid === id || tid === id) {
                    l.flux = Math.random() * 0.5 + 0.2
                  }
                })
              }, COOLDOWN_DURATION)
            }, 500)
          }
        }
      }
    })

    setCriticalClusters(cc)

    const recentPulsations = pulsationLogRef.current.filter(t => now - t < 60000)
    pulsationLogRef.current = recentPulsations
    if (cc.size > 0 && (!data._lastCritical || cc.size !== data._lastCritical)) {
      pulsationLogRef.current.push(now)
    }
    data._lastCritical = cc.size

    if (onStatsUpdate) {
      const avgNovelty = data.nodes.length > 0
        ? data.nodes.reduce((s, n) => s + n.novelty_index, 0) / data.nodes.length
        : 0
      onStatsUpdate({
        criticalCount: cc.size,
        avgNovelty,
        shatterCount: shatterCountRef.current,
        pulsationFreq: recentPulsations.length,
      })
    }

    setTimeout(() => {
      setShatterEffects(prev => prev.filter(e => now - e.time < 1000))
    }, 1000)
  }, [data, onStatsUpdate])

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(containerRef.current)
      .selectAll('svg')
      .data([null])
      .join('svg')
      .attr('width', width)
      .attr('height', height)

    svg.selectAll('*').remove()

    const defs = svg.append('defs')

    const glowFilter = defs.append('filter').attr('id', 'glow')
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = glowFilter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const criticalGlow = defs.append('filter').attr('id', 'criticalGlow')
    criticalGlow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur')
    const feMerge2 = criticalGlow.append('feMerge')
    feMerge2.append('feMergeNode').attr('in', 'blur')
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic')

    const jitterFilter = defs.append('filter').attr('id', 'jitterGlow')
    jitterFilter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur')
    const feMergeJ = jitterFilter.append('feMerge')
    feMergeJ.append('feMergeNode').attr('in', 'blur')
    feMergeJ.append('feMergeNode').attr('in', 'SourceGraphic')

    const heatGradient = defs.append('radialGradient').attr('id', 'heatGradient')
    heatGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ff4500').attr('stop-opacity', 0.3)
    heatGradient.append('stop').attr('offset', '50%').attr('stop-color', '#ff8c00').attr('stop-opacity', 0.15)
    heatGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0a0a0f').attr('stop-opacity', 0)

    const linkGradient = defs.append('linearGradient').attr('id', 'linkGradient')
    linkGradient.append('stop').attr('offset', '0%').attr('stop-color', '#00d4ff').attr('stop-opacity', 0.6)
    linkGradient.append('stop').attr('offset', '100%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.6)

    const pulseAnim = defs.append('filter').attr('id', 'pulseGlow')
    pulseAnim.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur')
    const feMerge3 = pulseAnim.append('feMerge')
    feMerge3.append('feMergeNode').attr('in', 'blur')
    feMerge3.append('feMergeNode').attr('in', 'SourceGraphic')

    const shatterGroup = svg.append('g').attr('class', 'shatter-effects')
    shatterEffects.forEach(effect => {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i
        const distance = 30 + Math.random() * 20
        shatterGroup.append('circle')
          .attr('cx', effect.x + Math.cos(angle) * distance)
          .attr('cy', effect.y + Math.sin(angle) * distance)
          .attr('r', 2 + Math.random() * 3)
          .attr('fill', effect.color)
          .attr('opacity', 0.8)
          .attr('filter', 'url(#glow)')
      }
    })

    if (showHeatmap) {
      data.nodes.filter(n => n.novelty_index > 0.6 && !n.cooldownUntil && n.x !== undefined).forEach(node => {
        svg.append('circle')
          .attr('cx', node.x)
          .attr('cy', node.y)
          .attr('r', 80 * node.novelty_index)
          .attr('fill', 'url(#heatGradient)')
          .attr('pointer-events', 'none')
      })
    }

    const linkGroup = svg.append('g').attr('class', 'links')
    const nodeGroup = svg.append('g').attr('class', 'nodes')
    const labelGroup = svg.append('g').attr('class', 'labels')

    const links = linkGroup.selectAll('line')
      .data(data.links.filter(l => l.flux > 0))
      .join('line')
      .attr('stroke', d => {
        const isSelected = selectedLink &&
          ((typeof d.source === 'object' ? d.source.id : d.source) === (typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source) &&
           (typeof d.target === 'object' ? d.target.id : d.target) === (typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target))
        if (isSelected) return '#ffffff'
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) return '#ffffff'
        return 'url(#linkGradient)'
      })
      .attr('stroke-width', d => {
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) return 3
        return d.flux * 4 + 0.5
      })
      .attr('stroke-opacity', d => {
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) return 0.9
        return d.flux * 0.7 + 0.1
      })
      .attr('stroke-dasharray', d => {
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) return null
        return d.residue_loss > 0.1 ? '4,4' : null
      })
      .attr('filter', d => {
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) return 'url(#pulseGlow)'
        return null
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => onLinkClick(d))

    const now = Date.now()
    const nodes = nodeGroup.selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return NODE_SIZES.Cooldown
        return NODE_SIZES[d.type] || 18
      })
      .attr('fill', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return NODE_COLORS.Cooldown
        if (criticalClusters.has(d.id)) {
          const elapsed = now - (criticalTimersRef.current[d.id] || now)
          if (elapsed >= SHATTER_JITTER_TIME) return '#ff0000'
          return '#ffffff'
        }
        return NODE_COLORS[d.type] || '#888888'
      })
      .attr('stroke', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return '#444'
        if (criticalClusters.has(d.id)) return '#ff4500'
        const c = d3.color(NODE_COLORS[d.type] || '#888888')
        c.opacity = 0.5
        return c
      })
      .attr('stroke-width', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return 1
        return criticalClusters.has(d.id) ? 3 : 2
      })
      .attr('filter', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return null
        if (criticalClusters.has(d.id)) {
          const elapsed = now - (criticalTimersRef.current[d.id] || now)
          if (elapsed >= SHATTER_JITTER_TIME) return 'url(#jitterGlow)'
          return 'url(#criticalGlow)'
        }
        return 'url(#glow)'
      })
      .style('cursor', 'grab')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    const labels = labelGroup.selectAll('text')
      .data(data.nodes)
      .join('text')
      .text(d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return `RECOVERING: ${d.specialty}`
        const prefix = criticalClusters.has(d.id) ? 'CRITICAL ' : ''
        return `${prefix}${d.type}: ${d.specialty}`
      })
      .attr('font-size', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return '8px'
        return criticalClusters.has(d.id) ? '11px' : '9px'
      })
      .attr('fill', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return '#555'
        if (criticalClusters.has(d.id)) return '#ff4500'
        return '#888'
      })
      .attr('font-weight', d => criticalClusters.has(d.id) ? 'bold' : 'normal')
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return NODE_SIZES.Cooldown + 12
        return (NODE_SIZES[d.type] || 18) + 14
      })
      .attr('pointer-events', 'none')

    simulationRef.current = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links.filter(l => l.flux > 0)).id(d => d.id).distance(d => {
        const sid = typeof d.source === 'object' ? d.source.id : d.source
        const tid = typeof d.target === 'object' ? d.target.id : d.target
        if (criticalClusters.has(sid) && criticalClusters.has(tid)) {
          return SUPER_CONDUCTION_DISTANCE
        }
        return NORMAL_DISTANCE_BASE - d.flux * NORMAL_DISTANCE_REDUCTION
      }))
      .force('charge', d3.forceManyBody().strength(d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return -50
        if (criticalClusters.has(d.id)) return -800
        return -300
      }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => {
        if (d.cooldownUntil && now < d.cooldownUntil) return NODE_SIZES.Cooldown + 5
        if (criticalClusters.has(d.id)) return (NODE_SIZES[d.type] || 18) + 20
        return (NODE_SIZES[d.type] || 18) + 10
      }))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .on('tick', () => {
        const jitterNodes = new Set()
        Object.entries(criticalTimersRef.current).forEach(([id, start]) => {
          if (now - start >= SHATTER_JITTER_TIME) jitterNodes.add(id)
        })

        links
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        nodes
          .attr('cx', d => {
            if (jitterNodes.has(d.id)) return d.x + (Math.random() - 0.5) * 10
            return d.x
          })
          .attr('cy', d => {
            if (jitterNodes.has(d.id)) return d.y + (Math.random() - 0.5) * 10
            return d.y
          })

        labels
          .attr('x', d => d.x)
          .attr('y', d => d.y)

        if (showHeatmap) {
          svg.selectAll('circle[fill="url(#heatGradient)"]').remove()
          data.nodes.filter(n => n.novelty_index > 0.6 && !n.cooldownUntil && n.x !== undefined).forEach(node => {
            svg.insert('circle', '.links')
              .attr('cx', node.x)
              .attr('cy', node.y)
              .attr('r', 80 * node.novelty_index)
              .attr('fill', 'url(#heatGradient)')
              .attr('pointer-events', 'none')
          })
        }
      })

    if (criticalClusters.size > 0) {
      let pulse = 0
      const animate = () => {
        pulse += 0.05
        links
          .filter(d => {
            const sid = typeof d.source === 'object' ? d.source.id : d.source
            const tid = typeof d.target === 'object' ? d.target.id : d.target
            return criticalClusters.has(sid) && criticalClusters.has(tid)
          })
          .attr('stroke-opacity', 0.5 + 0.5 * Math.abs(Math.sin(pulse)))

        nodes
          .filter(d => criticalClusters.has(d.id) && !jitterNodes?.has(d.id))
          .attr('r', d => (NODE_SIZES[d.type] || 18) + 3 * Math.abs(Math.sin(pulse * 1.5)))

        animFrameRef.current = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      simulationRef.current?.stop()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [data, showHeatmap, selectedLink, onLinkClick, criticalClusters, shatterEffects])

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      d3.select(containerRef.current).select('svg')
        .attr('width', width)
        .attr('height', height)
      simulationRef.current?.force('center', d3.forceCenter(width / 2, height / 2))
      simulationRef.current?.alpha(0.3).restart()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, #0f0f1a 0%, #0a0a0f 70%)' }}
    />
  )
}

export default TopologyCanvas
