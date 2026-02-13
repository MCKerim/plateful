import SignUp from "@/page/onboarding/signUp/SignUp";
import { Navigate } from "react-router";

export function routeToCorrectPagePure(
  page: JSX.Element,
  isLoggedIn: () => boolean,
  hasCompletedSurvey: () => boolean,
  hasHousehold: () => boolean
) {
  if (isLoggedIn()) {
    if (hasCompletedSurvey()) {
      if (hasHousehold()) {
        return page;
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
