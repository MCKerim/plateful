import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectUser, setUser } from "@/redux/slices/userSlice";
import { useCompleteOnboarding } from "@/hooks/user/useCompleteOnboarding";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";

export default function ChooseUsername() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const completeOnboardingMutation = useCompleteOnboarding();
  const { trackScreenViewed } = useOnboardingTracking();

  useEffect(() => {
    trackScreenViewed("choose_username");
  }, []);

  const [username, setUsername] = useState(user?.username || "");

  function handleNext() {
    if (!user) return;
    if (completeOnboardingMutation.isPending) return;

    const trimmed = username.trim();
    if (trimmed === "") {
      toast.error(t("chooseUsername.errors.empty"));
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 20) {
      toast.error(t("chooseUsername.errors.length"));
      return;
    }

    completeOnboardingMutation.mutate(
      { userId: user.id, username: trimmed },
      {
        onSuccess: () => {
          dispatch(setUser({ ...user, username: trimmed, has_completed_survey: true }));
          navigate("/createhousehold");
        },
        onError: (error) => {
          console.error("Error completing onboarding:", error);
          toast.error(t("chooseUsername.errors.updateFailed"));
        },
      }
    );
  }

  return (
    <OnboardingLayout nextButtonLabel={t("chooseUsername.nextButton")} onNext={handleNext}>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font">{t("chooseUsername.title")}</h1>
      </motion.div>

      <motion.div
        className="flex flex-col w-full max-w-sm gap-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <div className="grid items-center w-full gap-2">
          <Label htmlFor="username">{t("chooseUsername.label")}</Label>

          <Input
            id="username"
            placeholder={t("chooseUsername.placeholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
          />
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
