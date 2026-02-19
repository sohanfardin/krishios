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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_reports: {
        Row: {
          action_steps: Json | null
          confidence: number | null
          created_at: string
          explanation_bn: string | null
          farm_id: string | null
          id: string
          reasoning: string | null
          report_type: string
          title: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          action_steps?: Json | null
          confidence?: number | null
          created_at?: string
          explanation_bn?: string | null
          farm_id?: string | null
          id?: string
          reasoning?: string | null
          report_type: string
          title?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          action_steps?: Json | null
          confidence?: number | null
          created_at?: string
          explanation_bn?: string | null
          farm_id?: string | null
          id?: string
          reasoning?: string | null
          report_type?: string
          title?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          farm_id: string | null
          id: string
          is_read: boolean
          message_bn: string | null
          severity: string
          title_bn: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          farm_id?: string | null
          id?: string
          is_read?: boolean
          message_bn?: string | null
          severity?: string
          title_bn?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          farm_id?: string | null
          id?: string
          is_read?: boolean
          message_bn?: string | null
          severity?: string
          title_bn?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string
          estimated_harvest: string | null
          farm_id: string
          fertilizer_usage: string | null
          growth_stage: string | null
          health_status: string | null
          id: string
          irrigation_method: string | null
          land_size: number | null
          land_unit: string | null
          last_fertilizer_date: string | null
          last_irrigation_date: string | null
          name: string
          planting_date: string | null
          soil_type: string | null
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          estimated_harvest?: string | null
          farm_id: string
          fertilizer_usage?: string | null
          growth_stage?: string | null
          health_status?: string | null
          id?: string
          irrigation_method?: string | null
          land_size?: number | null
          land_unit?: string | null
          last_fertilizer_date?: string | null
          last_irrigation_date?: string | null
          name: string
          planting_date?: string | null
          soil_type?: string | null
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          estimated_harvest?: string | null
          farm_id?: string
          fertilizer_usage?: string | null
          growth_stage?: string | null
          health_status?: string | null
          id?: string
          irrigation_method?: string | null
          land_size?: number | null
          land_unit?: string | null
          last_fertilizer_date?: string | null
          last_irrigation_date?: string | null
          name?: string
          planting_date?: string | null
          soil_type?: string | null
          updated_at?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crops_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage: {
        Row: {
          id: string
          image_count: number
          last_subscription_reminder: string | null
          question_count: number
          usage_date: string
          user_id: string
          voice_count: number
        }
        Insert: {
          id?: string
          image_count?: number
          last_subscription_reminder?: string | null
          question_count?: number
          usage_date?: string
          user_id: string
          voice_count?: number
        }
        Update: {
          id?: string
          image_count?: number
          last_subscription_reminder?: string | null
          question_count?: number
          usage_date?: string
          user_id?: string
          voice_count?: number
        }
        Relationships: []
      }
      decision_history: {
        Row: {
          action_taken: string | null
          context: Json | null
          created_at: string
          decision_type: string
          farm_id: string | null
          id: string
          recommendation: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          context?: Json | null
          created_at?: string
          decision_type: string
          farm_id?: string | null
          id?: string
          recommendation?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          context?: Json | null
          created_at?: string
          decision_type?: string
          farm_id?: string | null
          id?: string
          recommendation?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_history_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otps: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      farm_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          farm_id: string
          id: string
          is_completed: boolean
          priority: string
          related_crop_id: string | null
          related_livestock_id: string | null
          source: string | null
          task_type: string
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          farm_id: string
          id?: string
          is_completed?: boolean
          priority?: string
          related_crop_id?: string | null
          related_livestock_id?: string | null
          source?: string | null
          task_type?: string
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          farm_id?: string
          id?: string
          is_completed?: boolean
          priority?: string
          related_crop_id?: string | null
          related_livestock_id?: string | null
          source?: string | null
          task_type?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_tasks_related_crop_id_fkey"
            columns: ["related_crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_tasks_related_livestock_id_fkey"
            columns: ["related_livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          district: string | null
          id: string
          name: string
          type: string
          upazila: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          name: string
          type?: string
          upazila?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          type?: string
          upazila?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          farm_id: string
          id: string
          transaction_date: string
          type: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_ponds: {
        Row: {
          area_decimal: number
          created_at: string
          current_avg_weight_g: number | null
          daily_feed_amount: number | null
          depth_feet: number | null
          expected_sale_date: string | null
          farm_id: string
          feed_cost: number | null
          fingerling_cost: number | null
          fingerling_count: number | null
          fish_species: string[] | null
          id: string
          notes: string | null
          pond_number: number
          status: string
          stocking_date: string | null
          updated_at: string
          water_source: string | null
        }
        Insert: {
          area_decimal?: number
          created_at?: string
          current_avg_weight_g?: number | null
          daily_feed_amount?: number | null
          depth_feet?: number | null
          expected_sale_date?: string | null
          farm_id: string
          feed_cost?: number | null
          fingerling_cost?: number | null
          fingerling_count?: number | null
          fish_species?: string[] | null
          id?: string
          notes?: string | null
          pond_number?: number
          status?: string
          stocking_date?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Update: {
          area_decimal?: number
          created_at?: string
          current_avg_weight_g?: number | null
          daily_feed_amount?: number | null
          depth_feet?: number | null
          expected_sale_date?: string | null
          farm_id?: string
          feed_cost?: number | null
          fingerling_cost?: number | null
          fingerling_count?: number | null
          fish_species?: string[] | null
          id?: string
          notes?: string | null
          pond_number?: number
          status?: string
          stocking_date?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fish_ponds_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_production_logs: {
        Row: {
          avg_weight_g: number | null
          created_at: string
          farm_id: string
          feed_amount_kg: number | null
          feed_cost: number | null
          id: string
          log_date: string
          medicine_cost: number | null
          mortality_count: number | null
          notes: string | null
          pond_id: string | null
          water_quality_notes: string | null
        }
        Insert: {
          avg_weight_g?: number | null
          created_at?: string
          farm_id: string
          feed_amount_kg?: number | null
          feed_cost?: number | null
          id?: string
          log_date?: string
          medicine_cost?: number | null
          mortality_count?: number | null
          notes?: string | null
          pond_id?: string | null
          water_quality_notes?: string | null
        }
        Update: {
          avg_weight_g?: number | null
          created_at?: string
          farm_id?: string
          feed_amount_kg?: number | null
          feed_cost?: number | null
          id?: string
          log_date?: string
          medicine_cost?: number | null
          mortality_count?: number | null
          notes?: string | null
          pond_id?: string | null
          water_quality_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fish_production_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_production_logs_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_records: {
        Row: {
          created_at: string
          crop_id: string | null
          crop_name: string
          farm_id: string
          fertilizer_cost: number
          harvest_date: string | null
          id: string
          irrigation_cost: number
          labor_cost: number
          land_size: number
          land_unit: string
          medicine_cost: number
          notes: string | null
          planting_date: string | null
          production_unit: string
          season: string | null
          total_production: number
          total_sale_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_id?: string | null
          crop_name: string
          farm_id: string
          fertilizer_cost?: number
          harvest_date?: string | null
          id?: string
          irrigation_cost?: number
          labor_cost?: number
          land_size?: number
          land_unit?: string
          medicine_cost?: number
          notes?: string | null
          planting_date?: string | null
          production_unit?: string
          season?: string | null
          total_production?: number
          total_sale_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_id?: string | null
          crop_name?: string
          farm_id?: string
          fertilizer_cost?: number
          harvest_date?: string | null
          id?: string
          irrigation_cost?: number
          labor_cost?: number
          land_size?: number
          land_unit?: string
          medicine_cost?: number
          notes?: string | null
          planting_date?: string | null
          production_unit?: string
          season?: string | null
          total_production?: number
          total_sale_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_records_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          farm_id: string | null
          id: string
          image_type: string
          metadata: Json | null
          storage_path: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          farm_id?: string | null
          id?: string
          image_type?: string
          metadata?: Json | null
          storage_path: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          farm_id?: string | null
          id?: string
          image_type?: string
          metadata?: Json | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          age_group: string | null
          animal_type: string
          breed: string | null
          count: number
          created_at: string
          daily_production_amount: number | null
          daily_production_unit: string | null
          farm_id: string
          feed_cost: number | null
          id: string
          last_illness_date: string | null
          medicine_cost: number | null
          production_data: Json | null
          updated_at: string
          vaccination_history: Json | null
        }
        Insert: {
          age_group?: string | null
          animal_type: string
          breed?: string | null
          count?: number
          created_at?: string
          daily_production_amount?: number | null
          daily_production_unit?: string | null
          farm_id: string
          feed_cost?: number | null
          id?: string
          last_illness_date?: string | null
          medicine_cost?: number | null
          production_data?: Json | null
          updated_at?: string
          vaccination_history?: Json | null
        }
        Update: {
          age_group?: string | null
          animal_type?: string
          breed?: string | null
          count?: number
          created_at?: string
          daily_production_amount?: number | null
          daily_production_unit?: string | null
          farm_id?: string
          feed_cost?: number | null
          id?: string
          last_illness_date?: string | null
          medicine_cost?: number | null
          production_data?: Json | null
          updated_at?: string
          vaccination_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_production_logs: {
        Row: {
          animal_count: number
          animal_type: string
          created_at: string
          farm_id: string
          feed_cost: number
          id: string
          livestock_id: string | null
          log_date: string
          medicine_cost: number
          notes: string | null
          production_amount: number
          production_unit: string
          sale_price: number
        }
        Insert: {
          animal_count?: number
          animal_type: string
          created_at?: string
          farm_id: string
          feed_cost?: number
          id?: string
          livestock_id?: string | null
          log_date?: string
          medicine_cost?: number
          notes?: string | null
          production_amount?: number
          production_unit?: string
          sale_price?: number
        }
        Update: {
          animal_count?: number
          animal_type?: string
          created_at?: string
          farm_id?: string
          feed_cost?: number
          id?: string
          livestock_id?: string | null
          log_date?: string
          medicine_cost?: number
          notes?: string | null
          production_amount?: number
          production_unit?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "livestock_production_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_production_logs_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          id: string
          price: number
          product: string
          recorded_at: string
          source: string | null
          unit: string
        }
        Insert: {
          id?: string
          price: number
          product: string
          recorded_at?: string
          source?: string | null
          unit?: string
        }
        Update: {
          id?: string
          price?: number
          product?: string
          recorded_at?: string
          source?: string | null
          unit?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          plan: string
          status: string | null
          transaction_id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan: string
          status?: string | null
          transaction_id: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan?: string
          status?: string | null
          transaction_id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biggest_challenges: string[] | null
          created_at: string
          district: string | null
          email: string | null
          farmer_type: string[] | null
          farming_method: string | null
          full_name: string
          id: string
          irrigation_source: string | null
          land_ownership: string | null
          land_size_category: string | null
          language_pref: string
          onboarding_completed: boolean
          phone: string | null
          upazila: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          biggest_challenges?: string[] | null
          created_at?: string
          district?: string | null
          email?: string | null
          farmer_type?: string[] | null
          farming_method?: string | null
          full_name?: string
          id?: string
          irrigation_source?: string | null
          land_ownership?: string | null
          land_size_category?: string | null
          language_pref?: string
          onboarding_completed?: boolean
          phone?: string | null
          upazila?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          biggest_challenges?: string[] | null
          created_at?: string
          district?: string | null
          email?: string | null
          farmer_type?: string[] | null
          farming_method?: string | null
          full_name?: string
          id?: string
          irrigation_source?: string | null
          land_ownership?: string | null
          land_size_category?: string | null
          language_pref?: string
          onboarding_completed?: boolean
          phone?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_queries: {
        Row: {
          ai_response: Json | null
          audio_path: string | null
          category: string | null
          created_at: string
          id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          ai_response?: Json | null
          audio_path?: string | null
          category?: string | null
          created_at?: string
          id?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          ai_response?: Json | null
          audio_path?: string | null
          category?: string | null
          created_at?: string
          id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weather_logs: {
        Row: {
          farm_id: string
          fetched_at: string
          humidity: number | null
          id: string
          rain_forecast: string | null
          raw_data: Json | null
          temperature: number | null
          wind: number | null
        }
        Insert: {
          farm_id: string
          fetched_at?: string
          humidity?: number | null
          id?: string
          rain_forecast?: string | null
          raw_data?: Json | null
          temperature?: number | null
          wind?: number | null
        }
        Update: {
          farm_id?: string
          fetched_at?: string
          humidity?: number | null
          id?: string
          rain_forecast?: string | null
          raw_data?: Json | null
          temperature?: number | null
          wind?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_farm: { Args: { _farm_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "farmer"
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
      app_role: ["admin", "farmer"],
    },
  },
} as const
