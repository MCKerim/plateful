import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  children?: React.ReactNode;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      children,
      ...props
    },
    ref
  ) => {
    if (!children) {
      return (
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "shrink-0 bg-border",
            orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
            className
          )}
          {...props}
        />
      );
    }

    // With text in the middle
    return (
      <div
        className={cn(
          "flex items-center w-full",
          orientation === "vertical" && "flex-col h-full"
        )}
      >
        <SeparatorPrimitive.Root
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "shrink-0 bg-border",
            orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
            orientation === "horizontal" ? "flex-1" : "flex-none"
          )}
        />

        <span className="mx-4 text-muted-foreground text-sm whitespace-nowrap">
          {children}
        </span>

        <SeparatorPrimitive.Root
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "shrink-0 bg-border",
            orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
            orientation === "horizontal" ? "flex-1" : "flex-none"
          )}
        />
      </div>
    );
  }
);
Separator.displayName = "Separator";

export { Separator };
