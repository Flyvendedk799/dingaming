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
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          shards_awarded: number
          streak_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date: string
          shards_awarded: number
          streak_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          shards_awarded?: number
          streak_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          game_type: string
          id: string
          is_active: boolean
          session_id: string
          state: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          game_type: string
          id?: string
          is_active?: boolean
          session_id: string
          state?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          game_type?: string
          id?: string
          is_active?: boolean
          session_id?: string
          state?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kinguin_orders: {
        Row: {
          created_at: string
          id: string
          keys: Json | null
          order_external_id: string | null
          order_id: string
          products: Json
          status: string
          total_price: number
          updated_at: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          keys?: Json | null
          order_external_id?: string | null
          order_id: string
          products: Json
          status?: string
          total_price: number
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          keys?: Json | null
          order_external_id?: string | null
          order_id?: string
          products?: Json
          status?: string
          total_price?: number
          updated_at?: string
          user_email?: string | null
        }
        Relationships: []
      }
      kinguin_products: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          genres: string[] | null
          id: string
          is_available: boolean | null
          kinguin_id: number
          last_synced_to_shopify: string | null
          margin_percent: number | null
          name: string
          original_price: number
          platform: string | null
          product_id: string | null
          qty: number | null
          region_id: number | null
          region_name: string | null
          release_date: string | null
          screenshots: string[] | null
          sell_price: number
          shopify_product_id: string | null
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          is_available?: boolean | null
          kinguin_id: number
          last_synced_to_shopify?: string | null
          margin_percent?: number | null
          name: string
          original_price: number
          platform?: string | null
          product_id?: string | null
          qty?: number | null
          region_id?: number | null
          region_name?: string | null
          release_date?: string | null
          screenshots?: string[] | null
          sell_price: number
          shopify_product_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          genres?: string[] | null
          id?: string
          is_available?: boolean | null
          kinguin_id?: number
          last_synced_to_shopify?: string | null
          margin_percent?: number | null
          name?: string
          original_price?: number
          platform?: string | null
          product_id?: string | null
          qty?: number | null
          region_id?: number | null
          region_name?: string | null
          release_date?: string | null
          screenshots?: string[] | null
          sell_price?: number
          shopify_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kinguin_webhook_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          total_purchases: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          total_purchases?: number
          updated_at?: string
        }
        Relationships: []
      }
      reward_items: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          shard_cost: number
          stock: number | null
          type: string
          updated_at: string
          value_dkk: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          shard_cost: number
          stock?: number | null
          type?: string
          updated_at?: string
          value_dkk?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          shard_cost?: number
          stock?: number | null
          type?: string
          updated_at?: string
          value_dkk?: number | null
        }
        Relationships: []
      }
      shard_balances: {
        Row: {
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shard_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shard_earning_rules: {
        Row: {
          action_type: string
          base_shards: number | null
          created_at: string
          id: string
          is_active: boolean
          max_shards: number | null
          percentage: number | null
          streak_multiplier: number | null
          updated_at: string
        }
        Insert: {
          action_type: string
          base_shards?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_shards?: number | null
          percentage?: number | null
          streak_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          base_shards?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_shards?: number | null
          percentage?: number | null
          streak_multiplier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shard_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shard_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          reward_id: string
          shards_spent: number
          status: string
          used_at: string | null
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reward_id: string
          shards_spent: number
          status?: string
          used_at?: string | null
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          reward_id?: string
          shards_spent?: number
          status?: string
          used_at?: string | null
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_kinguin_shopify_ids: {
        Args: { updates: Json }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
