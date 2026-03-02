import { motion } from "motion/react";

const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

const days = [
  { y: 8, label: "Mon", hasItem: true },
  { y: 42, label: "Tue", hasItem: true },
  { y: 76, label: "Wed", hasItem: false, isTarget: true },
  { y: 110, label: "Thu", hasItem: false },
];

export default function MealPlannerIllustration() {
  return (
    <svg viewBox="0 0 260 150" width="100%" height="100%">
      {/* Day rows (vertical stack like the real UI) */}
      {days.map((day, i) => (
        <motion.g
          key={day.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: "easeOut" }}
        >
          {/* Day label */}
          <text
            x="18"
            y={day.y + 10}
            fontSize="10"
            fontWeight="600"
            fill={day.isTarget ? "var(--accent-color)" : "var(--muted-foreground)"}
            fontFamily="sans-serif"
          >
            {day.label}
          </text>

          {/* Row background */}
          <rect
            x="50"
            y={day.y}
            width="190"
            height="28"
            rx="8"
            fill={day.isTarget ? "none" : "var(--secondary)"}
            stroke={day.isTarget ? "var(--accent-color)" : "var(--border)"}
            strokeWidth={day.isTarget ? "1.5" : "0.5"}
            strokeDasharray={day.isTarget ? "5 3" : "none"}
          />

          {/* Existing recipe card inside row */}
          {day.hasItem && (
            <motion.g
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
            >
              <rect
                x="54"
                y={day.y + 4}
                width="182"
                height="20"
                rx="5"
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              {/* Thumbnail placeholder */}
              <rect x="57" y={day.y + 6} width="16" height="16" rx="4" fill="var(--muted-foreground)" opacity="0.15" />
              {/* Recipe name line */}
              <rect x="78" y={day.y + 10} width={i === 0 ? "60" : "45"} height="3" rx="1.5" fill="var(--foreground)" opacity="0.4" />
              <rect x="78" y={day.y + 16} width={i === 0 ? "40" : "30"} height="2.5" rx="1" fill="var(--muted-foreground)" opacity="0.25" />
            </motion.g>
          )}
        </motion.g>
      ))}

      {/* Orange highlight pulse on target row (Wed) */}
      <motion.rect
        x="50"
        y="76"
        width="190"
        height="28"
        rx="8"
        fill="var(--accent-color)"
        animate={{ opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Curved dashed arrow from above into the target row */}
      <motion.path
        d="M 220 50 Q 230 60 200 72 Q 180 78 160 82"
        stroke="var(--muted-foreground)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />

      {/* Floating recipe card being dragged into Wed row */}
      <motion.g
        initial={{ x: 30, y: -20, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ ...popSpring, delay: 0.6 }}
      >
        <motion.g
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
          style={{ transformOrigin: "145px 90px" }}
        >
          {/* Card shadow */}
          <rect
            x="56"
            y="82"
            width="182"
            height="20"
            rx="5"
            fill="var(--accent-color)"
            opacity="0.12"
            transform="translate(1.5, 1.5)"
          />
          {/* Card body */}
          <rect
            x="54"
            y="80"
            width="182"
            height="20"
            rx="5"
            fill="var(--accent-color)"
          />
          {/* Thumbnail */}
          <rect x="57" y="82" width="16" height="16" rx="4" fill="white" opacity="0.3" />
          {/* Text lines */}
          <rect x="78" y="86" width="55" height="3" rx="1.5" fill="white" opacity="0.8" />
          <rect x="78" y="92" width="35" height="2.5" rx="1" fill="white" opacity="0.5" />
        </motion.g>
      </motion.g>

      {/* Drag cursor hint */}
      <motion.circle
        cx="145"
        cy="76"
        r="3"
        fill="var(--foreground)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{ duration: 1.5, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
