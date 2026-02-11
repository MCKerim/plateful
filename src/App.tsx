import { Route, Routes, Navigate, useNavigate } from "react-router";
import MealPlanner from "./page/MealPlanner";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/onboarding/signUp/SignUp";
import EmailSignUp from "./page/onboarding/emailSignUp/EmailSignUp";
import EmailVerification from "./page/onboarding/emailVerification/EmailVerification";
import Login from "./page/onboarding/login/Login";
import { useEffect, useState } from "react";
import Settings from "./page/Settings";
import HouseholdSettings from "./page/HouseholdSettings";
import InvitePage from "./page/InvitePage";
import { useAppSelector } from "./redux/hooks";
import { selectUser } from "./redux/slices/userSlice";
import { selectHouseholdId } from "./redux/slices/householdSlice";
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
import ImportRecipes from "./page/onboarding/valueScreen/importRecipes/ImportRecipes";
import MealPlanningValue from "./page/onboarding/valueScreen/mealPlanningValue/MealPlanningValue";
import SurveyStart from "./page/onboarding/surveyStart/SurveyStart";
import ChatbotValue from "./page/onboarding/valueScreen/chatbotValue/ChatbotValue";
import Privacy from "./page/Privacy";
import TermsOfService from "./page/TermsOfService";
import BetaScreen from "./page/onboarding/betaScreen/BetaScreen";
import SocialProof from "./page/onboarding/socialProof/SocialProof";
import ChooseUsername from "./page/onboarding/chooseUsername/ChooseUsername";
import { useSupabase } from "./utils/supabase";
import { closeBrowser } from "./utils/nativeBrowser";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { SendIntent } from "@supernotes/capacitor-send-intent";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { AppUpdate, AppUpdateAvailability } from "@capawesome/capacitor-app-update";
import "react-photo-view/dist/react-photo-view.css";
import URLImport from "./page/URLImport";
import ImageImport from "./page/ImageImport";
import { useUserData } from "./hooks/user/useUserData";
import UpdateDialog from "./components/general/UpdateDialog";

function App() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);
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
      if (platform === "android") {
        const result = await AppUpdate.getAppUpdateInfo();
        if (result.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
        } else {
          await AppUpdate.openAppStore();
        }
      } else if (platform === "ios") {
        // TODO: iOS App Store update flow
        // await AppUpdate.openAppStore({ appId: "..."});
      } else {
        await AppUpdate.openAppStore();
      }

      // Reload the webview when the user returns from the store
      const listener = await CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          listener.remove();
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Error performing app update:", error);
    }
  };

  useEffect(() => {
    const handleIntentReceived = (result: unknown) => {
      if (!result || typeof result !== "object") return;

      const { url, title, text } = result as { url?: string; title?: string; text?: string };
      if (url || title || text) {
        const params = new URLSearchParams();
        if (url) params.set("url", url);
        if (title) params.set("title", title);
        if (text) params.set("text", text);

        navigate(`/urlImport?${params.toString()}`);
      }
    };

    // Check on app startup
    SendIntent.checkSendIntentReceived()
      .then(handleIntentReceived)
      .catch((err) => {
        if (err?.message !== "No processing needed") {
          console.error("SendIntent error", err);
        }
      });

    // Listen for new share intents while app is running
    globalThis.addEventListener("sendIntentReceived", handleIntentReceived);

    return () => {
      globalThis.removeEventListener("sendIntentReceived", handleIntentReceived);
    };
  }, [navigate]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      EdgeToEdge.enable().catch((e) => {
        console.error("Error enabling edge to edge:", e);
      });
    }
  }, []);

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

  function hasSeenValueScreens(): boolean {
    return user?.has_seen_value_screens ?? false;
  }

  function hasCompletedSurvey(): boolean {
    return user?.has_completed_survey ?? false;
  }

  function hasHousehold(): boolean {
    return householdId !== null;
  }

  function routeToCorrectPage(page: JSX.Element) {
    return routeToCorrectPagePure(
      page,
      isLoggedIn,
      hasSeenValueScreens,
      hasCompletedSurvey,
      hasHousehold
    );
  }

  function guardOnboardingRoute(
    page: JSX.Element,
    requiredStep: "values" | "survey" | "socialproof"
  ) {
    if (!isLoggedIn()) {
      return <Navigate to="/signup" />;
    }
    if (requiredStep === "values" && hasSeenValueScreens()) {
      return <Navigate to="/home" />;
    }
    if (requiredStep === "survey" && hasCompletedSurvey()) {
      return <Navigate to="/home" />;
    }
    return page;
  }

  if (loading && !user) {
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

        <Route path="/values" element={guardOnboardingRoute(<ImportRecipes />, "values")} />
        <Route path="/values/1" element={guardOnboardingRoute(<ImportRecipes />, "values")} />
        <Route path="/values/2" element={guardOnboardingRoute(<ChatbotValue />, "values")} />
        <Route path="/values/3" element={guardOnboardingRoute(<MealPlanningValue />, "values")} />

        <Route path="/survey" element={guardOnboardingRoute(<SurveyStart />, "survey")} />
        <Route path="/survey/:questionId" element={guardOnboardingRoute(<Survey />, "survey")} />

        <Route path="/socialproof" element={guardOnboardingRoute(<SocialProof />, "socialproof")} />

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

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
