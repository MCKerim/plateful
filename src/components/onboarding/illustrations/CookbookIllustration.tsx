import { motion } from "motion/react";

const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

export default function CookbookIllustration() {
  return (
    <svg viewBox="0 0 280 160" width="100%" height="100%">
      {/* Back card (rotated left) */}
      <motion.rect
        x="68"
        y="18"
        width="100"
        height="130"
        rx="12"
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: -8 }}
        transition={{ ...popSpring, delay: 0.1 }}
        style={{ transformOrigin: "118px 83px" }}
      />

      {/* Middle card (rotated right) */}
      <motion.rect
        x="100"
        y="15"
        width="100"
        height="130"
        rx="12"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
        animate={{ opacity: 1, scale: 1, rotate: 5 }}
        transition={{ ...popSpring, delay: 0.25 }}
        style={{ transformOrigin: "150px 80px" }}
      />

      {/* Front card (centered, slight float) */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.4 }}
        style={{ transformOrigin: "140px 80px" }}
      >
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {/* Card body */}
          <rect
            x="85"
            y="12"
            width="110"
            height="136"
            rx="12"
            fill="var(--background)"
            stroke="var(--accent-color)"
            strokeWidth="2"
          />

          {/* Image placeholder area */}
          <rect
            x="95"
            y="22"
            width="90"
            height="55"
            rx="8"
            fill="var(--secondary)"
          />

          {/* Small plate icon in image area */}
          <ellipse cx="140" cy="44" rx="18" ry="6" fill="var(--muted-foreground)" opacity="0.3" />
          <ellipse cx="140" cy="43" rx="14" ry="4" fill="var(--muted-foreground)" opacity="0.2" />

          {/* Title line */}
          <rect x="95" y="86" width="70" height="5" rx="2.5" fill="var(--foreground)" opacity="0.6" />

          {/* Description lines */}
          <rect x="95" y="97" width="90" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.4" />
          <rect x="95" y="105" width="75" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.3" />
          <rect x="95" y="113" width="60" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.3" />

          {/* Heart/bookmark with draw animation */}
          <motion.path
            d="M 170 125 L 170 140 L 178 135 L 186 140 L 186 125"
            stroke="var(--accent-color)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          />
        </motion.g>
      </motion.g>

      {/* Plus badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.8 }}
        style={{ transformOrigin: "210px 28px" }}
      >
        <circle cx="210" cy="28" r="16" fill="var(--accent-color)" />
        <path
          d="M 210 20 L 210 36 M 202 28 L 218 28"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </motion.g>

      {/* Small link icon hint */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ ...popSpring, delay: 1.0 }}
        style={{ transformOrigin: "230px 70px" }}
      >
        <path
          d="M 224 65 Q 218 65 218 71 Q 218 77 224 77 M 236 65 Q 242 65 242 71 Q 242 77 236 77 M 226 71 L 234 71"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </svg>
  );
}
