import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { useTranslation } from "react-i18next";

type Props = {
  nextButtonLabel?: string;
  onNext?: () => void;
  /**
   * The content to be displayed within the onboarding layout.
   */
  children?: React.ReactNode;
};

export default function OnboardingLayout({ onNext, children, nextButtonLabel }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <div
      className="relative flex flex-col items-center justify-between h-screen px-4 overflow-hidden"
      style={{
        paddingTop: "calc(1.5rem + var(--safe-area-top, 0px))",
        paddingBottom: "calc(1.5rem + var(--safe-area-bottom, 0px))",
      }}
    >
      {children}

      {onNext && (
        <div className="w-full max-w-sm">
          <OnboardingButton label={nextButtonLabel ?? t("common.next")} onClick={onNext} />
        </div>
      )}
    </div>
  );
}
