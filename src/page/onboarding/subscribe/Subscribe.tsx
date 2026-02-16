import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PAYWALL_RESULT } from "@revenuecat/purchases-capacitor";
import { useAppSelector } from "@/redux/hooks";
import { selectIsPro } from "@/redux/slices/subscriptionSlice";
import { usePresentPaywall } from "@/hooks/subscription/usePresentPaywall";
import { isNativePlatform } from "@/lib/revenuecat";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import LoadingScreen from "@/components/general/LoadingScreen";

export default function Subscribe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isPro = useAppSelector(selectIsPro);
  const { presentPaywall } = usePresentPaywall();
  const [error, setError] = useState(false);
  const presenting = useRef(false);

  useEffect(() => {
    // Already Pro — skip forward
    if (isPro) {
      navigate("/choosename", { replace: true });
      return;
    }

    // On web — skip paywall (dev mode)
    if (!isNativePlatform()) {
      navigate("/choosename", { replace: true });
      return;
    }

    showPaywall();
  }, [isPro]);

  async function showPaywall() {
    // Prevent multiple concurrent paywall presentations
    if (presenting.current) return;
    presenting.current = true;
    setError(false);

    try {
      const result = await presentPaywall({ displayCloseButton: false });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        navigate("/choosename", { replace: true });
      } else if (result === PAYWALL_RESULT.CANCELLED) {
        // Cannot skip — re-present
        presenting.current = false;
        showPaywall();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      presenting.current = false;
    }
  }

  if (error) {
    return (
      <OnboardingLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold first-font">
            {t("subscribe.error")}
          </h1>

          <OnboardingButton
            label={t("subscribe.retry")}
            onClick={showPaywall}
          />
        </div>
      </OnboardingLayout>
    );
  }

  return <LoadingScreen />;
}
