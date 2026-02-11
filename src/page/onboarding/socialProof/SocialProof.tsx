import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { InAppReview } from "@capacitor-community/in-app-review";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";

export default function SocialProof() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  async function requestInAppReview() {
    try {
      await InAppReview.requestReview();
    } catch {
      // In-app review not available (beta/web/simulator) — continue silently
    }
    navigate("/createhousehold");
  }

  return (
    <OnboardingLayout>
      {/* Title */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold first-font">
          {t("socialProof.title")}
        </h1>
        <p className="text-lg italic second-font text-muted-foreground mt-1">
          {t("socialProof.subtitle")}
        </p>
      </motion.div>

      {/* Testimonial cards */}
      <div className="flex flex-col w-full max-w-sm gap-4">
        {/* Card 1: Sarah */}
        <motion.div
          className="bg-card rounded-2xl p-5 shadow-sm border"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <motion.span
            className="text-4xl first-font text-accent leading-none block"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4, type: "spring", stiffness: 200 }}
          >
            {"\u201C"}
          </motion.span>
          <p className="text-sm mt-1">
            {t("socialProof.testimonial1.quote")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold second-font">
              {t("socialProof.testimonial1.name")}
            </span>
            <FavoriteRoundedIcon sx={{ fontSize: 14 }} className="text-accent" />
            <span className="text-xs text-muted-foreground">
              {t("socialProof.testimonial1.role")}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Mom */}
        <motion.div
          className="bg-card rounded-2xl p-5 shadow-sm border border-dashed"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
          <motion.span
            className="text-4xl first-font text-accent leading-none block"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.7, type: "spring", stiffness: 200 }}
          >
            {"\u201C"}
          </motion.span>
          <p className="text-sm mt-1">
            {t("socialProof.testimonial2.quote")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold second-font">
              {t("socialProof.testimonial2.name")}
            </span>
            <span className="text-xs">😉</span>
            <span className="text-xs text-muted-foreground">
              {t("socialProof.testimonial2.role")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Review CTA + Buttons */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
      >
        <div className="text-center mb-1">
          <p className="text-sm second-font text-muted-foreground">
            {t("socialProof.reviewCta")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("socialProof.reviewSubtext")}
          </p>
        </div>

        <OnboardingButton
          label={t("socialProof.reviewButton")}
          onClick={requestInAppReview}
        />
        <OnboardingButton
          label={t("socialProof.skipButton")}
          variant="ghost"
          onClick={() => navigate("/createhousehold")}
        />
      </motion.div>
    </OnboardingLayout>
  );
}
