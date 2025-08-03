import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { useSupabase } from "@/utils/supabase";

const AppUrlListener: React.FC<any> = () => {
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
        supabase.auth.setSession({ access_token, refresh_token });
      }

      const slug = url.pathname;
      navigate(slug);
    });
  }, [navigate]);

  return null;
};

export default AppUrlListener;
