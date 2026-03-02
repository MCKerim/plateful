import { useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const [hours, minutes] = value.split(":");
  const hoursNum = parseInt(hours) || 0;
  const minutesNum = parseInt(minutes) || 0;
  const [focusedSegment, setFocusedSegment] = useState<"hours" | "minutes" | null>(null);
  const [hoursBuffer, setHoursBuffer] = useState("");
  const [minutesBuffer, setMinutesBuffer] = useState("");
  const hoursRef = useRef<HTMLSpanElement>(null);
  const minutesRef = useRef<HTMLSpanElement>(null);

  function commit(h: number, m: number) {
    const hNum = Math.min(23, Math.max(0, h));
    const mNum = Math.min(59, Math.max(0, m));
    onChange(`${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`);
  }

  function handleHoursKey(e: KeyboardEvent) {
    if (e.key === "Tab") {
      if (!e.shiftKey) minutesRef.current?.focus();
      return;
    }
    e.preventDefault();
    if (e.key === "ArrowUp") { commit((hoursNum + 1) % 24, minutesNum); return; }
    if (e.key === "ArrowDown") { commit((hoursNum - 1 + 24) % 24, minutesNum); return; }
    if (e.key === "Backspace") { setHoursBuffer(""); commit(0, minutesNum); return; }
    if (!/^\d$/.test(e.key)) return;

    const next = hoursBuffer + e.key;
    if (next.length === 1) {
      const num = parseInt(next);
      setHoursBuffer(num > 2 ? "" : next);
      commit(num, minutesNum);
      if (num > 2) minutesRef.current?.focus();
    } else {
      const num = parseInt(next);
      commit(num <= 23 ? num : parseInt(e.key), minutesNum);
      setHoursBuffer("");
      if (num <= 23) minutesRef.current?.focus();
    }
  }

  function handleMinutesKey(e: KeyboardEvent) {
    if (e.key === "Tab") return;
    e.preventDefault();
    if (e.key === "ArrowUp") { commit(hoursNum, (minutesNum + 1) % 60); return; }
    if (e.key === "ArrowDown") { commit(hoursNum, (minutesNum - 1 + 60) % 60); return; }
    if (e.key === "Backspace") { setMinutesBuffer(""); commit(hoursNum, 0); return; }
    if (!/^\d$/.test(e.key)) return;

    const next = minutesBuffer + e.key;
    if (next.length === 1) {
      const num = parseInt(next);
      setMinutesBuffer(num > 5 ? "" : next);
      commit(hoursNum, num);
    } else {
      const num = parseInt(next);
      commit(hoursNum, num <= 59 ? num : parseInt(e.key));
      setMinutesBuffer("");
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
        aria-valuenow={hoursNum}
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
        aria-valuenow={minutesNum}
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
