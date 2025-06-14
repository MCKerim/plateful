import { Route, Routes, Navigate } from "react-router";
import ShoppingList from "./page/ShoppingList";
import MealPlanner from "./page/MealPlanner";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/onboarding/SignUp";
import { useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./utils/supabase";
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
import Welcome from "./page/onboarding/Welcome";
import ValueScreen from "./page/onboarding/ValueScreen";
import Survey from "./page/onboarding/Survey";
import CreateHousehold from "./page/onboarding/CreateHousehold";
import InviteMembers from "./page/onboarding/InviteMembers";
import JoinHousehold from "./page/onboarding/JoinHousehold";
import { routeToCorrectPagePure } from "./lib/routeToCorrectPagePure";
import NotFound from "./page/NotFound";
import Home from "./page/Home";
import Explore from "./page/Explore";
import Cookbook from "./page/Cookbook";

function App() {
  const dispatch = useAppDispatch();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);

  async function updateSession(session: Session | null) {
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
          return;
        }

        // get household members
        const { data: membersData, error: membersError } = await supabase
          .from("users")
          .select("id, email")
          .eq("household_id", userData.household_id);

        if (membersError) {
          console.error("Error fetching household members:", membersError);
          return;
        }

        dispatch(setHouseholdMembers(membersData));
      }
    } else {
      dispatch(setUser(null));
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
    }
  }

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } = { subscription: undefined } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) updateSession(session);
      });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to realtime changes for the current user in the users table
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
    return true;
  }

  function hasSeenValueScreens(): boolean {
    return true;
  }

  function hasCompletedSurvey(): boolean {
    return true;
  }

  function hasHousehold(): boolean {
    return true;
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

  return (
    <Routes>
      {/* Onboarding */}
      <Route
        path="/"
        element={isLoggedIn() ? <Navigate to="/planner" /> : <Welcome />}
      />

      <Route
        path="/signup"
        element={isLoggedIn() ? <Navigate to="/planner" /> : <SignUp />}
      />

      <Route path="/value" element={<ValueScreen />} />

      <Route path="/survey" element={<Survey />} />

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

      <Route
        path="/lists"
        element={routeToCorrectPage(<ShoppingList />)}
      />
      <Route
        path="/planner"
        element={routeToCorrectPage(<MealPlanner />)}
      />
      <Route path="/explore" element={routeToCorrectPage(<Explore />)} />
      <Route path="/cookbook" element={routeToCorrectPage(<Cookbook />)} />
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
