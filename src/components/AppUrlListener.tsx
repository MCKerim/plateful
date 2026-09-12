import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { useSupabase } from "@/utils/supabase";
import { clearPendingSignIn, isMagicLinkLanding, markPendingSignIn } from "@/lib/pendingSignIn";
import { reportError } from "@/utils/reportError";

const AppUrlListener: React.FC = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  useEffect(() => {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      const params: Record<string, string> | undefined = url.hash
        ?.substring(1)
        ?.split("&")
        ?.reduce((acc: Record<string, string>, s) => {
          acc[s.split("=")[0]] = s.split("=")[1];
          return acc;
        }, {});

      const access_token = params?.["access_token"] ?? "";
      const refresh_token = params?.["refresh_token"] ?? "";

      // Only sign in if we got an accessToken with this request
      if (access_token) {
        // An email link opened as an App Link completes the sign-in here, not
        // through the browser's URL landing — so the owed `signed_in` is marked
        // here (spent after identify, see pendingSignIn.ts).
        const isEmailLink = isMagicLinkLanding(event.url);
        if (isEmailLink) markPendingSignIn("magic_link");
        void supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) return;
          if (isEmailLink) clearPendingSignIn();
          reportError("Failed to sign in from the app link", error);
        });
      }

      const slug = url.pathname;
      navigate(slug);
    });
  }, [navigate, supabase]);

  return null;
};

export default AppUrlListener;
