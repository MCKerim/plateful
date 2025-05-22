import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { selectHousehold, selectHouseholdMembers } from "@/redux/slices/householdSlice";

export default function HouseholdSettings() {
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

  async function createInvite() {
    const token = uuidv4();

    if (!user || !user.household_id) {
      return;
    }

    const { error } = await supabase.from("invites").insert([
      {
        token: token,
        household_id: user.household_id,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h gültig
        used: false,
      },
    ]);

    if (error) throw error;

    const inviteLink = `${window.location.origin}/invite/${token}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Haushaltseinladung 🏡",
          text: "Hey, tritt meinem Haushalt bei!",
          url: inviteLink,
        });
        console.log("Invite erfolgreich geteilt!");
      } catch (err) {
        console.error("Fehler beim Teilen:", err);
      }
    } else {
      // Fallback, z.B. Link kopieren
      await navigator.clipboard.writeText(inviteLink);
      alert("Link wurde kopiert!");
    }
  }

  return (
    <Layout>
      <h1 className="text-lg">Verwalte dein Haushalt</h1>

      <p>
        <strong>Name:</strong> {household ? household.name : ""}
      </p>

      <p>
        <strong>Mitglieder:</strong>
      </p>

      {householdMembers?.map((member) => {
        return (
          <Button variant="secondary" key={member.id}>
            {member.email}
          </Button>
        );
      })}

      <Button onClick={createInvite}>Einladen</Button>
    </Layout>
  );
}
