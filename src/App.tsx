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

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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

      <Route path="/" element={ifLoggedIn(<ShoppingList />)} />

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
