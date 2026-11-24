"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  Users,
  Contact,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarLogo } from "./SidebarLogo";
import { NavUser } from "./NavUser";
import { ThemeSelect } from "./ThemeSelect";
import { FontScaleSegmented } from "./FontScaleControl";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/customers", label: "Customers", icon: Contact },
];

const adminNavItems = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { state, isMobile } = useSidebar();

  useEffect(() => {
    // Fetch current user's role from users table
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role || "staff");
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const canManageUsers = userRole === "owner" || userRole === "admin";
  const isCollapsed = state === "collapsed";

  const allNavItems = [...navItems, ...(canManageUsers ? adminNavItems : [])];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        {/* New Job CTA Button */}
        <div className="px-2 py-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" className="w-full aspect-square">
                  <Link href="/jobs/new">
                    <Plus />
                    <span className="sr-only">New Job</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" hidden={!isCollapsed || isMobile}>
                New Job
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button asChild className="w-full" size="lg">
              <Link href="/jobs/new">
                <Plus />
                <span>New Job</span>
              </Link>
            </Button>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                    <Link href={item.href || "#"}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2">
          <Separator />
          <ThemeSelect />
          <FontScaleSegmented />
          <NavUser />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
