import { Route, Routes } from "react-router";
import ShoppingList from "./page/ShoppingList";
import MealPlanner from "./page/MealPlanner";
import Discover from "./page/Discover";
import Bookmarks from "./page/Bookmarks";
import Recipe from "./page/Recipe";
import AddRecipe from "./page/AddRecipe";
import SignUp from "./page/SignUp";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./utils/supabase";
import Settings from "./page/Settings";
import Household from "./page/Household";
import InvitePage from "./page/InvitePage";
import { useAppDispatch } from "./redux/hooks";
import { setUser } from "./redux/slices/userSlice";

function App() {
  const dispatch = useAppDispatch();

  const [session, setSession] = useState<Session | null>(null);

  async function updateSession(session: Session | null) {
    setSession(session);

    if (session?.user) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (error) {
        console.error("Error fetching user data:", error);
        dispatch(setUser(null));
      } else {
        dispatch(setUser(data));
      }
    } else {
      dispatch(setUser(null));
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
      <Route path="/signup" element={<SignUp />} />

      <Route path="/" element={ifLoggedIn(<MealPlanner />)} />

      <Route path="/settings" element={ifLoggedIn(<Settings />)} />
      <Route path="/household" element={ifLoggedIn(<Household />)} />
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
