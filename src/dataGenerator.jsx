import { useState, useEffect } from 'react'

const SHELL_SPECIALTIES = ['Cryptography', 'System Architecture', 'Compiler Design', 'Network Protocol', 'Database Engine', 'Memory Management']
const LENS_SPECIALTIES = ['Cross-Domain Synthesis', 'Multimodal Fusion', 'Semantic Mapping', 'Pattern Recognition', 'Analogical Reasoning', 'Knowledge Graph']
const BRIDGE_SPECIALTIES = ['Translation Layer', 'Protocol Adapter', 'Format Converter', 'Interface Mediator', 'Semantic Bridge', 'Ontology Mapper']

function generateAIData(nodeCount, linkCount) {
  const nodes = []
  const types = ['Shell', 'Lens', 'Bridge']
  const typeWeights = [0.45, 0.35, 0.20]

  for (let i = 0; i < nodeCount; i++) {
    const rand = Math.random()
    let type
    if (rand < typeWeights[0]) type = 'Shell'
    else if (rand < typeWeights[0] + typeWeights[1]) type = 'Lens'
    else type = 'Bridge'

    const specialties = type === 'Shell' ? SHELL_SPECIALTIES : type === 'Lens' ? LENS_SPECIALTIES : BRIDGE_SPECIALTIES

    nodes.push({
      id: `node_${i.toString().padStart(2, '0')}`,
      type,
      specialty: specialties[Math.floor(Math.random() * specialties.length)],
      novelty_index: Math.random() * 0.8 + 0.1,
      compression_ratio: Math.random() * 15 + 1,
      dimensionality: Math.floor(Math.random() * 512 + 64),
    })
  }

  const links = []
  const usedPairs = new Set()

  for (let i = 0; i < linkCount; i++) {
    let sourceIdx, targetIdx, pairKey
    let attempts = 0
    do {
      sourceIdx = Math.floor(Math.random() * nodes.length)
      targetIdx = Math.floor(Math.random() * nodes.length)
      pairKey = `${sourceIdx}-${targetIdx}`
      attempts++
    } while ((sourceIdx === targetIdx || usedPairs.has(pairKey)) && attempts < 100)

    if (attempts < 100) {
      usedPairs.add(pairKey)
      const sourceNode = nodes[sourceIdx]
      const targetNode = nodes[targetIdx]
      const typeCompatibility = sourceNode.type === targetNode.type ? 0.8 : 0.5
      const specialtyMatch = sourceNode.specialty === targetNode.specialty ? 1.0 : 0.3

      links.push({
        source: sourceNode.id,
        target: targetNode.id,
        flux: Math.random() * typeCompatibility * specialtyMatch * 0.8 + 0.1,
        residue_loss: Math.random() * 0.15 + 0.01,
      })
    }
  }

  return { nodes, links }
}

function generateResidueData(link) {
  const dimensions = Math.floor(Math.random() * 256 + 64)
  const residueVector = Array.from({ length: Math.min(dimensions, 16) }, () =>
    (Math.random() * 2 - 1).toFixed(4)
  )

  const sourceDims = typeof link.source === 'object' ? link.source.dimensionality : Math.floor(Math.random() * 256 + 128)
  const targetDims = typeof link.target === 'object' ? link.target.dimensionality : Math.floor(Math.random() * 256 + 128)
  const dimMismatch = Math.abs(sourceDims - targetDims)

  return {
    residueVector,
    dimensions,
    dimMismatch,
    informationLost: (link.residue_loss * 100).toFixed(2) + '%',
    compressionDelta: (link.flux * 10 - 5).toFixed(2) + ' bits',
    translationQuality: link.residue_loss < 0.05 ? 'High Fidelity' : link.residue_loss < 0.1 ? 'Moderate' : 'Lossy',
    entropyCost: (Math.random() * 50 + 10).toFixed(2) + ' kT ln(2)',
  }
}

export { generateAIData, generateResidueData, SHELL_SPECIALTIES, LENS_SPECIALTIES, BRIDGE_SPECIALTIES }
