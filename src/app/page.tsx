import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'

export default async function Home() {
  // Middleware handles the redirect, but this is a fallback
  const user = await getCurrentUser()
  
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
