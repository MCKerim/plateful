import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Check, Link2, ChefHat, CalendarDays } from "lucide-react";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";

const features = [
  {
    icon: Link2,
    color: "bg-orange-100 text-orange-500",
    titleKey: "trialOffer.features.import",
    descKey: "trialOffer.features.importDesc",
  },
  {
    icon: ChefHat,
    color: "bg-violet-100 text-violet-500",
    titleKey: "trialOffer.features.aiChef",
    descKey: "trialOffer.features.aiChefDesc",
  },
  {
    icon: CalendarDays,
    color: "bg-emerald-100 text-emerald-500",
    titleKey: "trialOffer.features.planning",
    descKey: "trialOffer.features.planningDesc",
  },
] as const;

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

      {/* Value stack */}
      <div className="flex flex-col w-full max-w-sm gap-3 px-2">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.titleKey}
              className="flex items-center gap-4 bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.3 + i * 0.15,
                ease: "easeOut",
              }}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${feature.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-sm first-font">
                  {t(feature.titleKey)}
                </span>
                <span className="text-xs text-muted-foreground second-font">
                  {t(feature.descKey)}
                </span>
              </div>

              <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />
            </motion.div>
          );
        })}
      </div>

      {/* Bottom: note + button */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
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
