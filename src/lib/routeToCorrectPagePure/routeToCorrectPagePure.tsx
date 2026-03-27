import React from "react";
import { Navigate } from "react-router";

export function routeToCorrectPagePure(
  page: React.JSX.Element,
  isLoggedIn: () => boolean,
  hasCompletedSurvey: () => boolean,
  isPro: () => boolean,
  hasHousehold: () => boolean
) {
  if (!isLoggedIn()) {
    return <Navigate to="/" />;
  }
  if (!hasCompletedSurvey()) {
    return <Navigate to="/values/1" />;
  }
  if (!hasHousehold()) {
    return <Navigate to="/createhousehold" />;
  }
  if (!isPro()) {
    return <Navigate to="/howitworks" />;
  }
  return page;
}
