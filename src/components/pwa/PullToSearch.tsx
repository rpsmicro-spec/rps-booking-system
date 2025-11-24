"use client";

import { ReactNode } from "react";
import { usePullToSearch } from "@/hooks/use-pull-to-search";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";

interface PullToSearchProps {
  children: ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToSearch({
  children,
  disabled = false,
  threshold = 80,
  className,
}: PullToSearchProps) {
  const { openSearch } = useGlobalSearch();
  const { isPulling, pullDistance, progress, shouldTrigger } = usePullToSearch({
    onSearch: openSearch,
    threshold,
    disabled,
  });

  const showIndicator = isPulling;
  const indicatorHeight = Math.min(pullDistance * 0.5, 60);

  return (
    <div className={cn("relative", className)}>
      {/* Pull to search indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-b transition-all duration-200"
          style={{
            height: `${indicatorHeight}px`,
            opacity: Math.min(progress * 1.5, 1),
            transform: `translateY(${Math.max(0, indicatorHeight - 60)}px)`,
          }}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Search
              className={cn(
                "h-5 w-5 transition-all duration-200",
                shouldTrigger ? "text-primary" : "text-muted-foreground",
                isPulling && "scale-110"
              )}
              style={{
                transform: isPulling
                  ? `scale(${1 + progress * 0.1})`
                  : undefined,
              }}
            />
            {shouldTrigger ? (
              <span className="text-xs text-primary font-medium">
                Release to search
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Pull to search
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: showIndicator
            ? `translateY(${Math.max(0, indicatorHeight)}px)`
            : undefined,
          transition: "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
