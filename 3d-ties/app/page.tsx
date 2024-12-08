'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
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
  const [lightIntensities, setLightIntensities] = useState([0.26, 0.57, 0.14, 0.71, 0.67])
  const [lightFalloffs, setLightFalloffs] = useState([0.00, 1.78, 1.68, 0.89, 1.26])
  const [lightColors, setLightColors] = useState(['#ffffff', '#00FFFF', '#ffffff', '#FF4500', '#ffffff'])
  const [selectedLight, setSelectedLight] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [materialProperties, setMaterialProperties] = useState({ roughness: 0.5, metalness: 0.5 })

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
      newIntensities[index] = Math.max(0, Math.min(2, intensity))
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
      />
    </div>
  )
}

