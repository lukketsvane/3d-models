import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const modelsDirectory = path.join(process.cwd(), 'public', 'models')
    const files = await fs.readdir(modelsDirectory)
    const modelUrls = files
      .filter(file => file.endsWith('.glb'))
      .map(file => `/models/${file}`)
    
    return NextResponse.json(modelUrls)
  } catch (error) {
    console.error('Error reading models directory:', error)
    return NextResponse.json({ error: 'Failed to load model URLs' }, { status: 500 })
  }
}

