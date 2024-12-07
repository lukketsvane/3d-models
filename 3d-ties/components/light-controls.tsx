import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightControlProps {
  position: THREE.Vector3
  setPosition: React.Dispatch<React.SetStateAction<THREE.Vector3>>
}

export function LightControl({ position, setPosition }: LightControlProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(position)
      lightRef.current.updateMatrixWorld()
    }
  })

  return (
    <directionalLight
      ref={lightRef}
      position={position}
      intensity={1
      }
      castShadow
    />
  )
}

