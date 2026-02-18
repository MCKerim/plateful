import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Check, Scissors } from "lucide-react";
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

// Teeth pointing DOWN — fills the card-coloured area above, exposes page bg below.
// 20 teeth across 320 units, each tooth 12px deep.
const BOTTOM_PATH =
  "M0,0 L0,10 L8,20 L16,10 L24,20 L32,10 L40,20 L48,10 L56,20 L64,10 " +
  "L72,20 L80,10 L88,20 L96,10 L104,20 L112,10 L120,20 L128,10 L136,20 L144,10 " +
  "L152,20 L160,10 L168,20 L176,10 L184,20 L192,10 L200,20 L208,10 L216,20 L224,10 " +
  "L232,20 L240,10 L248,20 L256,10 L264,20 L272,10 L280,20 L288,10 L296,20 L304,10 " +
  "L312,20 L320,10 L320,0 Z";

function ReceiptBottom() {
  return (
    <svg
      viewBox="0 0 320 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="w-full h-5 block"
      style={{ marginTop: "-1px", fill: "var(--card)" }}
    >
      <path d={BOTTOM_PATH} />
    </svg>
  );
}

function TearLine() {
  return (
    <div className="flex items-center gap-1 my-1">
      <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0 -ml-1" />
      <div className="flex-1 border-t-2 border-dashed border-border" />
    </div>
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

      {/* Receipt */}
      <motion.div
        className="w-full max-w-sm"
        style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))" }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        {/* Card body — rounded top, flush bottom (zigzag takes over) */}
        <div className="bg-card rounded-t-3xl border-2 border-dashed border-b-0 overflow-hidden">

          {/* Store header strip */}
          <div className="bg-accent/15 flex flex-col items-center py-3 gap-0.5">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
              Plateful
            </p>
            <p className="first-font text-xl font-bold">
              {t("trialOffer.trialLabel")}
            </p>
            <p className="text-xs text-muted-foreground second-font">
              {t("trialOffer.trialSub")}
            </p>
          </div>

          {/* Content body */}
          <div className="px-5 pt-4 pb-3">
            <TearLine />

            {/* Line items */}
            <div className="flex flex-col gap-2.5 py-3">
              {lineItems.map((key, i) => (
                <motion.div
                  key={key}
                  className="flex items-center gap-2.5"
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

            <TearLine />

            {/* Total row */}
            <motion.div
              className="flex items-center justify-between pt-3 pb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 22,
                delay: TOTAL_DELAY,
              }}
            >
              <span className="text-sm font-bold uppercase tracking-wide">
                {t("trialOffer.totalLabel")}
              </span>
              <span className="text-2xl font-black text-accent">$0.00</span>
            </motion.div>
          </div>
        </div>

        <ReceiptBottom />
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
