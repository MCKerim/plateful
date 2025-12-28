import { createContext, ReactNode, useContext, FC, useState, useMemo } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const SupabaseContext = createContext<{ supabase: SupabaseClient<Database> } | null>(
  null
);

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: FC<SupabaseProviderProps> = ({ children }) => {
  const [supabase] = useState<SupabaseClient<Database>>(() =>
    createClient<Database>(supabaseUrl, supabaseKey)
  );

  const value = useMemo(() => ({ supabase }), [supabase]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
