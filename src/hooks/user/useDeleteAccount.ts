import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { resetSubscription } from "@/redux/slices/subscriptionSlice";
import { useSupabase } from "@/utils/supabase";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import posthog from "posthog-js";
import { logoutUser } from "@/lib/revenuecat";

export function useDeleteAccount() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session");

      const response = await supabase.functions.invoke("delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.error) throw response.error;
    },
    onSuccess: async () => {
      dispatch(setUser(null));
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
      dispatch(resetSubscription());
      queryClient.clear();
      posthog.reset();
      logoutUser().catch((err) => console.error("Failed to logout from RevenueCat:", err));
      await supabase.auth.signOut();
      navigate("/");
    },
    onError: () => {
      toast.error(t("settings.deleteAccountError"));
    },
  });
}
