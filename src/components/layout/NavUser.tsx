"use client"

import { useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import {
  LogOut,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { clearLocalUserData, syncBeforeLogout } from "@/lib/offline/clear-local-data"
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles"
import type { User as UserType } from "@/types/types"
import { NameDialog } from "./NameDialog"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }).then((res) =>
    res.json()
  )

export function NavUser() {
  const router = useRouter()
  const { data, mutate } = useSWR<{ user?: UserType }>("/api/users/me", fetcher, {
    revalidateOnFocus: false,
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const user = data?.user ?? null
  const isLoading = !data && !user

  const handleLogout = async (logoutEverywhere = false, force = false) => {
    // Unsynced offline work would otherwise sit on this phone for the next
    // person who logs in. Try to flush it; if it can't be, warn first.
    if (!force) {
      const pending = await syncBeforeLogout()
      if (pending > 0) {
        setShowLogoutDialog(false)
        toast.error(
          `${pending} change${pending === 1 ? "" : "s"} on this phone ${pending === 1 ? "hasn't" : "haven't"} synced yet. Connect to the internet and let ${pending === 1 ? "it" : "them"} sync before logging out.`,
          {
            duration: 12000,
            action: {
              label: "Log out anyway",
              onClick: () => void handleLogout(logoutEverywhere, true),
            },
          }
        )
        return
      }
    }
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: logoutEverywhere
          ? {
              "X-Logout-Everywhere": "true",
            }
          : {},
      })

      if (response.ok) {
        // Only after the server confirmed: wipe this user's cached data.
        await clearLocalUserData()
        toast.success(
          logoutEverywhere
            ? "Logged out from all devices"
            : "Logged out successfully"
        )
        router.push("/login")
        router.refresh()
      } else {
        toast.error("Failed to log out")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setShowLogoutDialog(false)
    }
  }

  const handleNameSet = (name: string) => {
    const trimmedName = name.trim()
    if (user) {
      mutate({ user: { ...user, name: trimmedName } }, { revalidate: true })
    }
  }

  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
              <div className="h-4 w-4 animate-pulse rounded bg-current opacity-50" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 mt-1 animate-pulse rounded bg-muted" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const hasName = !!(user.name?.trim())
  const userRole = (user.role as UserRole) || "staff"
  const canManageUsers = userRole === "owner" || userRole === "admin"

  // Show dialog if name is not set
  if (!hasName) {
    return (
      <>
        <NameDialog open={true} onNameSet={handleNameSet} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" disabled tooltip="Name not set">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-input/50 dark:bg-input/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-muted-foreground">
                  Name not set
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    )
  }

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name || "User"}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-input/50 dark:bg-input/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-input/50 dark:bg-input/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canManageUsers && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/users">
                    <Users />
                    Users
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed out of your account. You can sign back in at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleLogout(false)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Log out
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => handleLogout(true)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Log out everywhere
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

