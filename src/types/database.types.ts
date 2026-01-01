export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cookbooks: {
        Row: {
          created_at: string
          household_id: number
          id: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          household_id: number
          id?: number
          name?: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          household_id?: number
          id?: number
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cookbooks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
      household: {
        Row: {
          created_at: string
          id: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          expires_at: string
          household_id: number
          id: number
          invited_by: string | null
          token: string
          used: boolean
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          household_id: number
          id?: number
          invited_by?: string | null
          token: string
          used?: boolean
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          household_id?: number
          id?: number
          invited_by?: string | null
          token?: string
          used?: boolean
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      item: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      meal_planning: {
        Row: {
          created_at: string
          days: number
          daysEaten: number
          household_id: number
          id: number
          owner_id: string
          planned_date: string | null
          recipe_id: number | null
        }
        Insert: {
          created_at?: string
          days?: number
          daysEaten?: number
          household_id: number
          id?: number
          owner_id?: string
          planned_date?: string | null
          recipe_id?: number | null
        }
        Update: {
          created_at?: string
          days?: number
          daysEaten?: number
          household_id?: number
          id?: number
          owner_id?: string
          planned_date?: string | null
          recipe_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_planning_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_planning_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          amount: string
          created_at: string
          id: number
          item_id: number
          recipe_id: number
        }
        Insert: {
          amount?: string
          created_at?: string
          id?: number
          item_id: number
          recipe_id: number
        }
        Update: {
          amount?: string
          created_at?: string
          id?: number
          item_id?: number
          recipe_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string
          id: number
          note: string
          owner_id: string
          recipe_id: number
          stars: number
        }
        Insert: {
          created_at?: string
          id?: number
          note?: string
          owner_id?: string
          recipe_id: number
          stars?: number
        }
        Update: {
          created_at?: string
          id?: number
          note?: string
          owner_id?: string
          recipe_id?: number
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: number | null
          cookbook_id: number | null
          created_at: string
          description: string | null
          household_id: number | null
          id: number
          link: string | null
          name: string
          owner_id: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          category?: number | null
          cookbook_id?: number | null
          created_at?: string
          description?: string | null
          household_id?: number | null
          id?: number
          link?: string | null
          name: string
          owner_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          category?: number | null
          cookbook_id?: number | null
          created_at?: string
          description?: string | null
          household_id?: number | null
          id?: number
          link?: string | null
          name?: string
          owner_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "recipes_cookbook_id_fkey"
            columns: ["cookbook_id"]
            isOneToOne: false
            referencedRelation: "cookbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_houshold_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          amount: string
          bought: boolean
          created_at: string
          id: number
          item_id: number
          shopping_list_id: number
        }
        Insert: {
          amount: string
          bought?: boolean
          created_at?: string
          id?: number
          item_id: number
          shopping_list_id: number
        }
        Update: {
          amount?: string
          bought?: boolean
          created_at?: string
          id?: number
          item_id?: number
          shopping_list_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_list"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answears: {
        Row: {
          created_at: string
          id: number
          question: string
          question_number: number
          selected_options: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          question: string
          question_number: number
          selected_options: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          question?: string
          question_number?: number
          selected_options?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answears_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          has_completed_survey: boolean
          has_seen_value_screens: boolean
          household_id: number | null
          id: string
          language: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          has_completed_survey?: boolean
          has_seen_value_screens?: boolean
          household_id?: number | null
          id?: string
          language?: string
          username?: string
        }
        Update: {
          created_at?: string
          email?: string
          has_completed_survey?: boolean
          has_seen_value_screens?: boolean
          household_id?: number | null
          id?: string
          language?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      visibility: "private" | "public" | "household"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      visibility: ["private", "public", "household"],
    },
  },
} as const
