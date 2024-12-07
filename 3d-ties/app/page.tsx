'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url, onClick, showTextures }: { url: string; onClick: () => void; showTextures: boolean }) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const { raycaster, camera, size } = useThree()
  const [originalMaterials] = useState<{ [key: string]: THREE.Material }>({})

  useEffect(() => {
    const clayMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7, metalness: 0.05 })
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        originalMaterials[child.uuid] = child.material
        child.material = showTextures ? child.material : clayMaterial
        child.geometry.computeVertexNormals()
      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray())
    scene.position.sub(center.multiplyScalar(2 / maxDim))
    scene.scale.multiplyScalar(2 / maxDim)

    const handleClick = (event: MouseEvent) => {
      const mouse = new THREE.Vector2((event.clientX / size.width) * 2 - 1, -(event.clientY / size.height) * 2 + 1)
      raycaster.setFromCamera(mouse, camera)
      if (raycaster.intersectObject(modelRef.current!, true).length > 0) onClick()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [scene, showTextures, onClick, raycaster, camera, size, originalMaterials])

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = showTextures ? originalMaterials[child.uuid] : 
          new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7, metalness: 0.05 })
      }
    })
  }, [showTextures, originalMaterials, scene])

  return <primitive ref={modelRef} object={scene} />
}

function ModelViewer() {
  const [modelUrls, setModelUrls] = useState<string[]>([])
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const [showTextures, setShowTextures] = useState(false)
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => setShowTextures(e.type === 'keydown' && (e.key === 't' || e.key === 'T'))
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
    }
  }, [])

  const handleNextModel = () => {
    setCurrentModelIndex((prevIndex) => (prevIndex + 1) % modelUrls.length)
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
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Model 
            url={modelUrls[currentModelIndex]} 
            onClick={handleNextModel} 
            showTextures={showTextures} 
          />
          <OrbitControls makeDefault />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
        Model: {currentModelIndex + 1} / {modelUrls.length}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <ModelViewer />
    </main>
  )
}

