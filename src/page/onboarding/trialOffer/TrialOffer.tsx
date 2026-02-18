import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";

const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

// Sparkle positions scattered around the center badge
const sparkles = [
  { emoji: "✨", x: -90, y: -60 },
  { emoji: "⭐", x: 80, y: -70 },
  { emoji: "✨", x: -75, y: 55 },
  { emoji: "⭐", x: 85, y: 50 },
  { emoji: "✨", x: 15, y: -95 },
  { emoji: "⭐", x: -20, y: 90 },
];

export default function TrialOffer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      {/* Title */}
      <motion.div
        className="text-center px-2"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font leading-tight">
          {t("trialOffer.title")}
        </h1>
      </motion.div>

      {/* Center visual: badge + sparkles */}
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Main badge */}
        <motion.div
          className="relative z-10 flex items-center justify-center w-36 h-36 rounded-full bg-white"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            scale: { ...popSpring, delay: 0.3 },
            opacity: { duration: 0.2, delay: 0.3 },
          }}
        >
          <span className="text-3xl font-bold first-font text-foreground">$0.00</span>
        </motion.div>

        {/* Sparkle bubbles */}
        {sparkles.map((item, i) => (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center w-10 h-10 rounded-full bg-white"
            style={{
              left: `calc(50% + ${item.x}px)`,
              top: `calc(50% + ${item.y}px)`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              scale: { ...popSpring, delay: 0.5 + i * 0.07 },
              opacity: { duration: 0.15, delay: 0.5 + i * 0.07 },
            }}
          >
            <span className="text-xl">{item.emoji}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom: note + button */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
      >
        <p className="text-sm text-muted-foreground flex items-center gap-1 second-font">
          <Check className="w-4 h-4 text-green-500 shrink-0" />
          {t("trialOffer.noPayment")}
        </p>

        <OnboardingButton
          label={t("trialOffer.button")}
          onClick={() => navigate("/trialreminder")}
        />
      </motion.div>
    </OnboardingLayout>
  );
}
