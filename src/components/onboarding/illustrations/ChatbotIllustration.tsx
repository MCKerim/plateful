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
        height="56"
        rx="16"
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.1 }}
        style={{ transformOrigin: "95px 80px" }}
      />

      {/* Typing dots inside left bubble */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={75 + i * 20}
          cy={80}
          r="5"
          fill="var(--muted-foreground)"
          animate={{ y: [0, -4, 0] }}
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
        height="48"
        rx="16"
        fill="var(--accent-color)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...popSpring, delay: 0.6 }}
        style={{ transformOrigin: "190px 47px" }}
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
        <rect x="168" y="34" width="68" height="6" rx="1.5" fill="white" opacity="0.8" />
        <rect x="168" y="44" width="50" height="6" rx="1.5" fill="white" opacity="0.5" />
      </motion.g>
    </svg>
  );
}
