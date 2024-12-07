import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()

export const loadModel = (url: string): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      (progress) => {
        console.log(`Loading model ${url}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`)
      },
      (error) => {
        console.error(`Error loading model from ${url}:`, error)
        reject(new Error(`Failed to load model ${url}: ${error.message}`))
      }
    )
  })
}

export const checkModelAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      console.error(`Model not found: ${url}`)
      return false
    }
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/octet-stream')) {
      console.error(`Invalid content type for model: ${url}, received: ${contentType}`)
      return false
    }
    return true
  } catch (error) {
    console.error(`Error checking model availability for ${url}:`, error)
    return false
  }
}

