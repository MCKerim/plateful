import Layout from "@/components/layout/Layout";
import { ModeToggle } from "@/components/general/mode-toggle";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { Bell, CreditCard, Donut, House, LogOut, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useSubscription } from "@/hooks/subscription/useSubscription";
import { useCustomerCenter } from "@/hooks/subscription/useCustomerCenter";
import { useHouseholdSubscription } from "@/hooks/subscription/useHouseholdSubscription";
import { isNativePlatform } from "@/lib/revenuecat";
import DeleteDialog from "@/components/general/DeleteDialog";
import { FaInstagram, FaThreads, FaTiktok, FaXTwitter } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateUsername } from "@/hooks/user/useUpdateUsername";
import { useUpdateLanguage } from "@/hooks/user/useUpdateLanguage";
import { useDeleteAccount } from "@/hooks/user/useDeleteAccount";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { supabase } = useSupabase();
  const { t, i18n } = useTranslation();
  const user = useAppSelector(selectUser);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const updateUsernameMutation = useUpdateUsername();
  const updateLanguageMutation = useUpdateLanguage();
  const deleteAccountMutation = useDeleteAccount();
  const { restorePurchases } = useSubscription();
  const { presentCustomerCenter } = useCustomerCenter();
  const { isActive: isActiveSub, data: householdSub } = useHouseholdSubscription();

  const isCurrentUserPayer = householdSub?.payer_user_id === user?.id;
  const payerName = householdSub?.payer?.username;

  useEffect(() => {
    let isMounted = true;

    // User identification with Canny
    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return;

      if (error || !data) {
        console.error("Error fetching user: ", error);
        return;
      }

      if (window.Canny) {
        window.Canny("identify", {
          appID: "6811199a61c6b4f3d0e8cd93",
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata.full_name ?? "Anonymous",
            avatarURL: data.user.user_metadata.avatar_url ?? "",
            created: new Date(data.user.created_at).toISOString(),
          },
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error while sign out: ", error);
    }
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteAccountDialogOpen(false);
        setDeleteConfirmationText("");
      },
    });
  };

  const getDeleteConfirmationWord = () => {
    return i18n.language === "de" ? "löschen" : "delete";
  };

  const isDeleteConfirmationValid = () => {
    return deleteConfirmationText.toLowerCase() === getDeleteConfirmationWord();
  };

  function handleUpdateUsername() {
    if (newUsername.trim() === "" || !user) {
      toast.error(t("settings.usernameCannotBeEmpty"));
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      toast.error(t("settings.usernameLengthInvalid"));
      return;
    }

    updateUsernameMutation.mutate(
      { userId: user.id, username: newUsername },
      {
        onSuccess: () => {
          setIsUsernameDialogOpen(false);
        },
        onError: (error) => {
          console.error("Error updating username:", error);
        },
      }
    );
  }

  function handleUpdateLanguage(language: string) {
    if (!user) return;
    updateLanguageMutation.mutate({ userId: user.id, language });
  }

  return (
    <Layout>
      <h1 className="second-font text-2xl">{t("settings.title")}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.language")}</h2>

          <div className="flex w-full gap-2">
            <Button
              className="w-full"
              variant={i18n.language === "en" ? "default" : "secondary"}
              onClick={() => handleUpdateLanguage("en")}
            >
              English
            </Button>

            <Button
              className="w-full"
              variant={i18n.language === "de" ? "default" : "secondary"}
              onClick={() => handleUpdateLanguage("de")}
            >
              Deutsch
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.appearance")}</h2>

          <ModeToggle />
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.notifications")}</h2>

          <NavLink to="/notificationSettings">
            <Button variant="secondary" className="w-full">
              <Bell />

              {t("settings.manageNotifications")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.subscription.title")}</h2>

          {isActiveSub && isCurrentUserPayer && isNativePlatform() && (
            <>
              <p className="text-sm">{t("settings.subscription.proDescription")}</p>

              <Button variant="secondary" className="w-full" onClick={presentCustomerCenter}>
                <CreditCard />
                {t("settings.subscription.manageSubscription")}
              </Button>

              <Button variant="ghost" className="w-full" onClick={restorePurchases}>
                <RotateCcw />
                {t("settings.subscription.restorePurchases")}
              </Button>
            </>
          )}

          {isActiveSub && !isCurrentUserPayer && (
            <p className="text-sm">{t("settings.subscription.managedBy", { name: payerName })}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.household")}</h2>

          <p className="text-sm">{t("settings.householdDescription")}</p>

          <NavLink to="/householdSettings">
            <Button variant="secondary" className="w-full">
              <House />

              {t("settings.manageYourHousehold")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.supportFeedback")}</h2>

          <p className="text-sm">{t("settings.supportFeedbackDescription")}</p>

          <NavLink data-canny-link to="https://plateful.canny.io/support" target="blank">
            <Button variant="secondary" className="w-full">
              <Donut />

              {t("settings.suggestFeatureOrReportBug")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">About</h2>

          <div className="flex items-center gap-2">
            <img
              src="/PB.jpg"
              alt="Plateful Logo"
              className="w-20 h-20 mb-2 border-2 border-dashed rounded-full border-accent"
            />

            <p className="text-sm whitespace-pre-line">{t("settings.aboutDescription")}</p>
          </div>

          <div className="flex py-2 justify-evenly">
            <NavLink to="https://x.com/MCKerim5" target="_blank">
              <FaXTwitter size={24} />
            </NavLink>

            <NavLink to="https://www.threads.com/@kblanks_com" target="_blank">
              <FaThreads size={24} />
            </NavLink>

            <NavLink to="https://www.instagram.com/KBlanks_com" target="_blank">
              <FaInstagram size={24} />
            </NavLink>

            <NavLink to="https://www.tiktok.com/@KBlanks.com" target="_blank">
              <FaTiktok size={24} />
            </NavLink>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">Info</h2>

          <p className="text-sm">v0.0.23 - Beta</p>

          <div className="flex gap-2">
            <NavLink to="/privacy" className="w-full">
              <Button variant="secondary" className="w-full">
                {t("settings.privacyPolicy")}
              </Button>
            </NavLink>

            <NavLink to="/terms" className="w-full">
              <Button variant="secondary" className="w-full">
                {t("settings.termsOfService")}
              </Button>
            </NavLink>

            <NavLink to="/imprint" className="w-full">
              <Button variant="secondary" className="w-full">
                {t("settings.impressum")}
              </Button>
            </NavLink>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <div className="flex justify-between items-center border-b">
            <h2 className="font-medium">{t("settings.account")}</h2>

            <Button variant="ghost" size="iconSm" onClick={() => setIsUsernameDialogOpen(true)}>
              <Pencil />
            </Button>
          </div>

          <p>
            {user?.username} - {user?.email}
          </p>

          <div className="flex gap-2">
            <DeleteDialog
              onDelete={signOut}
              title={t("settings.confirmations.signOut.title")}
              description={t("settings.confirmations.signOut.description")}
              cancelText={t("settings.confirmations.signOut.cancel")}
              confirmText={t("settings.confirmations.signOut.confirm")}
              customTrigger={
                <Button variant="destructive" className="w-full">
                  <LogOut size={16} /> {t("settings.signOut")}
                </Button>
              }
            />

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsDeleteAccountDialogOpen(true)}
            >
              <Trash2 size={16} /> {t("settings.deleteAccount")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.editUsername")}</DialogTitle>
          </DialogHeader>

          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={t("settings.enterNewUsername")}
          />

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setIsUsernameDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>

              <Button className="w-full" onClick={handleUpdateUsername}>
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteAccountDialogOpen(open);
          if (!open) setDeleteConfirmationText("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.confirmations.deleteAccount.title")}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.confirmations.deleteAccount.description")}
            </p>

            <p className="text-sm text-muted-foreground">
              {t("settings.confirmations.deleteAccount.subscriptionWarning")}
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                {t("settings.confirmations.deleteAccount.confirmationText")}
              </label>
              <Input
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={t("settings.confirmations.deleteAccount.confirmationPlaceholder")}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="w-full"
                variant="secondary"
                disabled={deleteAccountMutation.isPending}
                onClick={() => {
                  setIsDeleteAccountDialogOpen(false);
                  setDeleteConfirmationText("");
                }}
              >
                {t("settings.confirmations.deleteAccount.cancel")}
              </Button>

              <Button
                className="w-full"
                variant="destructive"
                disabled={!isDeleteConfirmationValid() || deleteAccountMutation.isPending}
                onClick={handleDeleteAccount}
              >
                {deleteAccountMutation.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  t("settings.confirmations.deleteAccount.confirm")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
