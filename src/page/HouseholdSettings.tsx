import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import {
  selectHousehold,
  selectHouseholdMembers,
} from "@/redux/slices/householdSlice";
import {
  CircleMinus,
  Pencil,
  Trash2,
  Link,
  Plus,
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

export default function HouseholdSettings() {
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

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

    if (error) throw error;

    const inviteLink = `${window.location.origin}/invite/${token}`;
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
      await navigator.clipboard.writeText(inviteLink);
      alert("Link wurde kopiert!");
    }
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
          <Button className="w-full">
            <UserRoundPlus /> Mitglied einladen
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scanne den QR-Code oder teile den Link</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col py-4 gap-4 items-center">
            <QRCodeSVG
              value="https://reactjs.org/"
              size={256}
              imageSettings={{
                src: "/logo.png",
                height: 64,
                width: 64,
                excavate: true,
              }}
            />

            <Button onClick={createInvite} className="w-full mt-4">
              <Link size={16} /> Link teilen
            </Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Separator className="my-2" />

      <Button variant="secondary" onClick={createInvite}>
        Join other
      </Button>

      <Button variant="destructive" onClick={createInvite}>
        Leave Household
      </Button>

      <Button variant="destructive" onClick={createInvite}>
        <Trash2 size={16} /> Delete Household
      </Button>
    </Layout>
  );
}
