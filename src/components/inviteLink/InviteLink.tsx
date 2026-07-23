import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";
import { Copy, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Share } from "@capacitor/share";
import { writeClipboardText } from "@/utils/nativeClipboard";
import { toast } from "sonner";
import { inviteApi } from "@/api/invite.api";

export default function InviteLink() {
  const { supabase } = useSupabase();
  const user = useAppSelector(selectUser);
  const { t } = useTranslation();

  const [inviteLink, setInviteLink] = useState("");
  const inviteRequest = useRef<{
    householdId: string;
    promise: Promise<string>;
  } | null>(null);

  useEffect(() => {
    const householdId = user?.household_id;
    if (!householdId) {
      return;
    }

    if (inviteRequest.current?.householdId !== householdId) {
      inviteRequest.current = {
        householdId,
        promise: inviteApi.create(supabase),
      };
    }

    const request = inviteRequest.current;
    let cancelled = false;

    request.promise
      .then((token) => {
        if (!cancelled) {
          setInviteLink(`https://app.plateful.cloud/invite/${token}`);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Error creating invite:", error);
          toast.error(t("inviteLink.createError"));
        }
        if (inviteRequest.current === request) {
          inviteRequest.current = null;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, t, user?.household_id]);

  async function shareInviteLink() {
    try {
      await Share.share({
        title: t("inviteLink.shareTitle"),
        text: t("inviteLink.shareText"),
        url: inviteLink,
        dialogTitle: t("inviteLink.shareDialogTitle"),
      });
    } catch (err) {
      console.error("Error sharing link:", err);
      await copyInviteLink();
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await writeClipboardText(inviteLink);
      toast.success(t("inviteLink.copySuccess"));
    } catch (err) {
      console.error("Error copying link:", err);
      toast.error(t("inviteLink.copyError"));
    }
  }

  return inviteLink ? (
    <div className="flex flex-col items-center gap-4 py-4">
      <QRCodeSVG value={inviteLink} size={256} />

      <div className="flex w-full gap-2">
        <Button onClick={copyInviteLink} className="w-full mt-4" variant={"secondary"}>
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
