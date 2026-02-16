import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { AppReview } from "@capawesome/capacitor-app-review";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import TestimonialCard from "@/components/onboarding/testimonialCard/TestimonialCard";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectUser, setUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { toast } from "sonner";

export default function SocialProof() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  async function completeSurveyAndNavigate() {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ has_completed_survey: true })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user:", error);
      toast.error(t("survey.errors.completeFailed"));
      return;
    }

    dispatch(setUser({ ...user, has_completed_survey: true }));
    navigate("/subscribe");
  }

  async function requestInAppReview() {
    try {
      await AppReview.requestReview();
    } catch {
      // In-app review not available (beta/web/simulator) — continue silently
    }
    await completeSurveyAndNavigate();
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
        <h1 className="text-3xl font-bold first-font">{t("socialProof.title")}</h1>

        <p className="text-lg italic second-font text-muted-foreground mt-1">
          {t("socialProof.subtitle")}
        </p>
      </motion.div>

      {/* Testimonial cards */}
      <div
        className="flex flex-col w-full max-w-sm gap-6 px-4 overflow-y-auto flex-1 min-h-0 py-16 no-scrollbar"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <TestimonialCard
          quote={t("socialProof.testimonial1.quote")}
          name={t("socialProof.testimonial1.name")}
          delay={0.3}
          rotate={-2}
        />

        <TestimonialCard
          quote={t("socialProof.testimonial2.quote")}
          name={t("socialProof.testimonial2.name")}
          delay={0.6}
          rotate={1.5}
        />

        <TestimonialCard
          quote={t("socialProof.testimonial3.quote")}
          name={t("socialProof.testimonial3.name")}
          delay={0.9}
          rotate={-1}
        />
      </div>

      {/* Review CTA + Buttons */}
      <motion.div
        className="flex flex-col items-center w-full max-w-sm gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
      >
        <OnboardingButton
          label={t("socialProof.skipButton")}
          variant="ghost"
          onClick={completeSurveyAndNavigate}
        />

        <OnboardingButton label={t("socialProof.reviewButton")} onClick={requestInAppReview} />
      </motion.div>
    </OnboardingLayout>
  );
}
