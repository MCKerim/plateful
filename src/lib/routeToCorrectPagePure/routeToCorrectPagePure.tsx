import React from "react";
import SignUp from "@/page/onboarding/signUp/SignUp";
import { Navigate } from "react-router";

export function routeToCorrectPagePure(
  page: React.JSX.Element,
  isLoggedIn: () => boolean,
  hasCompletedSurvey: () => boolean,
  isPro: () => boolean,
  hasHousehold: () => boolean
) {
  if (isLoggedIn()) {
    if (hasCompletedSurvey()) {
      if (hasHousehold()) {
        if (isPro()) {
          return page;
        } else {
          return <Navigate to="/subscribe" />;
        }
      } else {
        return <Navigate to="/createhousehold" />;
      }
    } else {
      return <Navigate to="/values/1" />;
    }
  } else {
    return <SignUp />;
  }
}
