"use client";

import { Type } from "lucide-react";
import { useFontScale } from "@/hooks/useFontScale";
import { FONT_SCALES, isFontScale } from "@/lib/font-scale";
import { cn } from "@/lib/utils";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

// "Aa" sample rendered at the option's real size (fixed px, so the menu
// itself doesn't grow while you compare).
function Sample({ percent }: { percent: number }) {
  return (
    <span
      aria-hidden
      className="font-semibold leading-none"
      style={{ fontSize: `${(14 * percent) / 100}px` }}
    >
      Aa
    </span>
  );
}

/** Three-way switch for the sidebar footer, next to the theme select. */
export function FontScaleSegmented() {
  const { scale, setScale, mounted } = useFontScale();
  const { state } = useSidebar();

  if (state === "collapsed") return null;

  return (
    <div className="px-2">
      <div
        role="radiogroup"
        aria-label="Text size"
        className="grid grid-cols-3 gap-1 rounded-md border bg-input/30 p-0.5"
      >
        {FONT_SCALES.map((s) => {
          const active = mounted && scale === s.value;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={`Text size: ${s.label}`}
              onClick={() => setScale(s.value)}
              className={cn(
                "flex h-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground",
                active && "bg-background text-foreground shadow-xs",
              )}
            >
              <Sample percent={s.percent} />
              <span className="sr-only">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Text size" submenu for the user menu (mobile and desktop top bar). */
export function FontScaleMenuSub() {
  const { scale, setScale } = useFontScale();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Type className="mr-2 h-4 w-4 text-muted-foreground" />
        <span>Text size</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        <DropdownMenuRadioGroup
          value={scale}
          onValueChange={(v) => isFontScale(v) && setScale(v)}
        >
          {FONT_SCALES.map((s) => (
            <DropdownMenuRadioItem
              key={s.value}
              value={s.value}
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between gap-3"
            >
              <span>{s.label}</span>
              <Sample percent={s.percent} />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
