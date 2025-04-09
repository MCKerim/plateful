import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { Household, User } from "@/types/exportedDatabaseTypes.types";
import { v4 as uuidv4 } from "uuid";

export default function Hosehold() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [mitglieder, setMitglieder] = useState<User[] | null>(null);

  const fetchHousehold = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data: users } = await supabase
      .from("users")
      .select(
        `
        *,
      household (
        *
      )
    `
      )
      .eq("id", user.id);

    if (!users) {
      return;
    }

    const currentUser = users[0];
    setCurrentUser(currentUser);

    setHousehold(currentUser.household);

    if (!currentUser.household_id) {
      return;
    }

    const { data: mitglieder } = await supabase
      .from("users")
      .select("*")
      .eq("household_id", currentUser.household_id);

    if (!mitglieder) {
      return;
    }

    setMitglieder(mitglieder);
  };

  useEffect(() => {
    fetchHousehold();
  }, []);

  async function createInvite() {
    const token = uuidv4();

    if (!currentUser || !currentUser.household_id || !currentUser.id) {
      return;
    }

    const { error } = await supabase.from("invites").insert([
      {
        token: token,
        household_id: currentUser.household_id,
        invited_by: currentUser.id,
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
      {mitglieder?.map((mitglied) => {
        return (
          <Button variant="secondary" key={mitglied.email}>
            {mitglied.email}
          </Button>
        );
      })}

      <Button onClick={createInvite}>Einladen</Button>
    </Layout>
  );
}
