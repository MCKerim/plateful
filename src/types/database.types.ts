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
      collections: {
        Row: {
          color_hex: string
          color_key: string
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          name: string
          sticker_key: string | null
          sticker_x: number
          sticker_y: number
          updated_at: string
        }
        Insert: {
          color_hex: string
          color_key: string
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          name: string
          sticker_key?: string | null
          sticker_x?: number
          sticker_y?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string
          color_key?: string
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          name?: string
          sticker_key?: string | null
          sticker_x?: number
          sticker_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cooking_session_checks: {
        Row: {
          checked_at: string
          checked_by: string
          kind: string
          ref_id: string
          session_id: string
        }
        Insert: {
          checked_at?: string
          checked_by: string
          kind: string
          ref_id: string
          session_id: string
        }
        Update: {
          checked_at?: string
          checked_by?: string
          kind?: string
          ref_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooking_session_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_session_checks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_session_participants: {
        Row: {
          current_step_id: string | null
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          current_step_id?: string | null
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          current_step_id?: string | null
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooking_session_participants_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "recipe_instructions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_session_timers: {
        Row: {
          created_at: string
          created_by: string
          duration_seconds: number | null
          ends_at: string | null
          id: string
          label: string
          paused_remaining_seconds: number | null
          session_id: string
          step_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          ends_at?: string | null
          id?: string
          label: string
          paused_remaining_seconds?: number | null
          session_id: string
          step_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          ends_at?: string | null
          id?: string
          label?: string
          paused_remaining_seconds?: number | null
          session_id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooking_session_timers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_session_timers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cooking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_session_timers_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "recipe_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      cooking_sessions: {
        Row: {
          ended_at: string | null
          household_id: string
          id: string
          recipe_id: string
          started_at: string
          started_by: string
          status: string
          target_servings: number | null
        }
        Insert: {
          ended_at?: string | null
          household_id: string
          id?: string
          recipe_id: string
          started_at?: string
          started_by: string
          status?: string
          target_servings?: number | null
        }
        Update: {
          ended_at?: string | null
          household_id?: string
          id?: string
          recipe_id?: string
          started_at?: string
          started_by?: string
          status?: string
          target_servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cooking_sessions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_with_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooking_sessions_started_by_fkey"
            columns: ["started_by"]
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
          environment: string | null
          expires_at: string | null
          household_id: string
          id: string
          is_active: boolean
          last_event_at: string | null
          payer_user_id: string
          store: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment?: string | null
          expires_at?: string | null
          household_id: string
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          payer_user_id: string
          store?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment?: string | null
          expires_at?: string | null
          household_id?: string
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          payer_user_id?: string
          store?: string | null
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
      push_tokens: {
        Row: {
          environment: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          environment?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          environment?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_collections: {
        Row: {
          collection_id: string
          created_at: string
          household_id: string
          recipe_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          household_id: string
          recipe_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          household_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collections_collection_household_fkey"
            columns: ["collection_id", "household_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "recipe_collections_recipe_household_fkey"
            columns: ["recipe_id", "household_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id", "household_id"]
          },
        ]
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
          source_text: string | null
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
          source_text?: string | null
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
          source_text?: string | null
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
          cover_pending: boolean
          created_at: string
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          household_id: string
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
          cover_pending?: boolean
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id: string
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
          cover_pending?: boolean
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          household_id?: string
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
          cover_pending: boolean | null
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
          cover_pending?: boolean | null
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
          cover_pending?: boolean | null
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
      register_push_token: {
        Args: { p_environment: string; p_platform: string; p_token: string }
        Returns: undefined
      }
      replace_recipe_collections: {
        Args: { p_collection_ids?: string[]; p_recipe_id: string }
        Returns: undefined
      }
      retry_import: { Args: { p_import_id: string }; Returns: undefined }
      scale_recipe_servings: {
        Args: { p_new_base: number; p_recipe_id: string }
        Returns: undefined
      }
      unregister_push_token: { Args: { p_token: string }; Returns: undefined }
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
