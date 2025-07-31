import { useParams, useNavigate, NavLink } from "react-router";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Household, Invite } from "@/types/exportedDatabaseTypes.types";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [invite, setInvite] = useState<Invite | null>();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [household, setHousehold] = useState<Household | null>();

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
        alert(t("invitePage.invalidLink"));
        return;
      }

      setInvite(invites[0]);
      setCurrentUserId(user.id);
      setHousehold(invites[0].household);
    };

    handleInvite();
  }, [token]);

  async function updateHousehold() {
    if (!invite) {
      return;
    }

    await supabase
      .from("users")
      .update({ household_id: invite.household_id })
      .eq("id", currentUserId);

    // Markiere Invite als genutzt
    await supabase
      .from("invites")
      .update({ used: true, used_by: currentUserId })
      .eq("id", invite.id);

    navigate("/householdSettings");
  }

  return (
    <Layout>
      <p>{t("invitePage.invitedTo")}</p>

      <p className="w-full text-center">
        <strong>"{household?.name}"</strong>
      </p>

      <Button onClick={updateHousehold}>{t("invitePage.joinButton")}</Button>

      <NavLink to="/">
        <Button variant="destructive" className="w-full">
          {t("invitePage.declineButton")}
        </Button>
      </NavLink>
    </Layout>
  );
}
