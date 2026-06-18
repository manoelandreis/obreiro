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
      app_clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          rgpd_consent: boolean
          rgpd_consent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rgpd_consent?: boolean
          rgpd_consent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rgpd_consent?: boolean
          rgpd_consent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_job_groups: {
        Row: {
          created_at: string
          id: string
          job_id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_job_groups_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "app_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_job_materials: {
        Row: {
          created_at: string
          description: string
          group_id: string
          id: string
          obtained: boolean
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          group_id: string
          id?: string
          obtained?: boolean
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          group_id?: string
          id?: string
          obtained?: boolean
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_job_materials_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "app_job_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      app_job_tasks: {
        Row: {
          created_at: string
          description: string
          done: boolean
          group_id: string
          id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          done?: boolean
          group_id: string
          id?: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          done?: boolean
          group_id?: string
          id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_job_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "app_job_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      app_jobs: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          estimated_value: number | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      app_quotes: {
        Row: {
          client_id: string | null
          client_message: string | null
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          expires_at: string | null
          id: string
          iva: number
          job_id: string | null
          notes: string | null
          payment_terms: Json | null
          public_token: string | null
          responded_at: string | null
          sent_at: string | null
          services: Json
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          title: string
          total: number
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_message?: string | null
          client_snapshot?: Json
          company_snapshot?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          iva?: number
          job_id?: string | null
          notes?: string | null
          payment_terms?: Json | null
          public_token?: string | null
          responded_at?: string | null
          sent_at?: string | null
          services?: Json
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          title?: string
          total?: number
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_message?: string | null
          client_snapshot?: Json
          company_snapshot?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          iva?: number
          job_id?: string | null
          notes?: string | null
          payment_terms?: Json | null
          public_token?: string | null
          responded_at?: string | null
          sent_at?: string | null
          services?: Json
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          title?: string
          total?: number
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "app_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "app_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_settings: {
        Row: {
          avatar_url: string | null
          brand_color_accent: string | null
          brand_color_primary: string | null
          company_address: string | null
          company_description: string | null
          company_email: string | null
          company_name: string | null
          company_nif: string | null
          company_phone: string | null
          company_terms: string | null
          created_at: string
          default_payment_terms: Json | null
          full_name: string | null
          logo_url: string | null
          payment_conditions: string | null
          payment_term_presets: Json
          pin_enabled: boolean
          pin_hash: string | null
          pin_salt: string | null
          quote_validity_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_nif?: string | null
          company_phone?: string | null
          company_terms?: string | null
          created_at?: string
          default_payment_terms?: Json | null
          full_name?: string | null
          logo_url?: string | null
          payment_conditions?: string | null
          payment_term_presets?: Json
          pin_enabled?: boolean
          pin_hash?: string | null
          pin_salt?: string | null
          quote_validity_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_nif?: string | null
          company_phone?: string | null
          company_terms?: string | null
          created_at?: string
          default_payment_terms?: Json | null
          full_name?: string | null
          logo_url?: string | null
          payment_conditions?: string | null
          payment_term_presets?: Json
          pin_enabled?: boolean
          pin_hash?: string | null
          pin_salt?: string | null
          quote_validity_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          body: string | null
          id: string
          image_url: string | null
          section_key: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          id?: string
          image_url?: string | null
          section_key: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          id?: string
          image_url?: string | null
          section_key?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_email_send_log: {
        Row: {
          created_at: string
          email: string
          id: string
          idempotency_key: string | null
          ip_hash: string
          template: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          idempotency_key?: string | null
          ip_hash: string
          template: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          idempotency_key?: string | null
          ip_hash?: string
          template?: string
        }
        Relationships: []
      }
      quote_attachments: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          quote_id: string
          sort_order: number
          storage_path: string
          type: Database["public"]["Enums"]["attachment_type"]
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          quote_id: string
          sort_order?: number
          storage_path: string
          type?: Database["public"]["Enums"]["attachment_type"]
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          quote_id?: string
          sort_order?: number
          storage_path?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "app_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string
          step_number: number | null
          template_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id: string
          step_number?: number | null
          template_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          step_number?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_logs: {
        Row: {
          client_name: string | null
          company_name: string | null
          created_at: string
          id: string
          items_count: number | null
          services_summary: Json | null
          total_amount: number | null
        }
        Insert: {
          client_name?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          items_count?: number | null
          services_summary?: Json | null
          total_amount?: number | null
        }
        Update: {
          client_name?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          items_count?: number | null
          services_summary?: Json | null
          total_amount?: number | null
        }
        Relationships: []
      }
      quote_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          quote_id: string
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          quote_id: string
          source?: string
          status: Database["public"]["Enums"]["quote_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          quote_id?: string
          source?: string
          status?: Database["public"]["Enums"]["quote_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "app_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_templates: {
        Row: {
          category: string | null
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_kpis: { Args: never; Returns: Json }
      admin_dashboard_timeseries: {
        Args: { _days?: number }
        Returns: {
          day: string
          leads: number
          quotes: number
          signups: number
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          display_name: string
          email: string
          last_quote_at: string
          quotes_accepted: number
          quotes_count: number
          sub_status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }[]
      }
      admin_update_subscription: {
        Args: {
          _status: Database["public"]["Enums"]["subscription_status"]
          _tier: Database["public"]["Enums"]["subscription_tier"]
          _user_id: string
        }
        Returns: undefined
      }
      get_public_quote: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_quote_viewed: { Args: { _token: string }; Returns: undefined }
      respond_to_quote: {
        Args: { _action: string; _message?: string; _token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      attachment_type: "photo" | "file"
      job_status: "orcamento" | "aprovado" | "em_curso" | "concluido"
      lead_status:
        | "novo"
        | "contactado"
        | "qualificado"
        | "convertido"
        | "perdido"
      quote_status:
        | "rascunho"
        | "enviado"
        | "visto"
        | "aceite"
        | "rejeitado"
        | "expirado"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
      subscription_tier: "free" | "pro" | "business"
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
      app_role: ["admin", "user"],
      attachment_type: ["photo", "file"],
      job_status: ["orcamento", "aprovado", "em_curso", "concluido"],
      lead_status: [
        "novo",
        "contactado",
        "qualificado",
        "convertido",
        "perdido",
      ],
      quote_status: [
        "rascunho",
        "enviado",
        "visto",
        "aceite",
        "rejeitado",
        "expirado",
      ],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
      ],
      subscription_tier: ["free", "pro", "business"],
    },
  },
} as const
