import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/utils/supabase";
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
  LogOut,
  Check,
  X,
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
import { useState } from "react";

export default function HouseholdSettings() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

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

  function startEditingName() {
    setEditedName(household?.name || "");
    setIsEditingName(true);
  }

  function cancelEditingName() {
    setIsEditingName(false);
    setEditedName("");
  }

  async function saveHouseholdName() {
    if (!household || !editedName.trim()) {
      return;
    }

    const { error } = await supabase
      .from("household")
      .update({ name: editedName.trim() })
      .eq("id", household.id);

    if (error) {
      console.error("Error updating household name:", error);
      alert(t("householdSettings.errors.updateNameFailed"));
    } else {
      // Update the household in Redux store
      dispatch(setHousehold({ ...household, name: editedName.trim() }));
      setIsEditingName(false);
      setEditedName("");
    }
  }

  if (!household) {
    return null;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 gap-2">
          <House />

          {isEditingName ? (
            <div className="flex items-center flex-1 gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-2 py-1 text-2xl font-bold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveHouseholdName();
                  } else if (e.key === "Escape") {
                    cancelEditingName();
                  }
                }}
                autoFocus
              />

              <Button
                size="sm"
                onClick={saveHouseholdName}
                disabled={!editedName.trim()}
              >
                <Check size={16} />
              </Button>

              <Button size="sm" variant="outline" onClick={cancelEditingName}>
                <X size={16} />
              </Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{household.name}</h1>
          )}
        </div>

        {!isEditingName && (
          <Button size="sm" variant="ghost" onClick={startEditingName}>
            <Pencil size={16} />
          </Button>
        )}
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
        <LogOut size={16} /> {t("householdSettings.leaveHousehold")}
      </Button>

      <Button variant="destructive" onClick={deleteHousehold}>
        <Trash2 size={16} /> {t("householdSettings.deleteHousehold")}
      </Button>

      {/* Leave Household Confirmation Dialog */}
      <Dialog
        open={showLeaveConfirmation}
        onOpenChange={setShowLeaveConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t("householdSettings.confirmations.leaveHousehold.title")}
            </DialogTitle>

            <DialogDescription>
              {t("householdSettings.confirmations.leaveHousehold.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowLeaveConfirmation(false)}
              className="w-full"
            >
              {t("householdSettings.confirmations.leaveHousehold.cancel")}
            </Button>

            <Button
              variant="destructive"
              onClick={confirmLeaveHousehold}
              className="w-full"
            >
              {t("householdSettings.confirmations.leaveHousehold.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Household Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t("householdSettings.confirmations.deleteHousehold.title")}
            </DialogTitle>

            <DialogDescription>
              {t("householdSettings.confirmations.deleteHousehold.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              {t("householdSettings.confirmations.deleteHousehold.cancel")}
            </Button>

            <Button
              variant="destructive"
              onClick={confirmDeleteHousehold}
              className="w-full"
            >
              {t("householdSettings.confirmations.deleteHousehold.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
