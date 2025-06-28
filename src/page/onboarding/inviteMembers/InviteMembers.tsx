import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import InviteLink from "@/components/ui/inviteLink/InviteLink";
import { useNavigate } from "react-router";

export default function InviteMembers() {
  const navigate = useNavigate();

  async function completeScreen() {
    navigate("/");
  }

  return (
    <OnboardingLayout nextButtonLabel="Fertig!" onNext={completeScreen}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Füge Mitglieder hinzu</h1>

        <p className="text-gray-600 max-w-sm mt-2">
          Lade Freunde oder Familie in dein Haushalt ein. Scanne dazu den
          QR-Code oder teile den Link.
        </p>
      </div>

      <InviteLink />
    </OnboardingLayout>
  );
}
