export interface User {
  id: any
  email: string
  verified: boolean
  created_at: Date
  updated_at: Date
}

export interface Profile {
  user_id: any
  username: string
  full_name: string
  headline: string
  bio: string
  avatar_url: string
  location: string
  skills: string[]
  external_links: {
    [key: string]: string
  }
  created_at: Date
  updated_at: Date
}