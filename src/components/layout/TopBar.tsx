"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontScaleMenuSub } from "./FontScaleControl";
import { LogOut, Users, Moon, Sun, Monitor, Activity } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { clearLocalUserData, syncBeforeLogout } from "@/lib/offline/clear-local-data";
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";
import type { User as UserType } from "@/types/types";
import { InstallButton } from "@/components/pwa/InstallButton";
import { SyncStatusIndicator } from "@/components/offline/SyncStatusIndicator";

/** "Demo Owner" → "DO", "asha" → "AS", "owner@demo.local" → "OW". */
function getInitials(name?: string | null, email?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  const source = words[0] ?? (email ?? "").split("@")[0];
  const letters = source.replace(/[^\p{L}\p{N}]/gu, "");
  return (letters.slice(0, 2) || "?").toUpperCase();
}

export function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Ignore errors
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async (logoutEverywhere = false, force = false) => {
    // Unsynced offline work would otherwise sit on this phone for the next
    // person who logs in. Try to flush it; if it can't be, warn first.
    if (!force) {
      const pending = await syncBeforeLogout();
      if (pending > 0) {
        setShowLogoutDialog(false);
        toast.error(
          `${pending} change${pending === 1 ? "" : "s"} on this phone ${pending === 1 ? "hasn't" : "haven't"} synced yet. Connect to the internet and let ${pending === 1 ? "it" : "them"} sync before logging out.`,
          {
            duration: 12000,
            action: {
              label: "Log out anyway",
              onClick: () => void handleLogout(logoutEverywhere, true),
            },
          }
        );
        return;
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
      });

      if (response.ok) {
        // Only after the server confirmed: wipe this user's cached data.
        await clearLocalUserData();
        toast.success(
          logoutEverywhere
            ? "Logged out from all devices"
            : "Logged out successfully"
        );
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Failed to log out");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const hasName = !!(user?.name?.trim());
  const userRole = (user?.role as UserRole) || "staff";
  const canManageUsers = userRole === "owner" || userRole === "admin";

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="size-[18px]" />;
    switch (theme) {
      case "light":
        return <Sun className="size-[18px]" />;
      case "dark":
        return <Moon className="size-[18px]" />;
      default:
        return <Monitor className="size-[18px]" />;
    }
  };

  const handleThemeToggle = () => {
    if (!mounted) return;
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const themeLabel = !mounted
    ? "Theme"
    : theme === "light"
      ? "Theme: light"
      : theme === "dark"
        ? "Theme: dark"
        : "Theme: system";

  const initials = getInitials(user?.name, user?.email);

  const renderUserMenu = () => {
    if (isLoading) {
      return (
        <div className="flex size-9 shrink-0 items-center justify-center">
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        </div>
      );
    }

    if (!user) return null;

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full p-0"
              aria-label={`Account menu for ${hasName ? user.name : user.email}`}
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-foreground text-xs font-semibold tracking-wide ring-1 ring-border">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {hasName ? user.name : "Name not set"}
                </p>
                <p className="text-xs leading-none text-muted-foreground hidden md:block">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {ROLE_LABELS[userRole]}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <FontScaleMenuSub />
            <DropdownMenuSeparator />
            {canManageUsers && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/users">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Users</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/activity">
                    <Activity className="mr-2 h-4 w-4" />
                    <span>Activity</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  return (
    <>
      {/* Mobile: Show logo and title with theme toggle, sync status, install button and user menu */}
      <div className="md:hidden flex items-center gap-1 flex-1 min-w-0">
        <Link
          href="/dashboard"
          className="mr-1 flex items-center gap-2 min-w-0 flex-1"
        >
          <Image
            src="/Logo.png"
            alt="RPS Micro Electronics"
            width={28}
            height={28}
            className="object-contain shrink-0 rounded-lg"
          />
          <h2 className="text-base font-semibold truncate">RPS Micro</h2>
        </Link>
        {/* Quick actions grouped in one pill; avatar sits beside it */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border bg-card/70 p-0.5 shadow-xs backdrop-blur [&_button]:size-8 [&_button]:rounded-full">
          <SyncStatusIndicator />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleThemeToggle}
            disabled={!mounted}
            aria-label={`${themeLabel}. Switch theme`}
            title={themeLabel}
          >
            {getThemeIcon()}
          </Button>
          <InstallButton />
        </div>
        <div className="ml-1 shrink-0">{renderUserMenu()}</div>
      </div>

      {/* Desktop: Show sync status, install button and user menu */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full border bg-card/70 p-0.5 shadow-xs [&_button]:h-8 [&_button]:rounded-full">
          <SyncStatusIndicator />
          <InstallButton />
        </div>
        {renderUserMenu()}
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account. You can sign back in at
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleLogout(true)}
              className={buttonVariants({ variant: "ghost" })}
            >
              Log out everywhere
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleLogout(false)}
              className={buttonVariants({ variant: "destructive" })}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
