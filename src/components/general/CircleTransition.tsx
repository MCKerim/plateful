import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface CircleTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

export default function CircleTransition({
  isVisible,
  onComplete,
  duration = 1.0,
}: Readonly<CircleTransitionProps>) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleAnimationComplete = () => {
    if (onComplete) {
      onComplete();
    }
    setIsAnimating(false);
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-primary"
      style={{
        maskImage:
          "radial-gradient(circle, transparent var(--circle-size), black var(--circle-size))",
        WebkitMaskImage:
          "radial-gradient(circle, transparent var(--circle-size), black var(--circle-size))",
      }}
      initial={
        {
          "--circle-size": "0px",
        } as any
      }
      animate={
        {
          "--circle-size": "100vmax",
        } as any
      }
      transition={{
        duration: duration,
        ease: "easeInOut",
      }}
      onAnimationComplete={handleAnimationComplete}
    />
  );
}
