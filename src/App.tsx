import { Route, Routes, Navigate } from "react-router";
import ShoppingList from "./page/ShoppingList";
import MealPlanner from "./page/MealPlanner";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/onboarding/signUp/SignUp";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import Settings from "./page/Settings";
import HouseholdSettings from "./page/HouseholdSettings";
import InvitePage from "./page/InvitePage";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { selectUser, setUser } from "./redux/slices/userSlice";
import {
  selectHouseholdId,
  setHousehold,
  setHouseholdMembers,
} from "./redux/slices/householdSlice";
import Welcome from "./page/onboarding/welcome/Welcome";
import Survey from "./page/onboarding/survey/Survey";
import CreateHousehold from "./page/onboarding/createHousehold/CreateHousehold";
import InviteMembers from "./page/onboarding/inviteMembers/InviteMembers";
import JoinHousehold from "./page/onboarding/joinHousehold/JoinHousehold";
import { routeToCorrectPagePure } from "./lib/routeToCorrectPagePure";
import NotFound from "./page/NotFound";
import Home from "./page/Home";
import Explore from "./page/Explore";
import Cookbook from "./page/Cookbook";
import Chatbot from "./page/Chatbot";
import LoadingScreen from "./components/atoms/LoadingScreen";
import ImportRecipes from "./page/onboarding/valueScreen/importRecipes/ImportRecipes";
import MealPlanningValue from "./page/onboarding/valueScreen/mealPlanningValue/MealPlanningValue";
import SurveyStart from "./page/onboarding/surveyStart/SurveyStart";
import ChatbotValue from "./page/onboarding/valueScreen/chatbotValue/ChatbotValue";
import Privacy from "./page/Privacy";
import TermsOfService from "./page/TermsOfService";
import BetaScreen from "./page/onboarding/betaScreen/BetaScreen";
import { useSupabase } from "./utils/supabase";
import { closeBrowser } from "./utils/nativeBrowser";
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';

function App() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EdgeToEdge.enable().catch((e) => {
      console.error("Error enabling edge to edge:", e);
    });
  }, []);

  async function updateSession(session: Session | null) {
    setLoading(true);

    if (session?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*, household:household_id(*)")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);

        dispatch(setUser(null));
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
      } else {
        dispatch(setUser(userData));
        dispatch(setHousehold(userData.household ?? null));

        if (!userData.household_id) {
          setLoading(false);
          return;
        }

        // get household members
        const { data: membersData, error: membersError } = await supabase
          .from("users")
          .select("id, email")
          .eq("household_id", userData.household_id);

        if (membersError) {
          console.error("Error fetching household members:", membersError);
          setLoading(false);
          return;
        }

        dispatch(setHouseholdMembers(membersData));
      }
    } else {
      dispatch(setUser(null));
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
    }

    setLoading(false);
  }

  // Subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } = { subscription: undefined } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) updateSession(session);
        closeBrowser().catch(console.error);
      });

    return () => {
      isMounted = false;
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
            updateSession(session);
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Privacy Policy */}
      <Route path="/privacy" element={<Privacy />} />

      {/* Terms of Service */}
      <Route path="/terms" element={<TermsOfService />} />

      {/* Onboarding */}
      <Route
        path="/"
        element={isLoggedIn() ? <Navigate to="/planner" /> : <Welcome />}
      />

      <Route
        path="/signup"
        element={isLoggedIn() ? <Navigate to="/planner" /> : <SignUp />}
      />

      <Route path="/beta" element={<BetaScreen />} />

      <Route path="/values" element={<ImportRecipes />} />
      <Route path="/values/1" element={<ImportRecipes />} />
      <Route path="/values/2" element={<ChatbotValue />} />
      <Route path="/values/3" element={<MealPlanningValue />} />

      <Route path="/survey" element={<SurveyStart />} />
      <Route path="/survey/:questionId" element={<Survey />} />

      <Route
        path="/createhousehold"
        element={
          hasHousehold() ? <Navigate to="/planner" /> : <CreateHousehold />
        }
      />

      <Route path="/inviteMembers" element={<InviteMembers />} />

      <Route
        path="/joinHousehold"
        element={
          hasHousehold() ? <Navigate to="/planner" /> : <JoinHousehold />
        }
      />

      {/* Main Routes */}
      <Route path="/settings" element={routeToCorrectPage(<Settings />)} />
      <Route
        path="/householdSettings"
        element={routeToCorrectPage(<HouseholdSettings />)}
      />
      <Route
        path="/invite/:token"
        element={isLoggedIn() ? <InvitePage /> : <SignUp />}
      />

      <Route path="/lists" element={routeToCorrectPage(<ShoppingList />)} />
      <Route path="/planner" element={routeToCorrectPage(<MealPlanner />)} />
      <Route path="/explore" element={routeToCorrectPage(<Explore />)} />
      <Route path="/cookbook" element={routeToCorrectPage(<Cookbook />)} />
      <Route path="/chatbot" element={routeToCorrectPage(<Chatbot />)} />
      <Route path="/home" element={routeToCorrectPage(<Home />)} />

      <Route
        path="/recipe/:recipeId"
        element={routeToCorrectPage(<Recipe />)}
      />
      <Route path="/recipe/add" element={routeToCorrectPage(<AddRecipe />)} />
      <Route
        path="/recipe/edit/:recipeId"
        element={routeToCorrectPage(<AddRecipe />)}
      />
      {/* 404 Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
