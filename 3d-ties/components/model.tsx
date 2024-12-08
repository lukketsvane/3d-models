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
  const modelRef = useRef<THREE.Object3D>(null)
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
      if (child.type === 'Mesh' && 'material' in child && 'geometry' in child) {
        const meshChild = child as THREE.Object3D & { material: THREE.Material, geometry: THREE.BufferGeometry }
        meshChild.geometry.computeVertexNormals()
        
        if (!originalMaterials[meshChild.uuid]) {
          originalMaterials[meshChild.uuid] = meshChild.material
        }
        
        if (showTextures) {
          const material = (originalMaterials[meshChild.uuid] as THREE.MeshStandardMaterial).clone()
          
          if ('map' in material && material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace
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

            meshChild.material = newMaterial
          } else if (material instanceof THREE.MeshStandardMaterial) {
            material.bumpScale = 0.02
            material.roughness = materialProperties.roughness
            material.metalness = materialProperties.metalness
            meshChild.material = material
          }
        } else {
          const clayMaterialWithBump = clayMaterial.clone()
          if ((originalMaterials[meshChild.uuid] as THREE.MeshStandardMaterial).map) {
            clayMaterialWithBump.bumpMap = (originalMaterials[meshChild.uuid] as THREE.MeshStandardMaterial).map
            clayMaterialWithBump.bumpScale = 0.05
          }
          meshChild.material = clayMaterialWithBump
        }

      }
    })

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray())
    scene.position.sub(center.multiplyScalar(2 / maxDim))
    scene.scale.multiplyScalar(2 / maxDim)

    return () => {
      scene.traverse((child: THREE.Object3D) => {
        if (child.type === 'Mesh' && 'material' in child) {
          const meshChild = child as THREE.Object3D & { material: THREE.Material | THREE.Material[] }
          if (meshChild.material) {
            if (Array.isArray(meshChild.material)) {
              meshChild.material.forEach(material => material.dispose())
            } else {
              meshChild.material.dispose()
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

