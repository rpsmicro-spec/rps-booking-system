export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware handles all auth redirects, so this layout just renders children
  // Reset-password is handled specially by middleware (allowed regardless of auth state)
  return children
}

