"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { GlobalSearch } from "./GlobalSearch";

interface GlobalSearchContextType {
  openSearch: () => void;
  closeSearch: () => void;
  isOpen: boolean;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(
  undefined
);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => setIsOpen(false);

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Also support Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <GlobalSearchContext.Provider value={{ openSearch, closeSearch, isOpen }}>
      {children}
      <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (context === undefined) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  }
  return context;
}
