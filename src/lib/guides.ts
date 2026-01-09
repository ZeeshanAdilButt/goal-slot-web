import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const guidesDirectory = path.join(process.cwd(), 'src/content/guides')

export type Guide = {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  date: string
  content: string
}

export function getAllGuides(): Guide[] {
  // Check if directory exists
  if (!fs.existsSync(guidesDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(guidesDirectory)
  const allGuidesData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(guidesDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      return {
        slug,
        content,
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Uncategorized',
        tags: data.tags || [],
        date: data.date || '',
      } as Guide
    })

  // Sort guides by date
  return allGuidesData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getGuideBySlug(slug: string): Guide | null {
  try {
    const fullPath = path.join(guidesDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      content,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'Uncategorized',
      tags: data.tags || [],
      date: data.date || '',
    } as Guide
  } catch (error) {
    return null
  }
}

export function getGuidesByCategory(category: string): Guide[] {
  const allGuides = getAllGuides()
  return allGuides.filter((guide) => guide.category === category)
}

export function getAllCategories(): string[] {
  const allGuides = getAllGuides()
  const categories = new Set(allGuides.map((guide) => guide.category))
  return Array.from(categories)
}
