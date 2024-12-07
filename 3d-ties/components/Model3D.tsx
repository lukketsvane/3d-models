import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { loadModel } from '../utils/modelLoader'
import * as THREE from 'three'

interface Model3DProps {
  url: string
}

const Model: React.FC<{ url: string }> = ({ url }) => {
  const [model, setModel] = useState<THREE.Group | null>(null)

  useEffect(() => {
    loadModel(url).then(setModel).catch(console.error)
  }, [url])

  if (!model) return null

  return <primitive object={model} scale={[0.5, 0.5, 0.5]} />
}

export const Model3D: React.FC<Model3DProps> = ({ url }) => {
  return (
    <Canvas className="w-full h-full">
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Model url={url} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}

