import React, { useState, useCallback, useRef, useEffect } from 'react'
import { SlidableTile } from './SlidableTile'

const MODEL_URLS = [
  './../models/plant_01.glb',
  '../../models/food_fries_01.glb',
  '../../models/camera_01.glb',
  '../../models/picnic_01.glb',
  '../../models/picnic_02.glb',
  '../../models/salt_pepper_01.glb',
  '../../models/salt_pepper_02.glb',
  '../../models/salt_pepper_03.glb',
  '../../models/salt_pepper_04.glb',
]

interface Tile {
  id: numberF
  modelUrl: string
}

const TILE_SIZE = 350
const VISIBLE_TILES = 3
const BUFFER_TILES = 2
const TOTAL_TILES = VISIBLE_TILES + BUFFER_TILES * 2

export const SlidableGrid: React.FC = () => {
  const [grid, setGrid] = useState<Tile[][]>(
    Array(TOTAL_TILES).fill(null).map((_, rowIndex) =>
      Array(TOTAL_TILES).fill(null).map((_, colIndex) => ({
        id: rowIndex * TOTAL_TILES + colIndex,
        modelUrl: MODEL_URLS[(rowIndex * TOTAL_TILES + colIndex) % MODEL_URLS.length],
      }))
    )
  )

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const gridRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - lastPosition.current.x
    const deltaY = e.clientY - lastPosition.current.y

    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))

    lastPosition.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    const wrapGrid = () => {
      const shiftX = Math.floor(offset.x / TILE_SIZE)
      const shiftY = Math.floor(offset.y / TILE_SIZE)

      if (Math.abs(shiftX) >= 1 || Math.abs(shiftY) >= 1) {
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => [...row])

          // Shift columns
          newGrid.forEach(row => {
            const shiftedRow = row.map((_, index) => 
              row[(index - shiftX + TOTAL_TILES) % TOTAL_TILES]
            )
            row.splice(0, TOTAL_TILES, ...shiftedRow)
          })

          // Shift rows
          const shiftedGrid = newGrid.map((_, index) => 
            newGrid[(index - shiftY + TOTAL_TILES) % TOTAL_TILES]
          )

          return shiftedGrid
        })

        setOffset(prev => ({
          x: prev.x - shiftX * TILE_SIZE,
          y: prev.y - shiftY * TILE_SIZE
        }))
      }
    }

    wrapGrid()
  }, [offset])

  return (
    <div 
      ref={gridRef}
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${TOTAL_TILES}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${TOTAL_TILES}, ${TILE_SIZE}px)`,
          width: `${TOTAL_TILES * TILE_SIZE}px`,
          height: `${TOTAL_TILES * TILE_SIZE}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <SlidableTile
              key={tile.id}
              modelUrl={tile.modelUrl}
            />
          ))
        )}
      </div>
    </div>
  )
}

