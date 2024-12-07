import React, { useRef, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ModelProps {
  url: string
  showTextures: boolean
  onClick: () => void
}

export function Model({ url, showTextures, onClick }: ModelProps) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const [originalMaterials] = useState<{ [key: string]: THREE.Material }>({})
  const clayMaterial = useRef(new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7, metalness: 0.05 }))
  const { raycaster, camera, size } = useThree()

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        if (!originalMaterials[child.uuid]) {
          originalMaterials[child.uuid] = child.material
        }
        child.material = showTextures ? originalMaterials[child.uuid] : clayMaterial.current
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
  }, [scene, showTextures, originalMaterials, onClick, raycaster, camera, size])

  return <primitive ref={modelRef} object={scene} />
}

