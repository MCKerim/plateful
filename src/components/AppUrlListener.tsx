import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";

const AppUrlListener: React.FC<any> = () => {
  const navigate = useNavigate();

  useEffect(() => {
    App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      // Example url: https://beerswift.app/tabs/tab2
      // slug = /tabs/tab2
      const slug = event.url.split(".app").pop();
      if (slug) {
        navigate(slug);
      }
      // If no match, do nothing - let regular routing
      // logic take over
    });
  }, [navigate]);

  return null;
};

export default AppUrlListener;
