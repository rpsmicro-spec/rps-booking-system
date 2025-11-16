"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Users, Moon, Sun, Monitor, Activity } from "lucide-react";
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
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";
import type { User as UserType } from "@/types/types";
import { InstallButton } from "@/components/pwa/InstallButton";

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

  const handleLogout = async (logoutEverywhere = false) => {
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

  const hasName = user?.name && user.name.trim().length > 0;
  const userRole = (user?.role as UserRole) || "staff";
  const canManageUsers = userRole === "owner" || userRole === "admin";

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />;
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
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

  const UserMenu = () => {
    if (isLoading) {
      return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
    }

    if (!user) return null;

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-input/50 dark:bg-input/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
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
      {/* Mobile: Show logo and title with theme toggle, install button and user menu */}
      <div className="md:hidden flex items-center gap-2 flex-1 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 min-w-0 flex-1"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleThemeToggle}
          disabled={!mounted}
        >
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <InstallButton />
        <UserMenu />
      </div>

      {/* Desktop: Show install button and user menu */}
      <div className="hidden md:flex items-center gap-4">
        <InstallButton />
        <UserMenu />
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
