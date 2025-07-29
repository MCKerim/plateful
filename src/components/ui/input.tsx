import * as React from "react";
import { Send, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  onDelete?: () => void;
  onSubmit?: () => void;
  showDeleteButton?: boolean;
  showSubmitButton?: boolean;
  autoComplete?: "on" | "off";
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  maxLength?: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      onDelete,
      showDeleteButton,
      onSubmit,
      showSubmitButton,
      enterKeyHint,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [currentLength, setCurrentLength] = React.useState(
      (props.value as string)?.length || (props.defaultValue as string)?.length || 0
    );

    // Update currentLength when value prop changes
    React.useEffect(() => {
      if (props.value !== undefined) {
        setCurrentLength((props.value as string)?.length || 0);
      }
    }, [props.value]);

    // Handle input change to track character count
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentLength(e.target.value.length);
      if (props.onChange) {
        props.onChange(e);
      }
    };
    // Common input classes
    const baseInputClasses =
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    // Add right padding when there's an action button or character count
    const inputClasses = cn(
      baseInputClasses,
      (onSubmit || onDelete) && "pr-10",
      className
    );

    // Common button classes
    const buttonClasses =
      "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors";

    // Render action button based on type
    const renderActionButton = () => {
      if (onSubmit && showSubmitButton) {
        return (
          <button type="button" onClick={onSubmit} className={buttonClasses}>
            <Send className="w-4 h-4" />
          </button>
        );
      }

      if (onDelete && showDeleteButton) {
        return (
          <button type="button" onClick={onDelete} className={buttonClasses}>
            <X className="w-4 h-4" />
          </button>
        );
      }

      return null;
    };

    const inputElement = (
      <input
        type={type}
        className={inputClasses}
        autoComplete={props.autoComplete || "off"}
        enterKeyHint={enterKeyHint}
        maxLength={maxLength}
        onChange={handleInputChange}
        ref={ref}
        {...props}
      />
    );

    // If there's an action button or character count, wrap in relative container
    if (onSubmit || onDelete || maxLength) {
      return (
        <div className="relative">
          {inputElement}
          {renderActionButton()}
          {maxLength && currentLength + 3 > maxLength && (
            <div className="absolute text-xs bottom-11 right-3 text-muted-foreground">
              <span
                className={
                  currentLength + 1 > maxLength ? "text-destructive font-bold" : ""
                }
              >
                {currentLength}/{maxLength}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Return plain input if no actions
    return inputElement;
  }
);
Input.displayName = "Input";

export { Input };
