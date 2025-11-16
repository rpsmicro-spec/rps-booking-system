"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const isIndeterminate = value === undefined;
    const percentage = isIndeterminate
      ? undefined
      : Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        {isIndeterminate ? (
          <div
            className="h-full bg-primary animate-pulse"
            style={{ width: "60%" }}
          />
        ) : (
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
