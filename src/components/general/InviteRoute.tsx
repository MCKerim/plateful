import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import householdPortrait from "@/assets/household-portrait.webp";
import SignUp from "@/page/onboarding/signUp/SignUp";
import InvitePage from "@/page/InvitePage";
import type { CurrentAuthUser } from "@/api/user.api";
import { openInAppLink } from "@/lib/appStores";
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
  const appLink = Capacitor.isNativePlatform() || !token ? null : openInAppLink("invite", token);
  const showsSignIn = !appLink || continueInBrowser;

  useEffect(() => {
    if (!token) return;
    if (isLoggedIn) clearPendingInvite();
    // Not while only the app is offered: someone who joins there would be sent
    // back to the invite by their next web sign-in in this browser.
    else if (showsSignIn) rememberPendingInvite(token);
  }, [isLoggedIn, token, showsSignIn]);

  if (isLoggedIn) return <InvitePage refreshUser={refreshUser} />;
  if (showsSignIn) return <SignUp variant="invite" />;

  return (
    <InviteAppHandoff appLink={appLink} onContinueInBrowser={() => setContinueInBrowser(true)} />
  );
}

function InviteAppHandoff({
  appLink,
  onContinueInBrowser,
}: Readonly<{ appLink: string; onContinueInBrowser: () => void }>) {
  const { t } = useTranslation();

  // Laid out like the iOS invite screen (InviteLandingView): the household
  // artwork and the invitation centred, the app as the one primary action and
  // the browser as a quiet text button beneath it.
  return (
    <div className="flex flex-col items-center h-dvh px-6 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
        <img src={householdPortrait} alt="" className="w-[min(173px,45vw)]" />
        <h1 className="first-font text-4xl">{t("invitePage.handoffTitle")}</h1>
        <p className="max-w-xs font-semibold text-muted-foreground">
          {t("invitePage.handoffSubtitle")}
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-1">
        <Button
          asChild
          variant="accent"
          className="w-full h-12 rounded-full font-semibold text-base"
        >
          <a href={appLink}>{t("invitePage.continueInApp")}</a>
        </Button>
        <Button
          variant="link"
          className="text-accent font-semibold hover:no-underline"
          onClick={onContinueInBrowser}
        >
          {t("invitePage.continueInBrowser")}
        </Button>
      </div>
    </div>
  );
}
