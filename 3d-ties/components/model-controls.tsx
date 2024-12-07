import React, { useEffect, useCallback } from 'react'
import * as THREE from 'three'

interface ModelControlsProps {
  currentModel: number
  totalModels: number
  showTextures: boolean
  onToggleTextures: () => void
  lightPosition: THREE.Vector3
  setLightPosition: React.Dispatch<React.SetStateAction<THREE.Vector3>>
}

export function ModelControls({
  currentModel,
  totalModels,
  showTextures,
  onToggleTextures,
  lightPosition,
  setLightPosition
}: ModelControlsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const step = 5.5 // Increased step size for faster light movement
    switch (event.key) {
      case 't':
      case 'T':
        onToggleTextures()
        break
      case 'ArrowUp':
        setLightPosition(prev => new THREE.Vector3(prev.x, prev.y + step, prev.z))
        break
      case 'ArrowDown':
        setLightPosition(prev => new THREE.Vector3(prev.x, prev.y - step, prev.z))
        break
      case 'ArrowLeft':
        setLightPosition(prev => new THREE.Vector3(prev.x - step, prev.y, prev.z))
        break
      case 'ArrowRight':
        setLightPosition(prev => new THREE.Vector3(prev.x + step, prev.y, prev.z))
        break
      case 'PageUp':
        setLightPosition(prev => new THREE.Vector3(prev.x, prev.y, prev.z - step))
        break
      case 'PageDown':
        setLightPosition(prev => new THREE.Vector3(prev.x, prev.y, prev.z + step))
        break
    }
  }, [onToggleTextures, setLightPosition])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
      <div>Model: {currentModel} / {totalModels}</div>
      <div>Textures: {showTextures ? 'ON' : 'OFF'}</div>
    
      <div className="mt-2">
        Click on model to cycle to next
        <br />
        Press 'T' to toggle textures
        <br />
        Use arrow keys to adjust light position:
        <br />
        ↑↓ (Up/Down), ←→ (Left/Right), PgUp/PgDn (Forward/Back)
      </div>
    </div>
  )
}

