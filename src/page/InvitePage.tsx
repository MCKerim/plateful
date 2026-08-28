import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { House } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
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
        toast.error(t("invitePage.invalidLink"));
        return;
      }

      try {
        const result = await inviteApi.preview(supabase, token);
        if (cancelled) {
          return;
        }

        setPreview(result);

        if (result.status === "unavailable") {
          toast.error(t("invitePage.invalidOrExpiredLink"));
          return;
        }

        if (result.status === "rate_limited") {
          toast.error(
            t("invitePage.rateLimited", {
              count: inviteRetryMinutes(result.retryAfterSeconds),
            })
          );
          return;
        }

        if (
          getInviteJoinRequirement(user?.household_id ?? null, result.householdId) ===
          "must_leave_current_household"
        ) {
          setIsHouseholdWarningOpen(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Error loading invite:", error);
        setPreview({ status: "unavailable" });
        toast.error(t("invitePage.invalidOrExpiredLink"));
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
          toast.error(t("invitePage.invalidOrExpiredLink"));
          break;
      }
    } catch (error) {
      console.error("Error joining household:", error);
      toast.error(t("invitePage.joinError"));
    } finally {
      setIsJoining(false);
    }
  }

  const invitedHouseholdName = preview?.status === "ready" ? preview.householdName : undefined;
  const currentHouseholdName = currentHousehold?.name ?? t("invitePage.currentHouseholdFallback");

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-1 h-full max-w-md mx-auto space-y-6 text-center">
        <div className="mb-16 gap-2">
          <div className="flex items-center justify-center">
            <House className="w-12 h-12" />
          </div>

          <p className="font-medium text-primary">
            {preview === null
              ? t("common.loading")
              : preview.status === "ready"
                ? t("invitePage.invitedTo")
                : preview.status === "rate_limited"
                  ? t("invitePage.rateLimited", {
                      count: inviteRetryMinutes(preview.retryAfterSeconds),
                    })
                  : t("invitePage.invalidOrExpiredLink")}
          </p>

          {invitedHouseholdName && (
            <h1 className="first-font text-4xl mt-12 break-all">{invitedHouseholdName}</h1>
          )}
        </div>

        <div className="flex flex-col w-full gap-3">
          {preview?.status === "ready" && (
            <Button onClick={joinHousehold} disabled={isJoining} className="w-full">
              {isJoining ? t("invitePage.joinLoading") : t("invitePage.joinButton")}
            </Button>
          )}

          <NavLink to="/" className="w-full">
            <Button variant="outline" className="w-full" disabled={isJoining}>
              {t("invitePage.declineButton")}
            </Button>
          </NavLink>
        </div>
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
    </Layout>
  );
}
