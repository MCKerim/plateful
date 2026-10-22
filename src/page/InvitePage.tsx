import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { Clock, Link2Off, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import householdPortrait from "@/assets/household-portrait.webp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getInviteJoinRequirement,
  inviteApi,
  inviteRetryMinutes,
  InvitePreview,
} from "@/api/invite.api";
import type { CurrentAuthUser } from "@/api/user.api";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { reportError } from "@/utils/reportError";

type Props = {
  refreshUser: (authUser: CurrentAuthUser | null, forceBlocking?: boolean) => Promise<boolean>;
};

export default function InvitePage({ refreshUser }: Readonly<Props>) {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const currentHousehold = useAppSelector(selectHousehold);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isHouseholdWarningOpen, setIsHouseholdWarningOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadInvite = async () => {
      if (!token) {
        setPreview({ status: "unavailable" });
        return;
      }

      try {
        const result = await inviteApi.preview(supabase, token);
        if (cancelled) {
          return;
        }

        setPreview(result);

        if (
          result.status === "ready" &&
          getInviteJoinRequirement(user?.household_id ?? null, result.householdId) ===
            "must_leave_current_household"
        ) {
          setIsHouseholdWarningOpen(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        reportError("Error loading invite", error);
        setPreview({ status: "unavailable" });
      }
    };

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [supabase, t, token, user?.household_id]);

  async function joinHousehold() {
    if (!token || preview?.status !== "ready" || !user) {
      toast.error(t("invitePage.invalidOrExpiredLink"));
      return;
    }

    if (
      getInviteJoinRequirement(user.household_id, preview.householdId) ===
      "must_leave_current_household"
    ) {
      setIsHouseholdWarningOpen(true);
      return;
    }

    setIsJoining(true);

    try {
      const result = await inviteApi.accept(supabase, token);

      switch (result.status) {
        case "joined": {
          if (result.householdId !== preview.householdId) {
            throw new Error("The joined household did not match the invite.");
          }
          posthog?.capture(AnalyticsEvent.householdJoined, {
            household_id: result.householdId,
          });
          // Membership changed on the server, so block navigation until the
          // central auth coordinator atomically publishes the new household.
          // Move the URL first so a retry after a transport failure resumes at
          // Home instead of reopening an invite that was already accepted.
          const refreshPromise = refreshUser(user, true);
          navigate("/", { replace: true });
          const didRefresh = await refreshPromise;
          if (!didRefresh) {
            return;
          }
          toast.success(t("invitePage.joinSuccess"));
          break;
        }
        case "already_member":
          if (result.householdId !== preview.householdId) {
            throw new Error("The current household did not match the invite.");
          }
          toast.success(t("invitePage.alreadyMember"));
          navigate("/");
          break;
        case "must_leave_current_household":
          setIsHouseholdWarningOpen(true);
          break;
        case "unavailable":
          setPreview({ status: "unavailable" });
          break;
      }
    } catch (error) {
      reportError("Error joining household", error);
      toast.error(t("invitePage.joinError"));
    } finally {
      setIsJoining(false);
    }
  }

  const invitedHouseholdName = preview?.status === "ready" ? preview.householdName : undefined;
  const currentHouseholdName = currentHousehold?.name ?? t("invitePage.currentHouseholdFallback");

  // Laid out like the iOS invite screen (InviteLandingView), a full screen with
  // a close button instead of the app's header and tab bar.
  return (
    <>
      <div className="relative flex flex-col items-center w-full max-w-lg h-dvh mx-auto px-6 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <Button
          asChild
          variant="outline"
          size="icon"
          className={`absolute right-4 top-4 rounded-full ${isJoining ? "pointer-events-none opacity-50" : ""}`}
        >
          <NavLink to="/" aria-label={t("common.close")}>
            <X />
          </NavLink>
        </Button>

        {preview === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : preview.status === "ready" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
              <img src={householdPortrait} alt="" className="w-[min(173px,45vw)]" />
              <p className="font-semibold text-muted-foreground">{t("invitePage.invitedTo")}</p>
              <h1 className="first-font text-4xl break-words max-w-full">
                {preview.householdName}
              </h1>
            </div>

            <div className="flex flex-col w-full max-w-sm gap-1">
              <Button
                variant="accent"
                className="w-full h-12 rounded-full font-semibold text-base"
                onClick={joinHousehold}
                disabled={isJoining}
              >
                {isJoining ? t("invitePage.joinLoading") : t("invitePage.joinButton")}
              </Button>
              <Button
                asChild
                variant="link"
                className={`text-accent font-semibold hover:no-underline ${isJoining ? "pointer-events-none opacity-50" : ""}`}
              >
                <NavLink to="/">{t("invitePage.declineButton")}</NavLink>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            {preview.status === "rate_limited" ? (
              <>
                <Clock className="size-12 mb-2 text-muted-foreground" />
                <h1 className="text-xl font-semibold">{t("invitePage.rateLimitedTitle")}</h1>
                <p className="max-w-xs text-muted-foreground">
                  {t("invitePage.rateLimited", {
                    count: inviteRetryMinutes(preview.retryAfterSeconds),
                  })}
                </p>
              </>
            ) : (
              <>
                <Link2Off className="size-12 mb-2 text-muted-foreground" />
                <h1 className="text-xl font-semibold">{t("invitePage.unavailableTitle")}</h1>
                <p className="max-w-xs text-muted-foreground">
                  {t("invitePage.unavailableDescription")}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={isHouseholdWarningOpen} onOpenChange={setIsHouseholdWarningOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("invitePage.householdConflictTitle")}</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col gap-4">
            <p>
              {t("invitePage.householdConflictDescription", {
                currentHousehold: currentHouseholdName,
                invitedHousehold: invitedHouseholdName ?? t("invitePage.invitedHouseholdFallback"),
              })}
            </p>

            <Button className="w-full" onClick={() => setIsHouseholdWarningOpen(false)}>
              {t("invitePage.householdConflictButton")}
            </Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
