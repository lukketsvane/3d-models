'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Model } from '../components/model'
import { LightControl } from '../components/light-controls'
import { ModelControls } from '../components/model-controls'

export default function ModelViewer() {
  const [modelUrls, setModelUrls] = useState<string[]>([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [showTextures, setShowTextures] = useState(false)
  const [lightPosition, setLightPosition] = useState(new THREE.Vector3(5, 5, 5))
  const [isLoading, setIsLoading] = useState(true)

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
        setIsLoading(false)
      }
    }

    loadAllModels()
  }, [])

  const handleNextModel = () => {
    setCurrentModelIndex((prevIndex) => (prevIndex + 1) % modelUrls.length)
  }

  const toggleTextures = () => {
    setShowTextures(prev => !prev)
  }

  if (isLoading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading models...</div>
  }

  if (modelUrls.length === 0) {
    return <div className="w-full h-screen flex items-center justify-center">No models found</div>
  }

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <LightControl position={lightPosition} setPosition={setLightPosition} />
          <Model 
            url={modelUrls[currentModelIndex]} 
            showTextures={showTextures}
            onClick={handleNextModel}
          />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      <ModelControls 
        currentModel={currentModelIndex + 1}
        totalModels={modelUrls.length}
        showTextures={showTextures}
        onToggleTextures={toggleTextures}
        lightPosition={lightPosition}
        setLightPosition={setLightPosition}
      />
    </div>
  )
}

