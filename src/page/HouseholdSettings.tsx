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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InviteLink from "@/components/ui/inviteLink/InviteLink";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function HouseholdSettings() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
    setShowLeaveConfirmation(true);
  }

  function confirmLeaveHousehold() {
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
        setShowLeaveConfirmation(false);
      });
  }

  function deleteHousehold() {
    setShowDeleteConfirmation(true);
  }

  function confirmDeleteHousehold() {
    // TODO: Implement delete household functionality
    // This would typically delete the household and remove all members
    setShowDeleteConfirmation(false);
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

      <Button variant="destructive" onClick={deleteHousehold}>
        <Trash2 size={16} /> {t("householdSettings.deleteHousehold")}
      </Button>

      {/* Leave Household Confirmation Dialog */}
      <AlertDialog
        open={showLeaveConfirmation}
        onOpenChange={setShowLeaveConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("householdSettings.confirmations.leaveHousehold.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("householdSettings.confirmations.leaveHousehold.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("householdSettings.confirmations.leaveHousehold.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveHousehold}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("householdSettings.confirmations.leaveHousehold.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Household Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("householdSettings.confirmations.deleteHousehold.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("householdSettings.confirmations.deleteHousehold.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("householdSettings.confirmations.deleteHousehold.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteHousehold}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("householdSettings.confirmations.deleteHousehold.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
