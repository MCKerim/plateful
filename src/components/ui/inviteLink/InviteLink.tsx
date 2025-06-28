import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../button";
import { Link } from "lucide-react";

export default function InviteLink() {
  const user = useAppSelector(selectUser);

  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (user?.household_id) {
      createInvite();
    }
  }, [user?.household_id]);

  async function createInvite() {
    const token = uuidv4();

    if (!user?.household_id) {
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

    if (error) {
      alert(
        "Fehler beim Erstellen des Einladungslinks. Bitte versuche es später erneut. " +
          error.message
      );
      return;
    }

    setInviteLink(`${window.location.origin}/invite/${token}`);
  }

  async function shareInviteLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Haushaltseinladung 🏡",
          text: "Hey, tritt meinem Haushalt bei!",
          url: inviteLink,
        });
      } catch (err) {
        console.error("Fehler beim Teilen:", err);
      }
    } else {
      // Fallback, z.B. Link kopieren
      alert(
        "Teilen ist in diesem Browser nicht unterstützt. Der Link wurde in die Zwischenablage kopiert."
      );
      await copyInviteLink();
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Einladungslink wurde in die Zwischenablage kopiert!");
    } catch (err) {
      console.error("Fehler beim Kopieren des Links:", err);
      alert("Fehler beim Kopieren des Links. Bitte versuche es später erneut.");
    }
  }

  return inviteLink ? (
    <div className="flex flex-col py-4 gap-4 items-center">
      <QRCodeSVG value={inviteLink} size={256} />

      <div className="flex gap-2 w-full">
        <Button
          onClick={copyInviteLink}
          className="w-full mt-4"
          variant={"secondary"}
        >
          <Link size={16} /> Link kopieren
        </Button>

        <Button onClick={shareInviteLink} className="w-full mt-4">
          <Link size={16} /> Link teilen
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col py-4 gap-4 items-center">
      <Skeleton className="h-[256px] w-[256px] rounded-md" />

      <div className="flex gap-2 w-full">
        <Skeleton className="h-10 w-full mt-4" />

        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  );
}
