"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { state, isMobile } = useSidebar();

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="px-2">
        <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  const isCollapsed = state === "collapsed";

  const getThemeIcon = (themeValue: string | undefined) => {
    switch (themeValue) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeValue: string | undefined) => {
    switch (themeValue) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  // Collapsed state: show icon button with dropdown
  if (isCollapsed) {
    return (
      <div className="px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-full aspect-square"
                >
                  {getThemeIcon(theme)}
                  <span className="sr-only">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="center">
                <DropdownMenuItem onSelect={() => setTheme("light")}>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("dark")}>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("system")}>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={!isCollapsed || isMobile}>
            Theme: {getThemeLabel(theme)}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Expanded state: show full select
  return (
    <div className="px-2">
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-full h-8">
          <div className="flex items-center gap-2 flex-1">
            {getThemeIcon(theme)}
            <SelectValue placeholder="Theme">
              {getThemeLabel(theme)}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

