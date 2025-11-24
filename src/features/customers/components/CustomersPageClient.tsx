"use client";

import { PullToSearch } from "@/components/pwa/PullToSearch";
import { ReactNode } from "react";

interface CustomersPageClientProps {
  children: ReactNode;
}

export function CustomersPageClient({ children }: CustomersPageClientProps) {
  return <PullToSearch>{children}</PullToSearch>;
}

