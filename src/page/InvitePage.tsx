import { useParams, useNavigate, NavLink } from "react-router";
import { useEffect, useState } from "react";
import { useSupabase } from "@/utils/supabase";
import { Household, Invite } from "@/types/exportedDatabaseTypes.types";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { House } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  const { supabase } = useSupabase();
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [invite, setInvite] = useState<Invite | null>();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [household, setHousehold] = useState<Household | null>();
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const handleInvite = async () => {
      if (!token) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: invites, error } = await supabase
        .from("invites")
        .select("*, household(*)")
        .eq("token", token)
        .limit(1);

      if (error || !invites || invites.length === 0) {
        toast.error(t("invitePage.invalidLink"));
        return;
      }

      const invite = invites[0];

      // Check if invite has expired
      if (new Date(invite.expires_at) < new Date()) {
        toast.error(t("invitePage.invalidLink"));
        return;
      }

      setInvite(invite);
      setCurrentUserId(user.id);
      setHousehold(invite.household);
    };

    handleInvite();
  }, [token]);

  async function updateHousehold() {
    if (!invite) {
      return;
    }

    setIsJoining(true);

    try {
      await supabase
        .from("users")
        .update({ household_id: invite.household_id })
        .eq("id", currentUserId);

      // Track invite usage
      await supabase
        .from("invites")
        .update({
          used_by: currentUserId,
          use_count: invite.use_count + 1,
        })
        .eq("id", invite.id);

      navigate("/householdSettings");
    } catch (error) {
      console.error("Error joining household:", error);
      setIsJoining(false);
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-1 h-full max-w-md mx-auto space-y-6 text-center">
        <div className="mb-16 space-y-2">
          <div className="flex items-center justify-center">
            <House className="w-8 h-8" />
          </div>
          <p className="font-medium text-primary">{t("invitePage.invitedTo")}</p>

          <h1 className="text-2xl font-bold text-primary">"{household?.name}"</h1>
        </div>

        <div className="flex flex-col w-full gap-3">
          <Button onClick={updateHousehold} disabled={isJoining} className="w-full">
            {isJoining ? "Joining..." : t("invitePage.joinButton")}
          </Button>

          <NavLink to="/" className="w-full">
            <Button variant="outline" className="w-full" disabled={isJoining}>
              {t("invitePage.declineButton")}
            </Button>
          </NavLink>
        </div>
      </div>
    </Layout>
  );
}
