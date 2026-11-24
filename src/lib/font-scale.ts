// Text size preference, stored per device. Only text scales: the CSS in
// globals.css multiplies every Tailwind text size by --font-scale, while
// spacing and layout stay in plain rem, so layouts keep their shape.

export const FONT_SCALES = [
  { value: "default", label: "Default", percent: 100 },
  { value: "large", label: "Large", percent: 115 },
  { value: "xl", label: "Extra large", percent: 130 },
] as const;

export type FontScale = (typeof FONT_SCALES)[number]["value"];

export const FONT_SCALE_STORAGE_KEY = "rps-font-scale";
export const FONT_SCALE_EVENT = "rps-font-scale-change";

export function isFontScale(value: unknown): value is FontScale {
  return FONT_SCALES.some((s) => s.value === value);
}

export function readFontScale(): FontScale {
  try {
    const stored = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    return isFontScale(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

export function applyFontScale(scale: FontScale) {
  const root = document.documentElement;
  if (scale === "default") root.removeAttribute("data-font-scale");
  else root.setAttribute("data-font-scale", scale);
}

export function saveFontScale(scale: FontScale) {
  try {
    if (scale === "default") localStorage.removeItem(FONT_SCALE_STORAGE_KEY);
    else localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
  } catch {
    // Private mode or blocked storage: the choice still applies to this page.
  }
  applyFontScale(scale);
  window.dispatchEvent(new CustomEvent(FONT_SCALE_EVENT, { detail: scale }));
}

// Runs in <head> before first paint so a saved size never flashes at 100%.
export const fontScaleInitScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  FONT_SCALE_STORAGE_KEY,
)});if(s==="large"||s==="xl")document.documentElement.setAttribute("data-font-scale",s);}catch(e){}})();`;
