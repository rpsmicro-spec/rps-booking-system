"use client";

import { useSyncExternalStore } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  /** Rendered on server and initial client paint to avoid hydration mismatch. */
  fallback?: React.ReactNode;
}

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders children only after mount. Use to avoid hydration mismatches
 * with components that generate different server vs client markup (e.g. Radix UI
 * useId/aria-controls with Next.js 16 / React 19).
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
