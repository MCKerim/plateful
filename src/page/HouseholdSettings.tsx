import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import {
  selectHousehold,
  selectHouseholdMembers,
  selectIsCurrentUserOwner,
} from "@/redux/slices/householdSlice";
import { Pencil, Trash2, House, UserRoundPlus, LogOut, Shield, CircleMinus } from "lucide-react";
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
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import InviteLink from "@/components/inviteLink/InviteLink";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUpdateHouseholdName } from "@/hooks/household/useUpdateHouseholdName";
import { useRemoveMember } from "@/hooks/household/useRemoveMember";
import { useLeaveHousehold } from "@/hooks/household/useLeaveHousehold";
import { useTransferOwnership } from "@/hooks/household/useTransferOwnership";
import { useDeleteHousehold } from "@/hooks/household/useDeleteHousehold";
import { toast } from "sonner";
import DeleteDialog from "@/components/general/DeleteDialog";
import { HouseholdMember } from "@/api/user.api";

export default function HouseholdSettings() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);
  const householdMembers = useAppSelector(selectHouseholdMembers);
  const isOwner = useAppSelector(selectIsCurrentUserOwner);

  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null);

  const updateHouseholdName = useUpdateHouseholdName();
  const removeMemberMutation = useRemoveMember();
  const leaveHouseholdMutation = useLeaveHousehold();
  const transferOwnershipMutation = useTransferOwnership();
  const deleteHouseholdMutation = useDeleteHousehold();

  function handleRemoveMember(memberId: string) {
    if (!household || !user?.household_id || memberId === user.id) {
      return;
    }

    removeMemberMutation.mutate(
      { memberId },
      {
        onSuccess: () => {
          setSelectedMember(null);
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
    if (!household) {
      return;
    }

    deleteHouseholdMutation.mutate(
      { householdId: household.id },
      {
        onSuccess: () => {
          toast.success(t("householdSettings.success.householdDeleted"));
        },
        onError: (error) => {
          console.error("Error deleting household:", error);
          toast.error(t("householdSettings.errors.deleteHouseholdFailed"));
        },
      }
    );
  }

  function handleTransferOwnership(memberId: string) {
    if (!household) {
      return;
    }

    transferOwnershipMutation.mutate(
      { householdId: household.id, newOwnerId: memberId },
      {
        onSuccess: () => {
          setSelectedMember(null);
          toast.success(t("householdSettings.success.ownershipTransferred"));
        },
        onError: (error) => {
          console.error("Error transferring ownership:", error);
          toast.error(t("householdSettings.errors.transferOwnershipFailed"));
        },
      }
    );
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

  function getLeaveConfirmationKey() {
    if (!isOwner) return "leaveHousehold";
    const otherMembers = householdMembers?.filter((m) => m.id !== user?.id) ?? [];
    return otherMembers.length > 0 ? "leaveAsOwner" : "leaveAsLastMember";
  }

  if (!household) {
    return null;
  }

  const isMemberOwner = (memberId: string) => household.owner_id === memberId;
  const leaveKey = getLeaveConfirmationKey();

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
        const memberIsOwner = isMemberOwner(member.id);

        return (
          <Button
            key={member.id}
            variant="secondary"
            className="flex items-center justify-between w-full"
            onClick={() => !isCurrentUser && setSelectedMember(member)}
          >
            <span>
              {member.username} - {member.email}
            </span>
            <span className="flex items-center gap-1.5">
              {memberIsOwner && (
                <span className="text-xs font-medium text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
                  {t("householdSettings.owner")}
                </span>
              )}
              {isCurrentUser && (
                <span className="text-sm text-muted-foreground">
                  {t("householdSettings.you")}
                </span>
              )}
            </span>
          </Button>
        );
      })}

      {/* Member Drawer */}
      <Drawer
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedMember?.username}</DrawerTitle>
            <DrawerDescription>{selectedMember?.email}</DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="gap-3 mb-4">
            {selectedMember && isOwner && (
              <>
                <DeleteDialog
                  onDelete={() => handleTransferOwnership(selectedMember.id)}
                  title={t("householdSettings.confirmations.makeOwner.title")}
                  description={t("householdSettings.confirmations.makeOwner.description")}
                  cancelText={t("householdSettings.confirmations.makeOwner.cancel")}
                  confirmText={t("householdSettings.confirmations.makeOwner.confirm")}
                  customTrigger={
                    <Button variant="secondary" className="w-full">
                      <Shield size={16} /> {t("householdSettings.makeOwner")}
                    </Button>
                  }
                />

                <DeleteDialog
                  onDelete={() => handleRemoveMember(selectedMember.id)}
                  title={t("householdSettings.confirmations.removeMember.title")}
                  description={t("householdSettings.confirmations.removeMember.description")}
                  cancelText={t("householdSettings.confirmations.removeMember.cancel")}
                  confirmText={t("householdSettings.confirmations.removeMember.confirm")}
                  customTrigger={
                    <Button variant="destructive" className="w-full">
                      <CircleMinus size={16} /> {t("householdSettings.removeMember")}
                    </Button>
                  }
                />
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
          title={t(`householdSettings.confirmations.${leaveKey}.title`)}
          description={t(`householdSettings.confirmations.${leaveKey}.description`)}
          cancelText={t(`householdSettings.confirmations.${leaveKey}.cancel`)}
          confirmText={t(`householdSettings.confirmations.${leaveKey}.confirm`)}
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
            <Button variant="destructive" className="w-full" disabled={!isOwner}>
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
