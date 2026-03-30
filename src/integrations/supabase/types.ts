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
      email_templates: {
        Row: {
          body_html: string
          from_email: string
          from_name: string
          id: string
          reply_to: string | null
          slug: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body_html?: string
          from_email?: string
          from_name?: string
          id?: string
          reply_to?: string | null
          slug: string
          subject?: string
          updated_at?: string | null
        }
        Update: {
          body_html?: string
          from_email?: string
          from_name?: string
          id?: string
          reply_to?: string | null
          slug?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string | null
          id: string
          lead_id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          due_date: string
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          briefing_notes: string | null
          call_date: string | null
          cargo: string | null
          closed_at: string | null
          company: string | null
          company_description: string | null
          company_website: string | null
          created_at: string | null
          email: string
          id: string
          kanban_stage: string
          last_activity_at: string | null
          linkedin_added: boolean | null
          lost_notes: string | null
          lost_reason: string | null
          mensagem: string | null
          name: string
          origem: string
          stage_updated_at: string | null
          status: string
          telefone: string | null
          welcome_sent: boolean
          welcome_sent_at: string | null
          whatsapp_sent: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          briefing_notes?: string | null
          call_date?: string | null
          cargo?: string | null
          closed_at?: string | null
          company?: string | null
          company_description?: string | null
          company_website?: string | null
          created_at?: string | null
          email: string
          id?: string
          kanban_stage?: string
          last_activity_at?: string | null
          linkedin_added?: boolean | null
          lost_notes?: string | null
          lost_reason?: string | null
          mensagem?: string | null
          name: string
          origem?: string
          stage_updated_at?: string | null
          status?: string
          telefone?: string | null
          welcome_sent?: boolean
          welcome_sent_at?: string | null
          whatsapp_sent?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          briefing_notes?: string | null
          call_date?: string | null
          cargo?: string | null
          closed_at?: string | null
          company?: string | null
          company_description?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string
          id?: string
          kanban_stage?: string
          last_activity_at?: string | null
          linkedin_added?: boolean | null
          lost_notes?: string | null
          lost_reason?: string | null
          mensagem?: string | null
          name?: string
          origem?: string
          stage_updated_at?: string | null
          status?: string
          telefone?: string | null
          welcome_sent?: boolean
          welcome_sent_at?: string | null
          whatsapp_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string | null
          id: string
          is_active: boolean
          sort_order: number
          stage: string
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          stage: string
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          stage?: string
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          lead_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      proposal_submissions: {
        Row: {
          channels: string[]
          created_at: string | null
          created_by: string
          id: string
          lead_id: string
          notes: string | null
          proposal_id: string | null
          sent_at: string
        }
        Insert: {
          channels?: string[]
          created_at?: string | null
          created_by: string
          id?: string
          lead_id: string
          notes?: string | null
          proposal_id?: string | null
          sent_at?: string
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          created_by?: string
          id?: string
          lead_id?: string
          notes?: string | null
          proposal_id?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          author_email: string | null
          author_name: string | null
          author_phone: string | null
          company_name: string
          considerations: string | null
          contact_name: string
          contact_role: string | null
          created_at: string | null
          created_by: string
          event_date: string | null
          id: string
          investment: string | null
          lead_id: string | null
          scope: string | null
          slug: string
          status: string
          title: string
          valid_until: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          author_phone?: string | null
          company_name: string
          considerations?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string | null
          created_by: string
          event_date?: string | null
          id?: string
          investment?: string | null
          lead_id?: string | null
          scope?: string | null
          slug: string
          status?: string
          title: string
          valid_until?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          author_phone?: string | null
          company_name?: string
          considerations?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string | null
          created_by?: string
          event_date?: string | null
          id?: string
          investment?: string | null
          lead_id?: string | null
          scope?: string | null
          slug?: string
          status?: string
          title?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      user_template_overrides: {
        Row: {
          body: string
          created_at: string | null
          id: string
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_template_overrides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
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
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
