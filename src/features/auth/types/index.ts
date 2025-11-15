/**
 * Auth feature types
 * User type comes from Supabase Auth (not in our database tables)
 */

// User type from Supabase Auth
export interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
  }
  created_at: string
}

// Form input types
export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name?: string
}

