import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";

type Props = {
  nextButtonLabel?: string;
  onNext: () => void;
  /**
   * The content to be displayed within the onboarding layout.
   */
  children?: React.ReactNode;
}

export default function OnboardingLayout({ onNext, children, nextButtonLabel }: Readonly<Props>) {
  return (
    <div className="relative flex flex-col items-center justify-between h-screen px-4 py-6 overflow-hidden">

      {children}

      <div className="w-full max-w-sm">
        <OnboardingButton label={nextButtonLabel ?? "Weiter"} onClick={onNext} />
      </div>
    </div>
  );
}
