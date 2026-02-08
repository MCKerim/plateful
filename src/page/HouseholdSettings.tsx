import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { selectHousehold, selectHouseholdMembers } from "@/redux/slices/householdSlice";
import { CircleMinus, Pencil, Trash2, House, UserRoundPlus, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import InviteLink from "@/components/inviteLink/InviteLink";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUpdateHouseholdName } from "@/hooks/household/useUpdateHouseholdName";
import { useRemoveMember } from "@/hooks/household/useRemoveMember";
import { useLeaveHousehold } from "@/hooks/household/useLeaveHousehold";
import { toast } from "sonner";
import DeleteDialog from "@/components/general/DeleteDialog";

export default function HouseholdSettings() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);

  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  const updateHouseholdName = useUpdateHouseholdName();
  const removeMemberMutation = useRemoveMember();
  const leaveHouseholdMutation = useLeaveHousehold();

  function handleRemoveMember(memberId: string) {
    if (!household || !user?.household_id || memberId === user.id) {
      return;
    }

    removeMemberMutation.mutate(
      { memberId },
      {
        onSuccess: () => {
          toast.success(t("householdSettings.success.memberRemoved"));
        },
        onError: (error) => {
          console.error("Error removing member:", error);
          toast.error(t("householdSettings.errors.removeMemberFailed"));
        },
      }
    );
  }

  function handleLeaveHousehold() {
    if (!household || !user?.household_id) {
      return;
    }

    leaveHouseholdMutation.mutate(
      { userId: user.id },
      {
        onError: (error) => {
          console.error("Error leaving household:", error);
          toast.error(t("householdSettings.errors.leaveHouseholdFailed"));
        },
      }
    );
  }

  function handleDeleteHousehold() {
    // TODO: Implement delete household functionality
    // This would typically delete the household and remove all members
  }

  function startEditingName() {
    setEditedName(household?.name || "");
    setIsEditNameDialogOpen(true);
  }

  function saveHouseholdName() {
    if (!household || !editedName.trim()) {
      return;
    }

    updateHouseholdName.mutate(
      { householdId: household.id, name: editedName.trim() },
      {
        onSuccess: () => {
          setIsEditNameDialogOpen(false);
          setEditedName("");
        },
        onError: (error) => {
          console.error("Error updating household name:", error);
          toast.error(t("householdSettings.errors.updateNameFailed"));
        },
      }
    );
  }

  if (!household) {
    return null;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 gap-2">
          <House />

          <h1 className="text-2xl font-bold first-font">{household.name}</h1>
        </div>

        <Button size="sm" variant="ghost" onClick={startEditingName}>
          <Pencil size={16} />
        </Button>
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
        const isCurrentUser = member.id === user?.id;
        return isCurrentUser ? (
          <Button variant="secondary" key={member.id} className="flex items-center justify-between">
            {member.username} - {member.email}
            <span className="text-sm text-muted-foreground">{t("householdSettings.you")}</span>
          </Button>
        ) : (
          <DeleteDialog
            key={member.id}
            onDelete={() => handleRemoveMember(member.id)}
            title={t("householdSettings.confirmations.removeMember.title")}
            description={t("householdSettings.confirmations.removeMember.description")}
            cancelText={t("householdSettings.confirmations.removeMember.cancel")}
            confirmText={t("householdSettings.confirmations.removeMember.confirm")}
            customTrigger={
              <Button variant="secondary" className="flex items-center justify-between w-full">
                {member.username} - {member.email}
                <CircleMinus />
              </Button>
            }
          />
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
            <DialogTitle>{t("householdSettings.scanQrOrShareLink")}</DialogTitle>
          </DialogHeader>

          <DialogDescription>
            <InviteLink />
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Separator className="my-2" />

      <div className="w-full gap-2 flex">
        <DeleteDialog
          onDelete={handleLeaveHousehold}
          title={t("householdSettings.confirmations.leaveHousehold.title")}
          description={t("householdSettings.confirmations.leaveHousehold.description")}
          cancelText={t("householdSettings.confirmations.leaveHousehold.cancel")}
          confirmText={t("householdSettings.confirmations.leaveHousehold.confirm")}
          customTrigger={
            <Button variant="destructive" className="w-full">
              <LogOut size={16} /> {t("householdSettings.leaveHousehold")}
            </Button>
          }
        />

        <DeleteDialog
          onDelete={handleDeleteHousehold}
          title={t("householdSettings.confirmations.deleteHousehold.title")}
          description={t("householdSettings.confirmations.deleteHousehold.description")}
          cancelText={t("householdSettings.confirmations.deleteHousehold.cancel")}
          confirmText={t("householdSettings.confirmations.deleteHousehold.confirm")}
          customTrigger={
            <Button variant="destructive" className="w-full" disabled>
              <Trash2 size={16} /> {t("householdSettings.deleteHousehold")}
            </Button>
          }
        />
      </div>

      <Dialog open={isEditNameDialogOpen} onOpenChange={setIsEditNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("householdSettings.editHouseholdName")}</DialogTitle>
          </DialogHeader>

          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder={t("householdSettings.enterNewHouseholdName")}
          />

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setIsEditNameDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>

              <Button className="w-full" onClick={saveHouseholdName}>
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
