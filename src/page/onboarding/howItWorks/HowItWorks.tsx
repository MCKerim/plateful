import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Download, Wand2, CalendarDays, Heart } from "lucide-react";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";

const steps = [
  { icon: Download, key: "step1" },
  { icon: Wand2, key: "step2" },
  { icon: CalendarDays, key: "step3" },
  { icon: Heart, key: "step4" },
] as const;

const popSpring = { type: "spring" as const, stiffness: 400, damping: 12 };

export default function HowItWorks() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/socialproof")}>
      {/* Title */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font">
          {t("howItWorks.title")}
        </h1>
      </motion.div>

      {/* Steps */}
      <div className="flex flex-col items-center w-full max-w-xs">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const delay = 0.3 + i * 0.2;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-4 w-full">
              {/* Icon column with connecting line */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-12 h-12 rounded-full bg-[var(--accent-color)] flex items-center justify-center shrink-0"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    scale: { ...popSpring, delay },
                    opacity: { duration: 0.2, delay },
                  }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </motion.div>

                {/* Connecting line */}
                {!isLast && (
                  <motion.div
                    className="w-px bg-[var(--accent-color)]/30 origin-top"
                    style={{ height: 32 }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: delay + 0.15,
                      ease: "easeOut",
                    }}
                  />
                )}
              </div>

              {/* Text */}
              <motion.div
                className="pt-2.5"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: delay + 0.1, ease: "easeOut" }}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {i + 1}.
                </span>{" "}
                <span className="text-base font-semibold second-font">
                  {t(`howItWorks.${step.key}`)}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Spacer to push button to bottom */}
      <div />
    </OnboardingLayout>
  );
}
