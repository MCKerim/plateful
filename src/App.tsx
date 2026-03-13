import { Route, Routes, Navigate, useNavigate } from "react-router";
import MealPlanner from "./page/MealPlanner";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/onboarding/signUp/SignUp";
import EmailSignUp from "./page/onboarding/emailSignUp/EmailSignUp";
import EmailVerification from "./page/onboarding/emailVerification/EmailVerification";
import Login from "./page/onboarding/login/Login";
import React, { useEffect, useState } from "react";
import Settings from "./page/Settings";
import HouseholdSettings from "./page/HouseholdSettings";
import InvitePage from "./page/InvitePage";
import { useAppSelector } from "./redux/hooks";
import { selectUser } from "./redux/slices/userSlice";
import { selectHouseholdId } from "./redux/slices/householdSlice";
import Subscribe from "./page/onboarding/subscribe/Subscribe";
import SubscribeWeb from "./page/onboarding/subscribe/SubscribeWeb";
import { useHouseholdSubscription } from "./hooks/subscription/useHouseholdSubscription";
import Welcome from "./page/onboarding/welcome/Welcome";
import Survey from "./page/onboarding/survey/Survey";
import CreateHousehold from "./page/onboarding/createHousehold/CreateHousehold";
import InviteMembers from "./page/onboarding/inviteMembers/InviteMembers";
import JoinHousehold from "./page/onboarding/joinHousehold/JoinHousehold";
import { routeToCorrectPagePure } from "./lib/routeToCorrectPagePure/routeToCorrectPagePure";
import NotFound from "./page/NotFound";
import Home from "./page/Home";
import Cookbook from "./page/Cookbook";
import Chatbot from "./page/Chatbot";
import LoadingScreen from "./components/general/LoadingScreen";
import EmotionalHook from "./page/onboarding/valueScreen/emotionalHook/EmotionalHook";
import ImportRecipes from "./page/onboarding/valueScreen/importRecipes/ImportRecipes";
import MealPlanningValue from "./page/onboarding/valueScreen/mealPlanningValue/MealPlanningValue";
import SurveyStart from "./page/onboarding/surveyStart/SurveyStart";
import ChatbotValue from "./page/onboarding/valueScreen/chatbotValue/ChatbotValue";
import Privacy from "./page/Privacy";
import TermsOfService from "./page/TermsOfService";
import Impressum from "./page/Impressum";
import BetaScreen from "./page/onboarding/betaScreen/BetaScreen";
import SocialProof from "./page/onboarding/socialProof/SocialProof";
import HowItWorks from "./page/onboarding/howItWorks/HowItWorks";
import TrialOffer from "./page/onboarding/trialOffer/TrialOffer";
import TrialReminder from "./page/onboarding/trialReminder/TrialReminder";
import ChooseUsername from "./page/onboarding/chooseUsername/ChooseUsername";
import { useSupabase } from "./utils/supabase";
import { closeBrowser } from "./utils/nativeBrowser";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { CapacitorShareTarget } from "@capgo/capacitor-share-target";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { AppUpdate, AppUpdateAvailability } from "@capawesome/capacitor-app-update";
import { LocalNotifications } from "@capacitor/local-notifications";
import "react-photo-view/dist/react-photo-view.css";
import URLImport from "./page/URLImport";
import ImageImport from "./page/ImageImport";
import SharedRecipe from "./page/SharedRecipe";
import NotificationSettings from "./page/NotificationSettings";
import { useUserData } from "./hooks/user/useUserData";
import UpdateDialog from "./components/general/UpdateDialog";

