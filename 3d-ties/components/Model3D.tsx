import React, { useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { loadModel } from '../utils/modelLoader'
import * as THREE from 'three'

interface Model3DProps {
  url: string
}

const Model: React.FC<{ url: string }> = ({ url }) => {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModel(url)
      .then(setModel)
      .catch(err => {
        console.error(`Error loading model from ${url}:`, err)
        setError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`)
      })
  }, [url])

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
        <Html center>
          <div className="bg-black bg-opacity-70 text-white p-2 rounded text-xs">
            {error}
          </div>
        </Html>
      </mesh>
    )
  }

  if (!model) {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="yellow" />
        <Html center>
          <div className="bg-black bg-opacity-70 text-white p-2 rounded text-xs">
            Loading...
          </div>
        </Html>
      </mesh>
    )
  }

  return <primitive object={model} scale={[0.5, 0.5, 0.5]} />
}

export const Model3D: React.FC<Model3DProps> = ({ url }) => {
  return (
    <Canvas className="w-full h-full">
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}

