import { motion } from "motion/react";

const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

export default function ChatbotIllustration() {
  return (
    <svg viewBox="0 0 280 160" width="100%" height="100%">
      {/* Large chat bubble (left/user side) */}
      <motion.rect
        x="30"
        y="50"
        width="130"
        height="60"
        rx="16"
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.1 }}
        style={{ transformOrigin: "95px 80px" }}
      />
      {/* Bubble tail (left) */}
      <motion.path
        d="M 50 110 L 42 125 L 62 110"
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      {/* Cover tail-bubble seam */}
      <motion.rect
        x="49"
        y="105"
        width="16"
        height="7"
        fill="var(--secondary)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />

      {/* Typing dots inside left bubble */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={75 + i * 20}
          cy={80}
          r="5"
          fill="var(--muted-foreground)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.5 + i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Reply bubble (right/AI side) */}
      <motion.rect
        x="130"
        y="20"
        width="120"
        height="55"
        rx="16"
        fill="var(--accent-color)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.6 }}
        style={{ transformOrigin: "190px 47px" }}
      />
      {/* Bubble tail (right) */}
      <motion.path
        d="M 228 75 L 238 88 L 218 75"
        fill="var(--accent-color)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      {/* Cover tail-bubble seam */}
      <motion.rect
        x="216"
        y="70"
        width="14"
        height="7"
        fill="var(--accent-color)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />

      {/* Recipe card lines inside reply bubble */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        {/* Small image placeholder */}
        <rect x="144" y="32" width="18" height="18" rx="5" fill="white" opacity="0.35" />
        {/* Text lines next to image */}
        <rect x="168" y="34" width="68" height="3.5" rx="1.5" fill="white" opacity="0.8" />
        <rect x="168" y="42" width="50" height="3" rx="1.5" fill="white" opacity="0.5" />
        {/* Bottom line spanning full width */}
        <rect x="144" y="56" width="92" height="3" rx="1.5" fill="white" opacity="0.4" />
      </motion.g>

      {/* AI sparkle */}
      <motion.g
        initial={{ opacity: 0, scale: 0, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ ...popSpring, delay: 1.1 }}
        style={{ transformOrigin: "258px 18px" }}
      >
        <motion.path
          d="M 258 8 L 260 15 L 267 18 L 260 21 L 258 28 L 256 21 L 249 18 L 256 15 Z"
          fill="var(--accent-color)"
          animate={{ rotate: [0, 15, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "258px 18px" }}
        />
      </motion.g>

      {/* Small sparkle */}
      <motion.path
        d="M 240 32 L 241 35 L 244 36 L 241 37 L 240 40 L 239 37 L 236 36 L 239 35 Z"
        fill="var(--accent-color)"
        opacity="0.6"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ ...popSpring, delay: 1.3 }}
        style={{ transformOrigin: "240px 36px" }}
      />
    </svg>
  );
}
