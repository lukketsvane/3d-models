const GITHUB_API_BASE = 'https://api.github.com/repos/lukketsvane/3d-models/contents/models'

export interface GithubFile {
  name: string
  download_url: string
}

export const fetchModelUrls = async (): Promise<string[]> => {
  try {
    const response = await fetch(GITHUB_API_BASE)
    if (!response.ok) throw new Error('Failed to fetch repository contents')
    
    const files: GithubFile[] = await response.json()
    const glbFiles = files.filter(file => file.name.toLowerCase().endsWith('.glb'))
    
    if (glbFiles.length === 0) {
      throw new Error('No .glb files found in the repository')
    }
    
    return glbFiles.map(file => file.download_url)
  } catch (error) {
    console.error('Error fetching model URLs:', error)
    throw error
  }
}

