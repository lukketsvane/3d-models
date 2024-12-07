import React from 'react'
import { Model3D } from './Model3D'

interface SlidableTileProps {
  modelUrl: string | null
}

export const SlidableTile: React.FC<SlidableTileProps> = ({ modelUrl }) => {
  return (
    <div className="w-[350px] h-[350px] overflow-hidden bg-gray-100">
      {modelUrl ? (
        <Model3D url={modelUrl} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          Model unavailable
        </div>
      )}
    </div>
  )
}

