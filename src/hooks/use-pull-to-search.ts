"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UsePullToSearchOptions {
  onSearch: () => void;
  threshold?: number; // Distance in pixels to trigger search
  disabled?: boolean;
  enabled?: boolean; // Only enable on mobile/touch devices
}

interface PullToSearchState {
  isPulling: boolean;
  pullDistance: number;
  canPull: boolean; // Whether we're at the top and can pull
}

export function usePullToSearch({
  onSearch,
  threshold = 80,
  disabled = false,
  enabled = true,
}: UsePullToSearchOptions) {
  // Initialize canPull based on current scroll position
  const getInitialCanPull = () => {
    if (typeof window === "undefined") return false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    return scrollTop === 0;
  };

  const [state, setState] = useState<PullToSearchState>({
    isPulling: false,
    pullDistance: 0,
    canPull: getInitialCanPull(),
  });

  const touchStartY = useRef<number | null>(null);
  const isSearchingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const checkCanPull = useCallback(() => {
    if (typeof window === "undefined") return false;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    return scrollTop === 0;
  }, []);

  const handleSearch = useCallback(() => {
    if (isSearchingRef.current) return;
    
    isSearchingRef.current = true;
    onSearch();
    
    // Reset after a short delay
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
      }));
      pullDistanceRef.current = 0;
      isSearchingRef.current = false;
    }, 200);
  }, [onSearch]);

  useEffect(() => {
    if (disabled || !enabled || typeof window === "undefined") return;

    // Check if device supports touch
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0;

    if (!isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!checkCanPull() || isSearchingRef.current) return;

      touchStartY.current = e.touches[0].clientY;
      setState((prev) => ({ ...prev, canPull: true }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || !checkCanPull() || isSearchingRef.current) {
        return;
      }

      const touchY = e.touches[0].clientY;
      const pullDistance = Math.max(0, touchY - touchStartY.current);

      // Only allow pull if scrolling down from top
      if (pullDistance > 0 && checkCanPull()) {
        e.preventDefault(); // Prevent default scroll behavior
        const cappedDistance = Math.min(pullDistance, threshold * 1.5); // Cap at 1.5x threshold
        pullDistanceRef.current = cappedDistance;
        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance: cappedDistance,
        }));
      } else {
        pullDistanceRef.current = 0;
        setState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }
    };

    const handleTouchEnd = () => {
      if (touchStartY.current === null || isSearchingRef.current) {
        touchStartY.current = null;
        return;
      }

      const currentPullDistance = pullDistanceRef.current;

      if (currentPullDistance >= threshold && checkCanPull()) {
        handleSearch();
      } else {
        pullDistanceRef.current = 0;
        setState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }

      touchStartY.current = null;
    };

    // Also handle scroll to update canPull state
    const handleScroll = () => {
      const canPull = checkCanPull();
      setState((prev) => {
        // Reset if scrolled away from top
        if (!canPull && prev.isPulling) {
          pullDistanceRef.current = 0;
          touchStartY.current = null;
          return {
            ...prev,
            canPull,
            isPulling: false,
            pullDistance: 0,
          };
        }
        return { ...prev, canPull };
      });
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [disabled, enabled, threshold, checkCanPull, handleSearch]);

  return {
    ...state,
    progress: Math.min(state.pullDistance / threshold, 1), // 0 to 1
    shouldTrigger: state.pullDistance >= threshold,
  };
}

