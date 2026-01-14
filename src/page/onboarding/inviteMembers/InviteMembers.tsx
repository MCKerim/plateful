import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import InviteLink from "@/components/atoms/inviteLink/InviteLink";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function InviteMembers() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function completeScreen() {
    navigate("/");
  }

  return (
    <OnboardingLayout
      nextButtonLabel={t("inviteMembers.nextButton")}
      onNext={completeScreen}
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t("inviteMembers.title")}</h1>
      </div>

      <div>
        <p className="max-w-sm mb-12 font-medium text-center text-primary">
          {t("inviteMembers.description")}
          <br />
          {t("inviteMembers.description2")}
        </p>

        <InviteLink />
      </div>
    </OnboardingLayout>
  );
}
