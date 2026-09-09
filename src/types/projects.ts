export interface Project {
  id: any
  user_id: any
  title: string
  slug: string
  tagline: string
  description: string
  cover_image_url: string
  demo_url: string
  github_url: string
  tech_stack: string[]
  is_published: boolean
  views_count: number
  created_at: Date
  updated_at: Date
}