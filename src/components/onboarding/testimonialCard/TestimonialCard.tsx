import { motion } from "motion/react";
import StarIcon from "@mui/icons-material/Star";

type Props = {
  quote: string;
  name: string;
  /** Base delay before the card starts animating (seconds) */
  delay: number;
  /** Slight rotation in degrees for a playful feel */
  rotate?: number;
};

export default function TestimonialCard({ quote, name, delay, rotate = 0 }: Readonly<Props>) {
  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-md border-2 border-dashed"
      initial={{ opacity: 0, y: 30, scale: 0.95, rotate: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate }}
      transition={{
        default: { duration: 0.5, delay, ease: "easeOut" },
        scale: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex gap-0.5 text-accent">
        {Array.from({ length: 5 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.3,
              delay: delay + 0.15 + i * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 15,
            }}
          >
            <StarIcon fontSize="small" />
          </motion.span>
        ))}
      </div>

      <p className="text-sm mt-1">{quote}</p>

      <div className="mt-3 text-sm font-semibold second-font">- {name}</div>
    </motion.div>
  );
}