function App() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);
  const { isActive: householdIsActive, isLoading: subLoading } = useHouseholdSubscription();
  const isSubLoading = !!householdId && subLoading;
  const [loading, setLoading] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const navigate = useNavigate();
  const { fetchUserData } = useUserData();

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (!Capacitor.isNativePlatform()) return;

        if (!Capacitor.isPluginAvailable("AppUpdate")) {
          console.warn("AppUpdate plugin not available");
          return;
        }

        const result = await AppUpdate.getAppUpdateInfo();
        if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
          setShowUpdateDialog(true);
        }
      } catch (error) {
        console.error("Error checking for app updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    setShowUpdateDialog(false);
    try {
      const platform = Capacitor.getPlatform();

      const reloadOnReturn = async () => {
        // Only reload after the app has actually gone to the background first,
        // to avoid reloading immediately if the store redirect bounces back instantly.
        let wentToBackground = false;
        const listener = await CapacitorApp.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            wentToBackground = true;
          } else if (wentToBackground) {
            listener.remove();
            window.location.reload();
          }
        });
      };

      if (platform === "android") {
        const result = await AppUpdate.getAppUpdateInfo();
        if (result.immediateUpdateAllowed) {
          // performImmediateUpdate blocks until complete; the OS restarts the app
          // on success, so no listener needed here.
          await AppUpdate.performImmediateUpdate();
        } else {
          await AppUpdate.openAppStore();
          await reloadOnReturn();
        }
      } else if (platform === "ios") {
        await AppUpdate.openAppStore();
        await reloadOnReturn();
      } else {
        await AppUpdate.openAppStore();
      }
    } catch (error) {
      console.error("Error performing app update:", error);
    }
  };

  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    CapacitorShareTarget.addListener("shareReceived", (event) => {
      const rawText = event.texts?.[0];
      const url = rawText?.startsWith("http://") || rawText?.startsWith("https://") ? rawText : undefined;
      const title = event.title;
      if (url || title) {
        const params = new URLSearchParams();
        if (url) params.set("url", url);
        if (title) params.set("title", title);
        navigate(`/urlImport?${params.toString()}`);
      }
    }).then((handle) => {
      if (cancelled) {
        handle.remove();
      } else {
        listenerHandle = handle;
      }
    });

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      EdgeToEdge.enable().catch((e) => {
        console.error("Error enabling edge to edge:", e);
      });
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      async (event) => {
        const notificationType = event.notification.extra?.type as string | undefined;

        if (notificationType === "daily_meal_reminder") {
          try {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            const { data } = await supabase
              .from("meal_planning")
              .select("recipe_id")
              .eq("planned_date", todayStr);

            const meals = data ?? [];
            if (meals.length === 1 && meals[0].recipe_id) {
              navigate(`/recipe/${meals[0].recipe_id}`);
            } else {
              navigate("/home");
            }
          } catch {
            navigate("/home");
          }
        } else {
          navigate("/planner");
        }
      }
    );

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate, supabase]);

  async function updateUser(userId: string | null): Promise<void> {
    setLoading(true);
    await fetchUserData(userId);
    setLoading(false);
  }

  useEffect(() => {
    const { data: { subscription } = { subscription: undefined } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        updateUser(session?.user.id ?? null);

        try {
          await closeBrowser();
        } catch (error) {
          console.error(error);
        }
      });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Subscribe to realtime changes for the current user in the users table
  useEffect(() => {
    if (!user?.id) return;

    const userSubscription = supabase
      .channel("public:users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        () => {
          // Refetch user data and update Redux state
          supabase.auth.getSession().then(({ data: { session } }) => {
            updateUser(session?.user.id ?? null);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, [user?.id]);

  function isLoggedIn(): boolean {
    return user !== null;
  }

  function hasCompletedSurvey(): boolean {
    return user?.has_completed_survey ?? false;
  }

  function hasHousehold(): boolean {
    return householdId !== null;
  }

  function isPro(): boolean {
    return isSubLoading || householdIsActive;
  }

  function routeToCorrectPage(page: React.JSX.Element) {
    return routeToCorrectPagePure(
      page,
      isLoggedIn,
      hasCompletedSurvey,
      isPro,
      hasHousehold
    );
  }

  function guardOnboardingRoute(
    page: React.JSX.Element,
    requiredStep: "survey" | "socialproof"
  ) {
    if (!isLoggedIn()) {
      return <Navigate to="/signup" />;
    }
    if (requiredStep === "survey" && hasCompletedSurvey()) {
      return <Navigate to="/home" />;
    }
    return page;
  }

  if ((loading && !user) || isSubLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <UpdateDialog
        open={showUpdateDialog}
        onConfirm={handleUpdate}
        onCancel={() => setShowUpdateDialog(false)}
      />
      <Routes>
        {/* Privacy Policy */}
        <Route path="/privacy" element={<Privacy />} />

        {/* Terms of Service */}
        <Route path="/terms" element={<TermsOfService />} />

        {/* Impressum */}
        <Route path="/imprint" element={<Impressum />} />

        {/* Onboarding */}
        <Route path="/" element={isLoggedIn() ? <Navigate to="/home" /> : <Welcome />} />

        <Route path="/signup" element={isLoggedIn() ? <Navigate to="/home" /> : <SignUp />} />

        <Route
          path="/signup/email"
          element={isLoggedIn() ? <Navigate to="/home" /> : <EmailSignUp />}
        />

        <Route
          path="/signup/verify"
          element={isLoggedIn() ? <Navigate to="/home" /> : <EmailVerification />}
        />

        <Route path="/login" element={isLoggedIn() ? <Navigate to="/home" /> : <Login />} />

        <Route path="/beta" element={isLoggedIn() ? <BetaScreen /> : <Navigate to="/signup" />} />

        <Route path="/values" element={guardOnboardingRoute(<EmotionalHook />, "survey")} />
        <Route path="/values/1" element={guardOnboardingRoute(<EmotionalHook />, "survey")} />
        <Route path="/values/2" element={guardOnboardingRoute(<ImportRecipes />, "survey")} />
        <Route path="/values/3" element={guardOnboardingRoute(<ChatbotValue />, "survey")} />
        <Route path="/values/4" element={guardOnboardingRoute(<MealPlanningValue />, "survey")} />

        <Route path="/survey" element={guardOnboardingRoute(<SurveyStart />, "survey")} />
        <Route path="/survey/:questionId" element={guardOnboardingRoute(<Survey />, "survey")} />

        <Route path="/howitworks" element={guardOnboardingRoute(<HowItWorks />, "socialproof")} />
        <Route path="/socialproof" element={guardOnboardingRoute(<SocialProof />, "socialproof")} />
        <Route path="/trial" element={guardOnboardingRoute(<TrialOffer />, "socialproof")} />
        <Route path="/trialreminder" element={guardOnboardingRoute(<TrialReminder />, "socialproof")} />

        <Route
          path="/subscribe"
          element={
            isLoggedIn()
              ? Capacitor.isNativePlatform()
                ? <Subscribe />
                : <SubscribeWeb />
              : <Navigate to="/signup" />
          }
        />

        <Route path="/choosename" element={<ChooseUsername />} />

        <Route
          path="/createhousehold"
          element={hasHousehold() ? <Navigate to="/home" /> : <CreateHousehold />}
        />

        <Route path="/inviteMembers" element={<InviteMembers />} />

        <Route
          path="/joinHousehold"
          element={hasHousehold() ? <Navigate to="/home" /> : <JoinHousehold />}
        />

        {/* Main Routes */}
        <Route path="/settings" element={routeToCorrectPage(<Settings />)} />
        <Route path="/householdSettings" element={routeToCorrectPage(<HouseholdSettings />)} />
        <Route path="/notificationSettings" element={routeToCorrectPage(<NotificationSettings />)} />
        <Route path="/invite/:token" element={isLoggedIn() ? <InvitePage /> : <SignUp />} />

        <Route path="/planner" element={routeToCorrectPage(<MealPlanner />)} />
        <Route path="/cookbook" element={routeToCorrectPage(<Cookbook />)} />
        <Route path="/chatbot" element={routeToCorrectPage(<Chatbot />)} />
        <Route path="/home" element={routeToCorrectPage(<Home />)} />

        <Route path="/recipe/:recipeId" element={routeToCorrectPage(<Recipe />)} />
        <Route path="/recipe/add" element={routeToCorrectPage(<AddRecipe />)} />
        <Route path="/recipe/edit/:recipeId" element={routeToCorrectPage(<AddRecipe />)} />

        <Route path="/urlImport" element={routeToCorrectPage(<URLImport />)} />
        <Route path="/imageImport" element={routeToCorrectPage(<ImageImport />)} />

        {/* Public share route — no auth required */}
        <Route path="/share/:token" element={<SharedRecipe />} />

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
