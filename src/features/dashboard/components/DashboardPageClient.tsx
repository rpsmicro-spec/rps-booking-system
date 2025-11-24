"use client";

import { PullToSearch } from "@/components/pwa/PullToSearch";
import { ReactNode } from "react";

interface DashboardPageClientProps {
  children: ReactNode;
}

export function DashboardPageClient({ children }: DashboardPageClientProps) {
  return <PullToSearch>{children}</PullToSearch>;
}

