import { Route, Routes } from "react-router";
import ShoppingList from "./page/ShoppingList";
import MealPlanner from "./page/MealPlanner";
import Discover from "./page/Discover";
import Bookmarks from "./page/Bookmarks";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/onboarding/SignUp";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./utils/supabase";
import Settings from "./page/Settings";
import HouseholdSettings from "./page/HouseholdSettings";
import InvitePage from "./page/InvitePage";
import { useAppDispatch } from "./redux/hooks";
import { setUser } from "./redux/slices/userSlice";
import {
  setHousehold,
  setHouseholdMembers,
} from "./redux/slices/householdSlice";
import Welcome from "./page/onboarding/Welcome";
import ValueScreen from "./page/onboarding/ValueScreen";
import Survey from "./page/onboarding/Survey";

function App() {
  const dispatch = useAppDispatch();

  const [session, setSession] = useState<Session | null>(null);

  async function updateSession(session: Session | null) {
    setSession(session);

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

  function ifLoggedIn(page: JSX.Element) {
    if (session) {
      return page;
    } else {
      return <SignUp />;
    }
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />

      <Route path="/signup" element={<SignUp />} />

      <Route path="/value" element={<ValueScreen />} />

      <Route path="/survey" element={<Survey />} />

      <Route path="/" element={ifLoggedIn(<MealPlanner />)} />

      <Route path="/settings" element={ifLoggedIn(<Settings />)} />
      <Route
        path="/householdSettings"
        element={ifLoggedIn(<HouseholdSettings />)}
      />
      <Route path="/invite/:token" element={ifLoggedIn(<InvitePage />)} />

      <Route path="/shoppinglist" element={ifLoggedIn(<ShoppingList />)} />
      <Route path="/mealplanner" element={ifLoggedIn(<MealPlanner />)} />
      <Route path="/discover" element={ifLoggedIn(<Discover />)} />
      <Route path="/bookmarks" element={ifLoggedIn(<Bookmarks />)} />

      <Route path="/recipe/:recipeId" element={ifLoggedIn(<Recipe />)} />
      <Route path="/recipe/add" element={ifLoggedIn(<AddRecipe />)} />
      <Route
        path="/recipe/edit/:recipeId"
        element={ifLoggedIn(<AddRecipe />)}
      />
    </Routes>
  );
}

export default App;
