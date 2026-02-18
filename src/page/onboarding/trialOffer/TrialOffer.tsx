import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Check, Gift } from "lucide-react";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";

const lineItems = [
  "trialOffer.features.import",
  "trialOffer.features.aiChef",
  "trialOffer.features.planning",
] as const;

const DIVIDER_1_DELAY = 0.45;
const ITEMS_START_DELAY = 0.58;
const ITEM_STAGGER = 0.12;
const DIVIDER_2_DELAY = ITEMS_START_DELAY + lineItems.length * ITEM_STAGGER + 0.1;
const TOTAL_DELAY = DIVIDER_2_DELAY + 0.2;
const BOTTOM_DELAY = TOTAL_DELAY + 0.25;

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

      {/* Receipt card */}
      <motion.div
        className="w-full max-w-sm bg-white dark:bg-card rounded-3xl shadow-md overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 shrink-0">
            <Gift className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div>
            <p className="font-bold first-font text-base leading-tight">
              {t("trialOffer.trialLabel")}
            </p>
            <p className="text-xs text-muted-foreground second-font">
              {t("trialOffer.trialSub")}
            </p>
          </div>
        </div>

        {/* Divider 1 */}
        <motion.div
          className="h-px bg-border mx-5 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: DIVIDER_1_DELAY, ease: "easeOut" }}
        />

        {/* Line items */}
        <div className="flex flex-col gap-3 px-5 py-4">
          {lineItems.map((key, i) => (
            <motion.div
              key={key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: ITEMS_START_DELAY + i * ITEM_STAGGER,
                ease: "easeOut",
              }}
            >
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm second-font">{t(key)}</span>
            </motion.div>
          ))}
        </div>

        {/* Divider 2 */}
        <motion.div
          className="h-px bg-border mx-5 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, delay: DIVIDER_2_DELAY, ease: "easeOut" }}
        />

        {/* Total row */}
        <motion.div
          className="flex items-center justify-between px-5 py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 22,
            delay: TOTAL_DELAY,
          }}
        >
          <span className="font-semibold text-sm first-font">
            {t("trialOffer.totalLabel")}
          </span>
          <span className="font-bold text-xl first-font text-[var(--accent-color)]">
            $0.00
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom: note + button */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: BOTTOM_DELAY, ease: "easeOut" }}
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
