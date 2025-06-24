import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import {
  selectHousehold,
  selectHouseholdMembers,
  setHousehold,
} from "@/redux/slices/householdSlice";
import {
  CircleMinus,
  Pencil,
  Trash2,
  Link,
  House,
  UserRoundPlus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HouseholdSettings() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

  const [inviteLink, setInviteLink] = useState("");

  async function removeMember(memberId: string) {
    if (!household || !user?.household_id) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ household_id: null })
      .eq("id", memberId);

    if (error) {
      console.error("Fehler beim Entfernen des Mitglieds:", error);
      alert(
        "Fehler beim Entfernen des Mitglieds. Bitte versuche es später erneut."
      );
    } else {
      alert("Mitglied erfolgreich entfernt.");
    }
  }

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

  function leaveHousehold() {
    if (!household || !user?.household_id) {
      return;
    }

    supabase
      .from("users")
      .update({ household_id: null })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) {
          console.error("Fehler beim Verlassen des Haushalts:", error);
          alert(
            "Fehler beim Verlassen des Haushalts. Bitte versuche es später erneut."
          );
        } else {
          dispatch(setHousehold(null));
        }
      });
  }

  if (!household) {
    return null;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <House />

          <h1 className="text-2xl font-bold flex items-center gap-2">
            {household.name}
          </h1>
        </div>

        <Pencil size={16} />
      </div>

      <p>
        <strong>{householdMembers?.length} Mitglieder:</strong>
      </p>

      {householdMembers?.map((member) => {
        return (
          <Button
            variant="secondary"
            key={member.id}
            className="flex items-center justify-between"
            onClick={() => removeMember(member.id)}
          >
            {member.email}

            {member.id === user?.id ? (
              <span className="text-sm text-muted-foreground">Du</span>
            ) : (
              <CircleMinus />
            )}
          </Button>
        );
      })}

      <Dialog>
        <DialogTrigger>
          <Button className="w-full" onClick={createInvite}>
            <UserRoundPlus /> Mitglied einladen
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scanne den QR-Code oder teile den Link</DialogTitle>
          </DialogHeader>

          {inviteLink ? (
            <DialogDescription className="flex flex-col py-4 gap-4 items-center">
              <QRCodeSVG
                value={inviteLink}
                size={256}
              />

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
            </DialogDescription>
          ) : (
            <DialogDescription className="flex flex-col py-4 gap-4 items-center">
              <Skeleton className="h-[256px] w-[256px] rounded-md" />

              <div className="flex gap-2 w-full">
                <Skeleton className="h-10 w-full mt-4" />

                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </DialogDescription>
          )}
        </DialogContent>
      </Dialog>

      <Separator className="my-2" />

      <Button variant="destructive" onClick={leaveHousehold}>
        Leave Household
      </Button>

      <Button variant="destructive" onClick={leaveHousehold}>
        <Trash2 size={16} /> Delete Household
      </Button>
    </Layout>
  );
}
