import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";

export default function BetaScreen() {
  return (
    <OnboardingLayout nextButtonLabel="Alles klar!" onNext={() => {}}>
      <h1 className="mb-4 text-4xl font-bold text-center">Beta Version</h1>

      <div className="flex flex-col w-full max-w-sm gap-4 mx-auto">
        <p className="text-justify text-gray-600">
          Vielen Dank, dass du die Beta-Version von Plateful testest!
        </p>

        <p className="text-justify text-gray-600">
          Wenn du Feedback, Featureideen oder Verbesserungsvorschläge hast,
          kontaktiere uns. Wir sind immer auf der Suche nach Möglichkeiten, die
          App zu verbessern.
        </p>
      </div>
    </OnboardingLayout>
  );
}
