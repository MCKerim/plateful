import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../button";
import { Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function InviteLink() {
  const { supabase } = useSupabase();
  const user = useAppSelector(selectUser);
  const { t } = useTranslation();

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
      alert(t("inviteLink.createError") + " " + error.message);
      return;
    }

    setInviteLink(`https://app.plateful.cloud/invite/${token}`);
  }

  async function shareInviteLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("inviteLink.shareTitle"),
          text: t("inviteLink.shareText"),
          url: inviteLink,
        });
      } catch (err) {
        console.error("Fehler beim Teilen:", err);
      }
    } else {
      // Fallback, z.B. Link kopieren
      alert(t("inviteLink.shareNotSupported"));
      await copyInviteLink();
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      alert(t("inviteLink.copySuccess"));
    } catch (err) {
      console.error("Fehler beim Kopieren des Links:", err);
      alert(t("inviteLink.copyError"));
    }
  }

  return inviteLink ? (
    <div className="flex flex-col items-center gap-4 py-4">
      <QRCodeSVG value={inviteLink} size={256} />

      <div className="flex w-full gap-2">
        <Button
          onClick={copyInviteLink}
          className="w-full mt-4"
          variant={"secondary"}
        >
          <Copy size={16} className="mr-2" /> {t("inviteLink.copyButton")}
        </Button>

        <Button onClick={shareInviteLink} className="w-full mt-4">
          <Share2 size={16} className="mr-2" /> {t("inviteLink.shareButton")}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-4 py-4">
      <Skeleton className="h-[256px] w-[256px] rounded-md" />

      <div className="flex w-full gap-2">
        <Skeleton className="w-full h-10 mt-4" />

        <Skeleton className="w-full h-10 mt-4" />
      </div>
    </div>
  );
}
