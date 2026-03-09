import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { useNotificationPermission } from "@/hooks/notifications/useNotificationPermission";
import { useUpdateNotificationPreferences } from "@/hooks/notifications/useUpdateNotificationPreferences";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notification.types";
import { useEffect } from "react";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";

export default function TrialReminder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { requestPermission, isSupported } = useNotificationPermission();
  const updatePreferences = useUpdateNotificationPreferences();
  const { trackScreenViewed } = useOnboardingTracking();

  useEffect(() => {
    trackScreenViewed("trial_reminder");
  }, []);

  async function handleContinue() {
    if (isSupported) {
      const granted = await requestPermission();
      if (granted) {
        await updatePreferences.mutateAsync(DEFAULT_NOTIFICATION_PREFERENCES);
      }
    }
    navigate("/subscribe");
  }

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
          {t("trialReminder.title")}
        </h1>
      </motion.div>

      {/* Center visual: bell bubble */}
      <motion.div
        className="flex items-center justify-center w-40 h-40 rounded-full bg-white"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          scale: { type: "spring", stiffness: 400, damping: 12, delay: 0.3 },
          opacity: { duration: 0.2, delay: 0.3 },
        }}
      >
        <motion.span
          className="text-7xl select-none"
          style={{ display: "inline-block" }}
          animate={{ rotate: [0, 14, -14, 10, -10, 5, 0] }}
          transition={{
            duration: 1.2,
            delay: 0.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut",
          }}
        >
          🔔
        </motion.span>
      </motion.div>

      {/* Bottom: note + button */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
      >
        <p className="text-sm text-muted-foreground flex items-center gap-1 second-font">
          <Check className="w-4 h-4 text-green-500 shrink-0" />
          {t("trialReminder.noPayment")}
        </p>

        <OnboardingButton
          label={t("trialReminder.button")}
          onClick={handleContinue}
        />
      </motion.div>
    </OnboardingLayout>
  );
}
