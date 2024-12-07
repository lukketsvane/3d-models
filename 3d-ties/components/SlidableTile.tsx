import React from 'react'
import { Model3D } from './Model3D'

interface SlidableTileProps {
  modelUrl: string
}

export const SlidableTile: React.FC<SlidableTileProps> = ({ modelUrl }) => {
  return (
    <div className="w-[350px] h-[350px] overflow-hidden">
      <Model3D url={modelUrl} />
    </div>
  )
}

