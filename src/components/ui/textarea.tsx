import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  rows?: number;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enterKeyHint, rows = 3, maxHeight, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Store current scroll position
        const scrollTop = globalThis.pageYOffset || document.documentElement.scrollTop;

        textarea.style.height = "auto";
        const newHeight = textarea.scrollHeight;

        if (maxHeight && newHeight > maxHeight) {
          textarea.style.height = `${maxHeight}px`;
          textarea.style.overflowY = "auto";
        } else {
          textarea.style.height = `${newHeight}px`;
          textarea.style.overflowY = "hidden";
        }

        // Restore scroll position to prevent jumping
        globalThis.scrollTo(0, scrollTop);
      }
    }, [maxHeight]);

    React.useImperativeHandle(ref, () => textareaRef.current!, []);

    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    const handleInput: React.ComponentProps<"textarea">["onInput"] = (e) => {
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
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
          className
        )}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
