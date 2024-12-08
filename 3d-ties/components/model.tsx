import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ModelProps {
  url: string
  showTextures: boolean
  onClick: () => void
  materialProperties: {
    roughness: number
    metalness: number
  }
}

export function Model({ url, showTextures, onClick, materialProperties }: ModelProps) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const [originalMaterials] = useState<{ [key: string]: THREE.Material }>({})
  const { raycaster, camera, size } = useThree()

  const clayMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0, 
      roughness: 0.7, 
      metalness: 0.05,
      bumpScale: 0.02
    })
  }, [])

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeVertexNormals()
        
        if (!originalMaterials[child.uuid]) {
          originalMaterials[child.uuid] = child.material
        }
        
        if (showTextures) {
          const material = originalMaterials[child.uuid].clone()
          
          if (material.map) {
            material.map.encoding = THREE.sRGBEncoding
            material.map.anisotropy = 16
            material.map.needsUpdate = true

            const newMaterial = new THREE.MeshStandardMaterial({
              map: material.map,
              bumpMap: material.map,
              bumpScale: 0.05,
              roughness: materialProperties.roughness,
              metalness: materialProperties.metalness,
            })

            // Increase the emissive intensity to make the texture brighter
            newMaterial.emissive.setRGB(0.2, 0.2, 0.2)
            newMaterial.emissiveMap = material.map

            child.material = newMaterial
          } else {
            material.bumpScale = 0.02
            material.roughness = materialProperties.roughness
            material.metalness = materialProperties.metalness
            child.material = material
          }
        } else {
          const clayMaterialWithBump = clayMaterial.clone()
          if (originalMaterials[child.uuid].map) {
            clayMaterialWithBump.bumpMap = originalMaterials[child.uuid].map
            clayMaterialWithBump.bumpScale = 0.05
          }
          child.material = clayMaterialWithBump
        }

        // Ensure the material can receive shadows
        child.material.receiveShadow = true
        child.material.castShadow = true
      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray())
    scene.position.sub(center.multiplyScalar(2 / maxDim))
    scene.scale.multiplyScalar(2 / maxDim)

    return () => {
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
    }
  }, [scene, showTextures, originalMaterials, clayMaterial, materialProperties])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (event.clientX / size.width) * 2 - 1,
        -(event.clientY / size.height) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      if (raycaster.intersectObject(modelRef.current!, true).length > 0) onClick()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClick, raycaster, camera, size])

  return <primitive ref={modelRef} object={scene} />
}

