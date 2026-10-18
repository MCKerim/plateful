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
      className={`relative flex flex-col items-center justify-between h-dvh px-4 pt-6 overflow-x-hidden overflow-y-auto ${onNext ? "" : "pb-6"}`}
    >
      {children}

      {onNext && (
        // Sticky: on a short screen the content scrolls under the button instead of pushing it off-screen.
        <div className="sticky bottom-0 w-full max-w-sm pb-6 bg-background">
          <OnboardingButton label={nextButtonLabel ?? t("common.next")} onClick={onNext} />
        </div>
      )}
    </div>
  );
}
