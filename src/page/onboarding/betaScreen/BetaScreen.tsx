import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";

export default function BetaScreen() {
  return (
    <OnboardingLayout nextButtonLabel="Alles klar!" onNext={() => {}}>
      <h1 className="text-4xl font-bold mb-4 text-center">Beta Version</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        <p className="text-gray-600 text-justify">
          Vielen Dank, dass du die Beta-Version von Plateful ausprobierst!
        </p>

        <p className="text-gray-600 text-justify">
          Wenn du Feedback, Featureideen oder Verbesserungsvorschläge hast,
          zögere nicht, uns zu kontaktieren. Wir sind immer auf der Suche nach
          Möglichkeiten, die App zu verbessern.
        </p>
      </div>
    </OnboardingLayout>
  );
}
