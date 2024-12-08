'use client'

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Model } from '../components/model'
import { LightControl } from '../components/light-controls'
import { ModelControls } from '../components/model-controls'

export default function ModelViewer() {
  const [modelUrls, setModelUrls] = useState<string[]>([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [showTextures, setShowTextures] = useState(false)
  const [lightPositions, setLightPositions] = useState([
    new THREE.Vector3(5, 5, 5),
    new THREE.Vector3(-5, 5, -5),
    new THREE.Vector3(0, -5, 5),
    new THREE.Vector3(5, -5, -5),
    new THREE.Vector3(-5, -5, 5)
  ])
  const [lightIntensities, setLightIntensities] = useState([3.18, 4.36, 0.66, 5.00, 0.00])
  const [lightColors, setLightColors] = useState(() => {
    const color1 = new THREE.Color().setHSL(0.0, 1, 0.5)
    const color2 = new THREE.Color().setHSL(0.77, 1, 0.5)
    const color3 = new THREE.Color().setHSL(0.0, 1, 0.5)
    const color4 = new THREE.Color().setHSL(0.0, 1, 0.5)
    const color5 = new THREE.Color().setHSL(0.0, 1, 0.5)
    return [
      '#' + color1.getHexString(),
      '#' + color2.getHexString(),
      '#' + color3.getHexString(),
      '#' + color4.getHexString(),
      '#' + color5.getHexString()
    ]
  })
  const [lightFalloffs, setLightFalloffs] = useState([0.00, 1.78, 1.68, 0.89, 1.26])
  const [selectedLight, setSelectedLight] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [materialProperties, setMaterialProperties] = useState({ roughness: 1.0, metalness: 0.01 })
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)
  const [isAltPressed, setIsAltPressed] = useState(false)

  useEffect(() => {
    async function loadAllModels() {
      try {
        const response = await fetch('/api/model-urls')
        if (!response.ok) {
          throw new Error('Failed to fetch model URLs')
        }
        const urls = await response.json()
        setModelUrls(urls)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading model URLs:', error)
        setError(error instanceof Error ? error : new Error('An unknown error occurred'))
        setIsLoading(false)
      }
    }

    loadAllModels()
  }, [])

  const handleNextModel = useCallback(() => {
    setCurrentModelIndex((prevIndex) => (prevIndex + 1) % modelUrls.length)
  }, [modelUrls.length])

  const toggleTextures = useCallback(() => {
    setShowTextures(prev => !prev)
  }, [])

  const updateLightIntensity = useCallback((index: number, intensity: number) => {
    setLightIntensities(prev => {
      const newIntensities = [...prev]
      newIntensities[index] = Math.max(0, Math.min(10, intensity))
      return newIntensities
    })
  }, [])

  const updateLightFalloff = useCallback((index: number, falloff: number) => {
    setLightFalloffs(prev => {
      const newFalloffs = [...prev]
      newFalloffs[index] = Math.max(0, Math.min(5, falloff))
      return newFalloffs
    })
  }, [])

  const updateLightColor = useCallback((index: number, color: string) => {
    setLightColors(prev => {
      const newColors = [...prev]
      newColors[index] = color
      return newColors
    })
  }, [])

  const addLight = useCallback(() => {
    const newPosition = new THREE.Vector3(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    )
    setLightPositions(prev => [...prev, newPosition])
    setLightIntensities(prev => [...prev, 1])
    setLightFalloffs(prev => [...prev, 0.5])
    setLightColors(prev => [...prev, '#ffffff'])
  }, [])

  const removeLight = useCallback((index: number) => {
    if (lightPositions.length > 1) {
      setLightPositions(prev => prev.filter((_, i) => i !== index))
      setLightIntensities(prev => prev.filter((_, i) => i !== index))
      setLightFalloffs(prev => prev.filter((_, i) => i !== index))
      setLightColors(prev => prev.filter((_, i) => i !== index))
      if (selectedLight >= index && selectedLight > 0) {
        setSelectedLight(prev => prev - 1)
      }
    }
  }, [lightPositions.length, selectedLight])

  const updateMaterialProperties = useCallback((roughness: number, metalness: number) => {
    setMaterialProperties({ roughness, metalness })
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.shiftKey) {
      setIsShiftPressed(true)
    }
    if (event.ctrlKey) {
      setIsCtrlPressed(true)
    }
    if (event.altKey) {
      setIsAltPressed(true)
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!event.shiftKey) {
      setIsShiftPressed(false)
    }
    if (!event.ctrlKey) {
      setIsCtrlPressed(false)
    }
    if (!event.altKey) {
      setIsAltPressed(false)
    }
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging.current && isShiftPressed) {
      const deltaMove = {
        x: event.clientX - previousMousePosition.current.x,
        y: event.clientY - previousMousePosition.current.y
      }

      if (isCtrlPressed && !isAltPressed) {
        // Adjust light intensity
        const intensityDelta = -deltaMove.y * 0.01
        const newIntensity = Math.max(0, Math.min(10, lightIntensities[selectedLight] + intensityDelta))
        updateLightIntensity(selectedLight, newIntensity)

        // Adjust light hue
        const hueShift = deltaMove.x * 0.5
        const color = new THREE.Color(lightColors[selectedLight])
        const hsl = { h: 0, s: 0, l: 0 }
        color.getHSL(hsl)
        hsl.h = (hsl.h + hueShift / 360) % 1
        color.setHSL(hsl.h, hsl.s, hsl.l)
        updateLightColor(selectedLight, '#' + color.getHexString())
      } else if (isAltPressed && !isCtrlPressed) {
        // Adjust material properties
        const roughnessDelta = -deltaMove.y * 0.005
        const metalnessDelta = deltaMove.x * 0.005
        const newRoughness = Math.max(0, Math.min(1, materialProperties.roughness + roughnessDelta))
        const newMetalness = Math.max(0, Math.min(1, materialProperties.metalness + metalnessDelta))
        updateMaterialProperties(newRoughness, newMetalness)
      }

      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }
  }, [isShiftPressed, isCtrlPressed, isAltPressed, lightIntensities, lightColors, selectedLight, updateLightIntensity, updateLightColor, materialProperties, updateMaterialProperties])

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (isShiftPressed) {
      isDragging.current = true
      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }
  }, [isShiftPressed])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp])

  if (isLoading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading models...</div>
  }

  if (error) {
    return <div className="w-full h-screen flex items-center justify-center text-red-500">Error: {error.message}</div>
  }

  if (modelUrls.length === 0) {
    return <div className="w-full h-screen flex items-center justify-center">No models found</div>
  }

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} shadows>
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          {lightPositions.map((position, index) => (
            <LightControl 
              key={index}
              position={position} 
              setPosition={(pos) => setLightPositions(prev => prev.map((p, i) => i === index ? pos : p))}
              color={new THREE.Color(lightColors[index]).getHex()}
              intensity={lightIntensities[index]}
              falloff={lightFalloffs[index]}
              isSelected={index === selectedLight}
            />
          ))}
          <Model 
            url={modelUrls[currentModelIndex]} 
            showTextures={showTextures}
            onClick={handleNextModel}
            materialProperties={materialProperties}
          />
          <OrbitControls 
            makeDefault 
            enablePan={false} 
            enableRotate={true} 
            enableZoom={true}
          />
        </Suspense>
      </Canvas>
      <ModelControls 
        currentModel={currentModelIndex + 1}
        totalModels={modelUrls.length}
        showTextures={showTextures}
        onToggleTextures={toggleTextures}
        lightPositions={lightPositions}
        lightIntensities={lightIntensities}
        lightFalloffs={lightFalloffs}
        selectedLight={selectedLight}
        setSelectedLight={setSelectedLight}
        updateLightIntensity={updateLightIntensity}
        updateLightFalloff={updateLightFalloff}
        updateLightColor={updateLightColor}
        lightColors={lightColors}
        addLight={addLight}
        removeLight={removeLight}
        updateMaterialProperties={updateMaterialProperties}
        materialProperties={materialProperties}
      />
      <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 p-2">
        <p className="text-xs">Hold Shift + Ctrl and click-drag to adjust light intensity (vertical) and hue (horizontal). Hold Shift + Alt to adjust material properties.</p>
      </div>
    </div>
  )
}

