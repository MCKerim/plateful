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

const ITEMS_START_DELAY = 0.45;
const ITEM_STAGGER = 0.12;
const TOTAL_DELAY = ITEMS_START_DELAY + lineItems.length * ITEM_STAGGER + 0.2;
const BOTTOM_DELAY = TOTAL_DELAY + 0.3;

// 20 teeth across a 320-unit wide viewBox, each tooth 8px deep.
// Top edge: teeth point UP (card color fills the area below the peaks).
const TOP_PATH =
  "M0,16 L0,8 L8,0 L16,8 L24,0 L32,8 L40,0 L48,8 L56,0 L64,8 " +
  "L72,0 L80,8 L88,0 L96,8 L104,0 L112,8 L120,0 L128,8 L136,0 L144,8 " +
  "L152,0 L160,8 L168,0 L176,8 L184,0 L192,8 L200,0 L208,8 L216,0 L224,8 " +
  "L232,0 L240,8 L248,0 L256,8 L264,0 L272,8 L280,0 L288,8 L296,0 L304,8 " +
  "L312,0 L320,8 L320,16 Z";

// Bottom edge: teeth point DOWN (card color fills the area above the valleys).
const BOTTOM_PATH =
  "M0,0 L0,8 L8,16 L16,8 L24,16 L32,8 L40,16 L48,8 L56,16 L64,8 " +
  "L72,16 L80,8 L88,16 L96,8 L104,16 L112,8 L120,16 L128,8 L136,16 L144,8 " +
  "L152,16 L160,8 L168,16 L176,8 L184,16 L192,8 L200,16 L208,8 L216,16 L224,8 " +
  "L232,16 L240,8 L248,16 L256,8 L264,16 L272,8 L280,16 L288,8 L296,16 L304,8 " +
  "L312,16 L320,8 L320,0 Z";

function ReceiptEdge({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 320 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", fill: "hsl(var(--card))" }}
      className="w-full h-4"
    >
      <path d={path} />
    </svg>
  );
}

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

      {/* Receipt — drop-shadow follows the composite zigzag shape */}
      <motion.div
        className="w-full max-w-sm"
        style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.13))" }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <ReceiptEdge path={TOP_PATH} />

        {/* Card body — same bg and border style as testimonial cards */}
        <div className="bg-card border-l-2 border-r-2 border-dashed px-5">
          {/* Header row */}
          <div className="flex items-center gap-3 pt-3 pb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 shrink-0">
              <Gift className="w-5 h-5 text-accent" />
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

          {/* Tear line */}
          <div className="border-t-2 border-dashed border-border" />

          {/* Line items */}
          <div className="flex flex-col gap-3 py-4">
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

          {/* Tear line */}
          <div className="border-t-2 border-dashed border-border" />

          {/* Total row */}
          <motion.div
            className="flex items-center justify-between py-4"
            initial={{ opacity: 0, scale: 0.9 }}
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
            <span className="font-bold text-xl first-font text-accent">
              $0.00
            </span>
          </motion.div>
        </div>

        <ReceiptEdge path={BOTTOM_PATH} />
      </motion.div>

      {/* Note + button */}
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
