"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip="RPS Micro Electronics">
          <Link href="/dashboard">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="/Logo.png" alt="RPS Micro Electronics" />
              <AvatarFallback className="rounded-lg bg-transparent text-xs font-semibold">
                RPS
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                RPS Micro Electronics
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Job Management System
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

