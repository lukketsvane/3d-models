import React, { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightControlProps {
  position: THREE.Vector3
  setPosition: (position: THREE.Vector3) => void
  color: number
  intensity: number
  falloff: number
  isSelected: boolean
}

export function LightControl({ position, setPosition, color, intensity, falloff, isSelected }: LightControlProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const { gl } = useThree()
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.shiftKey && !event.ctrlKey) {
        isDragging.current = true
        previousMousePosition.current = { x: event.clientX, y: event.clientY }
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging.current && event.shiftKey && !event.ctrlKey) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.current.x,
          y: event.clientY - previousMousePosition.current.y
        }

        const rotationQuaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            THREE.MathUtils.degToRad(deltaMove.y * 0.5),
            THREE.MathUtils.degToRad(deltaMove.x * 0.5),
            0,
            'XYZ'
          )
        )

        const currentPosition = new THREE.Vector3().copy(position)
        currentPosition.applyQuaternion(rotationQuaternion)
        setPosition(currentPosition)

        previousMousePosition.current = { x: event.clientX, y: event.clientY }
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    gl.domElement.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gl, position, setPosition])

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(position)
      lightRef.current.intensity = intensity
      lightRef.current.color.setHex(color)
    
      // Apply falloff
      const distance = 10 // Adjust this value to change the overall range of the light
      lightRef.current.shadow.camera.near = 0.5
      lightRef.current.shadow.camera.far = distance
      lightRef.current.shadow.camera.left = -distance * falloff
      lightRef.current.shadow.camera.right = distance * falloff
      lightRef.current.shadow.camera.top = distance * falloff
      lightRef.current.shadow.camera.bottom = -distance * falloff
      lightRef.current.shadow.camera.updateProjectionMatrix()

      lightRef.current.shadow.mapSize.width = 1024
      lightRef.current.shadow.mapSize.height = 1024

      lightRef.current.updateMatrixWorld()
    }
  })

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        color={color}
        castShadow
      >
        <orthographicCamera attach="shadow-camera" />
      </directionalLight>
      {isSelected && lightRef.current && (
        <directionalLightHelper
          args={[lightRef.current, 1, new THREE.Color(0xffff00)]}
        />
      )}
    </>
  )
}
