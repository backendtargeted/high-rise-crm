export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      applications_tracking: {
        Row: {
          application_id: number
          application_status: string
          created_at: string | null
          date_application_sent: string | null
          date_signed: string | null
          lead_id: number
          list_id: number | null
          opensign_objectid: string | null
          type: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          application_id?: number
          application_status?: string
          created_at?: string | null
          date_application_sent?: string | null
          date_signed?: string | null
          lead_id: number
          list_id?: number | null
          opensign_objectid?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          application_id?: number
          application_status?: string
          created_at?: string | null
          date_application_sent?: string | null
          date_signed?: string | null
          lead_id?: number
          list_id?: number | null
          opensign_objectid?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "fk_list"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_id: number
          created_at: string | null
          industry: string | null
          name: string
          website: string | null
        }
        Insert: {
          company_id?: number
          created_at?: string | null
          industry?: string | null
          name: string
          website?: string | null
        }
        Update: {
          company_id?: number
          created_at?: string | null
          industry?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_id: number | null
          created_at: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          lead_id: number
          phone: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          lead_id?: number
          phone?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          lead_id?: number
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      list_companies: {
        Row: {
          company_id: number
          list_id: number
        }
        Insert: {
          company_id: number
          list_id: number
        }
        Update: {
          company_id?: number
          list_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_list"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["list_id"]
          },
        ]
      }
      lists: {
        Row: {
          cost: number | null
          created_at: string | null
          initial_lead_count: number | null
          list_id: number
          list_name: string
          list_provider: string | null
          list_type: string | null
          purchase_date: string | null
          status: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          initial_lead_count?: number | null
          list_id?: number
          list_name: string
          list_provider?: string | null
          list_type?: string | null
          purchase_date?: string | null
          status?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          initial_lead_count?: number | null
          list_id?: number
          list_name?: string
          list_provider?: string | null
          list_type?: string | null
          purchase_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          fullname: string
          id: number
          manager_id: number | null
          opensign_webhook: string | null
          opensignapikey: string | null
          opensignpass: string | null
          role: string | null
          templateid: string | null
          vicidialuser: string
        }
        Insert: {
          email?: string | null
          fullname: string
          id?: number
          manager_id?: number | null
          opensign_webhook?: string | null
          opensignapikey?: string | null
          opensignpass?: string | null
          role?: string | null
          templateid?: string | null
          vicidialuser: string
        }
        Update: {
          email?: string | null
          fullname?: string
          id?: number
          manager_id?: number | null
          opensign_webhook?: string | null
          opensignapikey?: string | null
          opensignpass?: string | null
          role?: string | null
          templateid?: string | null
          vicidialuser?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_user_data: {
        Args: { target_user_id: number }
        Returns: boolean
      }
      get_current_user_by_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: number
          role: string
          manager_id: number
          email: string
        }[]
      }
      get_current_user_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: number
          role: string
          manager_id: number
        }[]
      }
      postgres_fdw_disconnect: {
        Args: { "": string }
        Returns: boolean
      }
      postgres_fdw_disconnect_all: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      postgres_fdw_get_connections: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      postgres_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
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
