import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  rows?: number; // Default to 1 row
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enterKeyHint, rows = 3, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Store current scroll position
        const scrollTop =
          globalThis.pageYOffset || document.documentElement.scrollTop;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;

        // Restore scroll position to prevent jumping
        globalThis.scrollTo(0, scrollTop);
      }
    }, []);

    React.useImperativeHandle(ref, () => textareaRef.current!, []);

    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (props.onInput) {
        props.onInput(e);
      }
    };

    return (
      <textarea
        {...props}
        ref={textareaRef}
        rows={rows}
        onInput={handleInput}
        enterKeyHint={enterKeyHint}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
          className
        )}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
