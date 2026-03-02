import { useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const [hours, minutes] = value.split(":");
  const [focusedSegment, setFocusedSegment] = useState<"hours" | "minutes" | null>(null);
  const [hoursBuffer, setHoursBuffer] = useState("");
  const [minutesBuffer, setMinutesBuffer] = useState("");
  const hoursRef = useRef<HTMLSpanElement>(null);
  const minutesRef = useRef<HTMLSpanElement>(null);

  function commit(h: string, m: string) {
    const hNum = Math.min(23, Math.max(0, parseInt(h) || 0));
    const mNum = Math.min(59, Math.max(0, parseInt(m) || 0));
    onChange(`${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`);
  }

  function handleHoursKey(e: KeyboardEvent) {
    e.preventDefault();
    if (e.key === "Tab") {
      minutesRef.current?.focus();
      return;
    }
    if (e.key === "ArrowUp") {
      const next = (parseInt(hours) + 1) % 24;
      commit(String(next), minutes);
      return;
    }
    if (e.key === "ArrowDown") {
      const next = (parseInt(hours) - 1 + 24) % 24;
      commit(String(next), minutes);
      return;
    }
    if (e.key === "Backspace") {
      setHoursBuffer("");
      commit("0", minutes);
      return;
    }
    if (!/^\d$/.test(e.key)) return;

    const next = hoursBuffer + e.key;
    if (next.length === 1) {
      const num = parseInt(next);
      setHoursBuffer(num > 2 ? "" : next);
      if (num > 2) {
        commit(next, minutes);
        minutesRef.current?.focus();
      } else {
        commit(next, minutes);
      }
    } else {
      const num = parseInt(next);
      if (num <= 23) {
        commit(next, minutes);
        setHoursBuffer("");
        minutesRef.current?.focus();
      } else {
        commit(e.key, minutes);
        setHoursBuffer("");
      }
    }
  }

  function handleMinutesKey(e: KeyboardEvent) {
    e.preventDefault();
    if (e.key === "Tab") return;
    if (e.key === "ArrowUp") {
      const next = (parseInt(minutes) + 1) % 60;
      commit(hours, String(next));
      return;
    }
    if (e.key === "ArrowDown") {
      const next = (parseInt(minutes) - 1 + 60) % 60;
      commit(hours, String(next));
      return;
    }
    if (e.key === "Backspace") {
      setMinutesBuffer("");
      commit(hours, "0");
      return;
    }
    if (!/^\d$/.test(e.key)) return;

    const next = minutesBuffer + e.key;
    if (next.length === 1) {
      const num = parseInt(next);
      setMinutesBuffer(num > 5 ? "" : next);
      commit(hours, next);
    } else {
      const num = parseInt(next);
      if (num <= 59) {
        commit(hours, next);
        setMinutesBuffer("");
      } else {
        commit(hours, e.key);
        setMinutesBuffer("");
      }
    }
  }

  return (
    <div
      className={cn(
        "flex items-center h-9 w-fit rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
        focusedSegment && "ring-1 ring-ring outline-none",
        className
      )}
    >
      <span
        ref={hoursRef}
        tabIndex={0}
        role="spinbutton"
        aria-label="Hours"
        aria-valuenow={parseInt(hours)}
        aria-valuemin={0}
        aria-valuemax={23}
        onFocus={() => { setFocusedSegment("hours"); setHoursBuffer(""); }}
        onBlur={() => setFocusedSegment(null)}
        onKeyDown={handleHoursKey}
        className={cn(
          "w-7 text-center rounded cursor-default select-none outline-none",
          focusedSegment === "hours" && "bg-primary text-primary-foreground"
        )}
      >
        {hours}
      </span>
      <span className="text-muted-foreground mx-0.5">:</span>
      <span
        ref={minutesRef}
        tabIndex={0}
        role="spinbutton"
        aria-label="Minutes"
        aria-valuenow={parseInt(minutes)}
        aria-valuemin={0}
        aria-valuemax={59}
        onFocus={() => { setFocusedSegment("minutes"); setMinutesBuffer(""); }}
        onBlur={() => setFocusedSegment(null)}
        onKeyDown={handleMinutesKey}
        className={cn(
          "w-7 text-center rounded cursor-default select-none outline-none",
          focusedSegment === "minutes" && "bg-primary text-primary-foreground"
        )}
      >
        {minutes}
      </span>
    </div>
  );
}
