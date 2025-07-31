import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
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
import InviteLink from "@/components/ui/inviteLink/InviteLink";
import { useTranslation } from "react-i18next";

export default function HouseholdSettings() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
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
      alert(t("householdSettings.errors.removeMemberFailed"));
    } else {
      alert(t("householdSettings.success.memberRemoved"));
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
          alert(t("householdSettings.errors.leaveHouseholdFailed"));
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

          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {household.name}
          </h1>
        </div>

        <Pencil size={16} />
      </div>

      <p>
        <strong>
          {householdMembers?.length}{" "}
          {(householdMembers?.length || 0) > 1
            ? t("householdSettings.members")
            : t("householdSettings.member")}
          :
        </strong>
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
              <span className="text-sm text-muted-foreground">
                {t("householdSettings.you")}
              </span>
            ) : (
              <CircleMinus />
            )}
          </Button>
        );
      })}

      <Dialog>
        <DialogTrigger>
          <Button className="w-full">
            <UserRoundPlus /> {t("householdSettings.inviteMember")}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t("householdSettings.scanQrOrShareLink")}
            </DialogTitle>
          </DialogHeader>

          <DialogDescription>
            <InviteLink />
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Separator className="my-2" />

      <Button variant="destructive" onClick={leaveHousehold}>
        {t("householdSettings.leaveHousehold")}
      </Button>

      <Button variant="destructive" onClick={leaveHousehold}>
        <Trash2 size={16} /> {t("householdSettings.deleteHousehold")}
      </Button>
    </Layout>
  );
}
