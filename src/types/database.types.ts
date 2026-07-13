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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cookbooks: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cookbooks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cookbooks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      household: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      household_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          household_id: string
          id: string
          mission_id: string
          progress: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          household_id: string
          id?: string
          mission_id: string
          progress?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          household_id?: string
          id?: string
          mission_id?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "household_missions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      household_rewards: {
        Row: {
          badge_id: string
          claimed_at: string
          claimed_by: string
          household_id: string
          id: string
          mission_set: string
        }
        Insert: {
          badge_id: string
          claimed_at?: string
          claimed_by: string
          household_id: string
          id?: string
          mission_set: string
        }
        Update: {
          badge_id?: string
          claimed_at?: string
          claimed_by?: string
          household_id?: string
          id?: string
          mission_set?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_rewards_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_rewards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
      household_subscriptions: {
        Row: {
          created_at: string
          household_id: string
          id: string
          is_active: boolean
          payer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          is_active?: boolean
          payer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          is_active?: boolean
          payer_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_subscriptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_subscriptions_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          expires_at: string
          household_id: string | null
          id: string
          invited_by: string | null
          token: string
          use_count: number
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          household_id?: string | null
          id?: string
          invited_by?: string | null
          token: string
          use_count?: number
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          household_id?: string | null
          id?: string
          invited_by?: string | null
          token?: string
          use_count?: number
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
      meal_planning: {
        Row: {
          created_at: string
          eaten: boolean
          household_id: string | null
          id: string
          owner_id: string | null
          planned_date: string | null
          recipe_id: string | null
        }
        Insert: {
          created_at?: string
          eaten?: boolean
          household_id?: string | null
          id?: string
          owner_id?: string | null
          planned_date?: string | null
          recipe_id?: string | null
        }
        Update: {
          created_at?: string
          eaten?: boolean
          household_id?: string | null
          id?: string
          owner_id?: string | null
          planned_date?: string | null
          recipe_id?: string | null
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
            foreignKeyName: "meal_planning_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_planning_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_planning_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_with_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_definitions: {
        Row: {
          created_at: string
          id: string
          mission_set: string
          required_count: number
          scope: string
        }
        Insert: {
          created_at?: string
          id: string
          mission_set: string
          required_count?: number
          scope: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_set?: string
          required_count?: number
          scope?: string
        }
        Relationships: []
      }
      recipe_imports: {
        Row: {
          attempts: number
          created_at: string
          created_by: string
          error: string | null
          household_id: string
          id: string
          language: string | null
          result_count: number
          source_refs: Json | null
          source_type: string
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string
          error?: string | null
          household_id: string
          id?: string
          language?: string | null
          result_count?: number
          source_refs?: Json | null
          source_type: string
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string
          error?: string | null
          household_id?: string
          id?: string
          language?: string | null
          result_count?: number
          source_refs?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_imports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_imports_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          group_name: string | null
          id: string
          ingredient_name: string | null
          ingredient_name_normalized: string | null
          is_optional: boolean | null
          is_scalable: boolean | null
          preparation_note: string | null
          quantity_display: string | null
          quantity_value: number | null
          raw_text: string
          recipe_id: string
          sort_order: number
          unit: string | null
          unit_normalized: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          ingredient_name?: string | null
          ingredient_name_normalized?: string | null
          is_optional?: boolean | null
          is_scalable?: boolean | null
          preparation_note?: string | null
          quantity_display?: string | null
          quantity_value?: number | null
          raw_text: string
          recipe_id: string
          sort_order?: number
          unit?: string | null
          unit_normalized?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          ingredient_name?: string | null
          ingredient_name_normalized?: string | null
          is_optional?: boolean | null
          is_scalable?: boolean | null
          preparation_note?: string | null
          quantity_display?: string | null
          quantity_value?: number | null
          raw_text?: string
          recipe_id?: string
          sort_order?: number
          unit?: string | null
          unit_normalized?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_with_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_instructions: {
        Row: {
          created_at: string | null
          group_name: string | null
          id: string
          recipe_id: string
          sort_order: number
          step_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          recipe_id: string
          sort_order?: number
          step_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          recipe_id?: string
          sort_order?: number
          step_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_instructions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_instructions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_with_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string
          id: string
          note: string
          owner_id: string
          recipe_id: string | null
          stars: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          recipe_id?: string | null
          stars?: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          owner_id?: string
          recipe_id?: string | null
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
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_with_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          base_servings: number | null
          calories_kcal: number | null
          carbs_g: number | null
          category: number | null
          cookbook_id: string | null
          created_at: string
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          household_id: string | null
          id: string
          image_path: string | null
          import_id: string | null
          instructions: string | null
          link: string | null
          name: string
          owner_id: string | null
          protein_g: number | null
          servings_unit: string | null
          sodium_mg: number | null
          status: string
          sugar_g: number | null
        }
        Insert: {
          base_servings?: number | null
          calories_kcal?: number | null
          carbs_g?: number | null
          category?: number | null
          cookbook_id?: string | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id?: string | null
          id?: string
          image_path?: string | null
          import_id?: string | null
          instructions?: string | null
          link?: string | null
          name: string
          owner_id?: string | null
          protein_g?: number | null
          servings_unit?: string | null
          sodium_mg?: number | null
          status?: string
          sugar_g?: number | null
        }
        Update: {
          base_servings?: number | null
          calories_kcal?: number | null
          carbs_g?: number | null
          category?: number | null
          cookbook_id?: string | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id?: string | null
          id?: string
          image_path?: string | null
          import_id?: string | null
          instructions?: string | null
          link?: string | null
          name?: string
          owner_id?: string | null
          protein_g?: number | null
          servings_unit?: string | null
          sodium_mg?: number | null
          status?: string
          sugar_g?: number | null
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
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "recipe_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_recipes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          snapshot: Json
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot: Json
          token?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot?: Json
          token?: string
        }
        Relationships: []
      }
      survey_answers: {
        Row: {
          created_at: string
          id: string
          question: string
          question_number: number
          selected_options: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          question_number: number
          selected_options: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          badge_id: string
          claimed_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          claimed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          claimed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_user_id_fkey"
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
          household_id: string | null
          id: string
          language: string | null
          notification_preferences: Json | null
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          has_completed_survey?: boolean
          household_id?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          username?: string
        }
        Update: {
          created_at?: string
          email?: string
          has_completed_survey?: boolean
          household_id?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
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
      recipes_with_rating: {
        Row: {
          avg_rating: number | null
          base_servings: number | null
          category: number | null
          created_at: string | null
          description: string | null
          id: string | null
          image_path: string | null
          name: string | null
          servings_unit: string | null
          status: string | null
        }
        Insert: {
          avg_rating?: never
          base_servings?: number | null
          category?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_path?: string | null
          name?: string | null
          servings_unit?: string | null
          status?: string | null
        }
        Update: {
          avg_rating?: never
          base_servings?: number | null
          category?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_path?: string | null
          name?: string | null
          servings_unit?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_household_mission: {
        Args: { p_household_id: string; p_mission_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          household_id: string
          id: string
          mission_id: string
          progress: number
        }
        SetofOptions: {
          from: "*"
          to: "household_missions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retry_import: { Args: { p_import_id: string }; Returns: undefined }
      scale_recipe_servings: {
        Args: { p_new_base: number; p_recipe_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
