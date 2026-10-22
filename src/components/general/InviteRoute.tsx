import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import MascotBowl from "@/components/general/MascotBowl";
import mascotSalad from "@/assets/mascot-filled-salad.webp";
import SignUp from "@/page/onboarding/signUp/SignUp";
import InvitePage from "@/page/InvitePage";
import type { CurrentAuthUser } from "@/api/user.api";
import { inviteAppLink } from "@/lib/appStores";
import { clearPendingInvite, rememberPendingInvite } from "@/lib/pendingInvite";

type Props = {
  isLoggedIn: boolean;
  refreshUser: (authUser: CurrentAuthUser | null, forceBlocking?: boolean) => Promise<boolean>;
};

/**
 * The `/invite/:token` route.
 *
 * Signed in, it is the invite page. Signed out in a phone browser, it offers
 * the app first: the 2026-10-18 invitee signed up on the web, installed the app
 * afterwards and had to run the onboarding a second time there. Desktop
 * browsers and the Android app go straight to sign-in, in place, so Apple and
 * Google sign-in return to the invite. The token is remembered for the email
 * path, whose magic link lands on `/` (`PostSignInLanding`).
 */
export default function InviteRoute({ isLoggedIn, refreshUser }: Readonly<Props>) {
  const { token } = useParams();
  const [continueInBrowser, setContinueInBrowser] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (isLoggedIn) clearPendingInvite();
    else rememberPendingInvite(token);
  }, [isLoggedIn, token]);

  if (isLoggedIn) return <InvitePage refreshUser={refreshUser} />;

  const appLink = Capacitor.isNativePlatform() || !token ? null : inviteAppLink(token);
  if (!appLink || continueInBrowser) return <SignUp variant="invite" />;

  return (
    <InviteAppHandoff appLink={appLink} onContinueInBrowser={() => setContinueInBrowser(true)} />
  );
}

function InviteAppHandoff({
  appLink,
  onContinueInBrowser,
}: Readonly<{ appLink: string; onContinueInBrowser: () => void }>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center h-dvh px-4 py-10">
      <div className="flex flex-col w-full mb-8 text-center">
        <h1 className="font-bold text-5xl first-font">{t("invitePage.handoffTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("invitePage.handoffSubtitle")}</p>
      </div>

      <div className="flex min-h-0 flex-1 w-full items-end justify-center pb-5">
        <MascotBowl src={mascotSalad} grounded className="w-[min(228px,58vw)] max-h-full" />
      </div>

      <div className="flex flex-col w-full max-w-sm gap-2">
        <Button asChild className="w-full h-12 rounded-full font-semibold text-base">
          <a href={appLink}>
            <Smartphone />
            {t("invitePage.continueInApp")}
          </a>
        </Button>
        <OnboardingButton
          label={t("invitePage.continueInBrowser")}
          variant="secondary"
          onClick={onContinueInBrowser}
        />
      </div>
    </div>
  );
}
