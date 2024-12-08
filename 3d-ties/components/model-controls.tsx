import React, { useEffect, useCallback, useState, useRef } from 'react'
import * as THREE from 'three'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Minus } from 'lucide-react'

interface ModelControlsProps {
  currentModel: number
  totalModels: number
  showTextures: boolean
  onToggleTextures: () => void
  lightPositions: THREE.Vector3[]
  lightIntensities: number[]
  lightFalloffs: number[]
  selectedLight: number
  setSelectedLight: React.Dispatch<React.SetStateAction<number>>
  updateLightIntensity: (index: number, intensity: number) => void
  updateLightFalloff: (index: number, falloff: number) => void
  updateLightColor: (index: number, color: string) => void
  lightColors: string[]
  addLight: () => void
  removeLight: (index: number) => void
  updateMaterialProperties: (roughness: number, metalness: number) => void
}

export function ModelControls({
  currentModel,
  totalModels,
  showTextures,
  onToggleTextures,
  lightPositions,
  lightIntensities,
  lightFalloffs,
  selectedLight,
  setSelectedLight,
  updateLightIntensity,
  updateLightFalloff,
  updateLightColor,
  lightColors,
  addLight,
  removeLight,
  updateMaterialProperties
}: ModelControlsProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const [roughness, setRoughness] = useState(0.5)
  const [metalness, setMetalness] = useState(0.5)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 't' || event.key === 'T') {
      onToggleTextures()
    }
    if (event.key === 'Shift') {
      setIsShiftPressed(true)
    }
    if (event.key === 'Control') {
      setIsCtrlPressed(true)
    }
    if (event.key === 'Alt') {
      setIsAltPressed(true)
    }
    if (['1', '2', '3', '4', '5'].includes(event.key)) {
      const index = parseInt(event.key) - 1
      if (index < lightPositions.length) {
        setSelectedLight(index)
      }
    }
  }, [onToggleTextures, lightPositions.length, setSelectedLight])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setIsShiftPressed(false)
    }
    if (event.key === 'Control') {
      setIsCtrlPressed(false)
    }
    if (event.key === 'Alt') {
      setIsAltPressed(false)
    }
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging.current && isShiftPressed) {
      const deltaMove = {
        x: event.clientX - previousMousePosition.current.x,
        y: event.clientY - previousMousePosition.current.y
      }

      if (isCtrlPressed && !isAltPressed) {
        // Adjust light properties
        const intensityDelta = -deltaMove.y * 0.01
        const newIntensity = Math.max(0, Math.min(2, lightIntensities[selectedLight] + intensityDelta))
        updateLightIntensity(selectedLight, newIntensity)

        // Adjust light hue
        const hueShift = deltaMove.x * 0.5
        const color = new THREE.Color(lightColors[selectedLight])
        const hsl = { h: 0, s: 0, l: 0 }
        color.getHSL(hsl)
        hsl.h = (hsl.h + hueShift / 360) % 1
        color.setHSL(hsl.h, hsl.s, hsl.l)
        updateLightColor(selectedLight, '#' + color.getHexString())
      } else if (isAltPressed && !isCtrlPressed) {
        // Adjust material properties
        const roughnessDelta = -deltaMove.y * 0.005
        const newRoughness = Math.max(0, Math.min(1, roughness + roughnessDelta))
        setRoughness(newRoughness)

        const metalnessDelta = deltaMove.x * 0.005
        const newMetalness = Math.max(0, Math.min(1, metalness + metalnessDelta))
        setMetalness(newMetalness)

        updateMaterialProperties(newRoughness, newMetalness)
      }

      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }
  }, [isShiftPressed, isCtrlPressed, isAltPressed, lightIntensities, lightColors, selectedLight, updateLightIntensity, updateLightColor, roughness, metalness, updateMaterialProperties])

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (isShiftPressed && (isCtrlPressed || isAltPressed)) {
      isDragging.current = true
      previousMousePosition.current = { x: event.clientX, y: event.clientY }
    }
  }, [isShiftPressed, isCtrlPressed, isAltPressed])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp])

  return (
    <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 p-2 w-[280px]">
      <div className="space-y-1">
        <div className="flex justify-start items-center mb-2">
          <span>Model: {currentModel} / {totalModels}</span>
          <Button onClick={onToggleTextures} size="sm" className="ml-2">
            {showTextures ? 'Hide Textures' : 'Show Textures'}
          </Button>
        </div>
        <div className="flex justify-start items-center mb-2">
          <span>{lightPositions.length} Lights</span>
          <Button onClick={addLight} size="sm" className="text-white/50 hover:text-white ml-2">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {lightPositions.map((position, index) => (
          <div key={index} className="flex items-center justify-between space-x-2">
            <Button 
              onClick={() => removeLight(index)} 
              size="sm" 
              className="text-white/50 hover:text-white p-1"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={`p-1 ${selectedLight === index ? 'bg-yellow-400 text-black' : 'text-gray-400'}`}
                        onClick={() => setSelectedLight(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-24">
                      <Label htmlFor={`light-color-${index}`}></Label>
                      <Input
                        id={`light-color-${index}`}
                        type="color"
                        value={lightColors[index]}
                        onChange={(e) => updateLightColor(index, e.target.value)}
                        className="w-full"
                      />
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-white">
                  Light {index + 1}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs">
              I: {lightIntensities[index].toFixed(2)} H: {new THREE.Color(lightColors[index]).getHSL({h: 0, s: 0, l: 0}).h.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="mt-2 text-xs">
          <p>Material: R: {roughness.toFixed(2)} M: {metalness.toFixed(2)}</p>
        </div>
        <div className="mt-2 text-xs">
          <p>Hold Shift + Ctrl and click-drag to adjust light intensity (vertical) and hue (horizontal).</p>
          <p>Hold Shift + Alt and click-drag to adjust material roughness (vertical) and metalness (horizontal).</p>
        </div>
      </div>
    </div>
  )
}

