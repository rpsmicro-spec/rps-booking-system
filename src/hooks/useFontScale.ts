"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  FONT_SCALE_EVENT,
  FONT_SCALE_STORAGE_KEY,
  applyFontScale,
  readFontScale,
  saveFontScale,
  type FontScale,
} from "@/lib/font-scale";

// Keeps every control on the page, and other open tabs, in step.
function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== FONT_SCALE_STORAGE_KEY) return;
    applyFontScale(readFontScale());
    onChange();
  };
  window.addEventListener(FONT_SCALE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FONT_SCALE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = (): FontScale | null => null;

export function useFontScale() {
  // null on the server and during hydration, the stored value after.
  const stored = useSyncExternalStore<FontScale | null>(
    subscribe,
    readFontScale,
    getServerSnapshot,
  );

  const setScale = useCallback((next: FontScale) => saveFontScale(next), []);

  return { scale: stored ?? "default", setScale, mounted: stored !== null };
}
