import SignUp from "@/page/onboarding/signUp/SignUp";
import { Navigate } from "react-router";

export function routeToCorrectPagePure(
  page: JSX.Element,
  isLoggedIn: () => boolean,
  hasSeenValueScreens: () => boolean,
  hasCompletedSurvey: () => boolean,
  hasHousehold: () => boolean
) {
  if (isLoggedIn()) {
    if (hasSeenValueScreens()) {
      if (hasCompletedSurvey()) {
        if (hasHousehold()) {
          return page;
        } else {
          return <Navigate to="/createhousehold" />;
        }
      } else {
        return <Navigate to="/survey" />;
      }
    } else {
      return <Navigate to="/value" />;
    }
  } else {
    return <SignUp />;
  }
}
