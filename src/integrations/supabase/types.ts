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
      campaigns: {
        Row: {
          created_at: string | null
          ends_at: string
          goals: Json
          id: string
          is_active: boolean
          name: string
          starts_at: string
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          goals?: Json
          id?: string
          is_active?: boolean
          name: string
          starts_at: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          goals?: Json
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string
        }
        Relationships: []
      }
      daily_snapshots: {
        Row: {
          acoes_sdr_dia: number
          conv_bv_contato: number | null
          conv_call_proposta: number | null
          conv_contato_call: number | null
          conv_novo_bv: number | null
          conv_nutricao_fechado: number | null
          conv_nutricao_tratativas: number | null
          conv_proposta_nutricao: number | null
          conv_tratativas_fechado: number | null
          created_at: string
          id: string
          leads_boas_vindas: number
          leads_call_agendada: number
          leads_em_contato: number
          leads_fechado: number
          leads_novo: number
          leads_novos_dia: number
          leads_nutricao: number
          leads_perdido: number
          leads_proposta: number
          leads_tratativas: number
          pct_agendamentos: number
          pct_em_contato: number
          pct_propostas: number
          pipeline_value: number
          snapshot_date: string
          total_leads: number
        }
        Insert: {
          acoes_sdr_dia?: number
          conv_bv_contato?: number | null
          conv_call_proposta?: number | null
          conv_contato_call?: number | null
          conv_novo_bv?: number | null
          conv_nutricao_fechado?: number | null
          conv_nutricao_tratativas?: number | null
          conv_proposta_nutricao?: number | null
          conv_tratativas_fechado?: number | null
          created_at?: string
          id?: string
          leads_boas_vindas?: number
          leads_call_agendada?: number
          leads_em_contato?: number
          leads_fechado?: number
          leads_novo?: number
          leads_novos_dia?: number
          leads_nutricao?: number
          leads_perdido?: number
          leads_proposta?: number
          leads_tratativas?: number
          pct_agendamentos?: number
          pct_em_contato?: number
          pct_propostas?: number
          pipeline_value?: number
          snapshot_date: string
          total_leads?: number
        }
        Update: {
          acoes_sdr_dia?: number
          conv_bv_contato?: number | null
          conv_call_proposta?: number | null
          conv_contato_call?: number | null
          conv_novo_bv?: number | null
          conv_nutricao_fechado?: number | null
          conv_nutricao_tratativas?: number | null
          conv_proposta_nutricao?: number | null
          conv_tratativas_fechado?: number | null
          created_at?: string
          id?: string
          leads_boas_vindas?: number
          leads_call_agendada?: number
          leads_em_contato?: number
          leads_fechado?: number
          leads_novo?: number
          leads_novos_dia?: number
          leads_nutricao?: number
          leads_perdido?: number
          leads_proposta?: number
          leads_tratativas?: number
          pct_agendamentos?: number
          pct_em_contato?: number
          pct_propostas?: number
          pipeline_value?: number
          snapshot_date?: string
          total_leads?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_overrides: {
        Row: {
          overrides: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          overrides?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          overrides?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_proposals_leads"
            referencedColumns: ["lead_id"]
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
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_proposals_leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      lead_ingest_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error: string | null
          id: number
          ip: unknown
          lead_id: string | null
          payload_hash: string | null
          source_slug: string | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: number
          ip?: unknown
          lead_id?: string | null
          payload_hash?: string | null
          source_slug?: string | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: number
          ip?: unknown
          lead_id?: string | null
          payload_hash?: string | null
          source_slug?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ingest_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ingest_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_proposals_leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          ativo: boolean
          capi_action_source: string | null
          capi_habilitado: boolean
          cors_origins: string[]
          created_at: string
          created_by: string | null
          custom_field_schema: Json
          default_assignee: string | null
          default_stage: string
          email_notificar: string[]
          id: string
          nome: string
          notas: string | null
          previous_api_key_expires_at: string | null
          previous_api_key_hash: string | null
          previous_api_key_prefix: string | null
          product_id: string | null
          produto_label: string | null
          rate_limit_per_min: number
          slug: string
          updated_at: string
          whatsapp_agent_id: string | null
          whatsapp_auto_send: boolean
          whatsapp_channel_id: string | null
          whatsapp_initial_message: string | null
          whatsapp_triagem_agent_id: string | null
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          ativo?: boolean
          capi_action_source?: string | null
          capi_habilitado?: boolean
          cors_origins?: string[]
          created_at?: string
          created_by?: string | null
          custom_field_schema?: Json
          default_assignee?: string | null
          default_stage?: string
          email_notificar?: string[]
          id?: string
          nome: string
          notas?: string | null
          previous_api_key_expires_at?: string | null
          previous_api_key_hash?: string | null
          previous_api_key_prefix?: string | null
          product_id?: string | null
          produto_label?: string | null
          rate_limit_per_min?: number
          slug: string
          updated_at?: string
          whatsapp_agent_id?: string | null
          whatsapp_auto_send?: boolean
          whatsapp_channel_id?: string | null
          whatsapp_initial_message?: string | null
          whatsapp_triagem_agent_id?: string | null
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          ativo?: boolean
          capi_action_source?: string | null
          capi_habilitado?: boolean
          cors_origins?: string[]
          created_at?: string
          created_by?: string | null
          custom_field_schema?: Json
          default_assignee?: string | null
          default_stage?: string
          email_notificar?: string[]
          id?: string
          nome?: string
          notas?: string | null
          previous_api_key_expires_at?: string | null
          previous_api_key_hash?: string | null
          previous_api_key_prefix?: string | null
          product_id?: string | null
          produto_label?: string | null
          rate_limit_per_min?: number
          slug?: string
          updated_at?: string
          whatsapp_agent_id?: string | null
          whatsapp_auto_send?: boolean
          whatsapp_channel_id?: string | null
          whatsapp_initial_message?: string | null
          whatsapp_triagem_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sources_default_assignee_fkey"
            columns: ["default_assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          briefing_notes: string | null
          call_date: string | null
          campaign_id: string | null
          cargo: string | null
          closed_at: string | null
          colaboradores: string | null
          company: string | null
          company_description: string | null
          company_website: string | null
          consent_marketing: boolean | null
          created_at: string | null
          custom_fields: Json | null
          email: string
          fb_lead_id: string | null
          form_id: string | null
          id: string
          ingest_ip: unknown
          ingest_user_agent: string | null
          kanban_stage: string
          last_activity_at: string | null
          lead_heat: number | null
          linkedin_added: boolean | null
          lost_at_stage: string | null
          lost_notes: string | null
          lost_reason: string | null
          mensagem: string | null
          meta_last_event_at: string | null
          meta_last_event_sent: string | null
          name: string
          origem: string
          origem_detalhe: string | null
          product_id: string | null
          proxima_acao: string | null
          qualificador_tier1: string | null
          source_id: string | null
          source_metadata: Json | null
          stage_updated_at: string | null
          status: string
          suggested_tier: number | null
          telefone: string | null
          tier_confirmed: boolean
          tier_reasoning: string | null
          tier_signals: Json | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_proposta: number | null
          welcome_sent: boolean
          welcome_sent_at: string | null
          whatsapp_sent: boolean | null
          work_email: string | null
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          briefing_notes?: string | null
          call_date?: string | null
          campaign_id?: string | null
          cargo?: string | null
          closed_at?: string | null
          colaboradores?: string | null
          company?: string | null
          company_description?: string | null
          company_website?: string | null
          consent_marketing?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          fb_lead_id?: string | null
          form_id?: string | null
          id?: string
          ingest_ip?: unknown
          ingest_user_agent?: string | null
          kanban_stage?: string
          last_activity_at?: string | null
          lead_heat?: number | null
          linkedin_added?: boolean | null
          lost_at_stage?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          mensagem?: string | null
          meta_last_event_at?: string | null
          meta_last_event_sent?: string | null
          name: string
          origem?: string
          origem_detalhe?: string | null
          product_id?: string | null
          proxima_acao?: string | null
          qualificador_tier1?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          stage_updated_at?: string | null
          status?: string
          suggested_tier?: number | null
          telefone?: string | null
          tier_confirmed?: boolean
          tier_reasoning?: string | null
          tier_signals?: Json | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_proposta?: number | null
          welcome_sent?: boolean
          welcome_sent_at?: string | null
          whatsapp_sent?: boolean | null
          work_email?: string | null
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          briefing_notes?: string | null
          call_date?: string | null
          campaign_id?: string | null
          cargo?: string | null
          closed_at?: string | null
          colaboradores?: string | null
          company?: string | null
          company_description?: string | null
          company_website?: string | null
          consent_marketing?: boolean | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          fb_lead_id?: string | null
          form_id?: string | null
          id?: string
          ingest_ip?: unknown
          ingest_user_agent?: string | null
          kanban_stage?: string
          last_activity_at?: string | null
          lead_heat?: number | null
          linkedin_added?: boolean | null
          lost_at_stage?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          mensagem?: string | null
          meta_last_event_at?: string | null
          meta_last_event_sent?: string | null
          name?: string
          origem?: string
          origem_detalhe?: string | null
          product_id?: string | null
          proxima_acao?: string | null
          qualificador_tier1?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          stage_updated_at?: string | null
          status?: string
          suggested_tier?: number | null
          telefone?: string | null
          tier_confirmed?: boolean
          tier_reasoning?: string | null
          tier_signals?: Json | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_proposta?: number | null
          welcome_sent?: boolean
          welcome_sent_at?: string | null
          whatsapp_sent?: boolean | null
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          product_id: string | null
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
          product_id?: string | null
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
          product_id?: string | null
          sort_order?: number
          stage?: string
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_campaign_product_map: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          label: string | null
          lead_source_id: string
          product_id: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          label?: string | null
          lead_source_id: string
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          label?: string | null
          lead_source_id?: string
          product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_campaign_product_map_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_campaign_product_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_proposals_leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      products: {
        Row: {
          brand_color: string | null
          created_at: string
          default_considerations: string | null
          default_scope: string | null
          default_title_template: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          default_considerations?: string | null
          default_scope?: string | null
          default_title_template?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          default_considerations?: string | null
          default_scope?: string | null
          default_title_template?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          badge_initials: string | null
          cargo: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_briefing_seen: string | null
          phone: string | null
          rejection_reason: string | null
          role_label: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          badge_initials?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_briefing_seen?: string | null
          phone?: string | null
          rejection_reason?: string | null
          role_label?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          badge_initials?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_briefing_seen?: string | null
          phone?: string | null
          rejection_reason?: string | null
          role_label?: string | null
        }
        Relationships: []
      }
      proposal_master_assets: {
        Row: {
          id: string
          is_active: boolean
          label: string | null
          notes: string | null
          page_count: number | null
          product_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          page_count?: number | null
          product_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version: string
        }
        Update: {
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          page_count?: number | null
          product_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_master_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          master_asset_id: string | null
          product_id: string | null
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
          master_asset_id?: string | null
          product_id?: string | null
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
          master_asset_id?: string | null
          product_id?: string | null
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
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_proposals_leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "proposals_master_asset_id_fkey"
            columns: ["master_asset_id"]
            isOneToOne: false
            referencedRelation: "proposal_master_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      whatsapp_send_log: {
        Row: {
          created_at: string
          error: string | null
          gptmaker_response: Json | null
          id: string
          lead_id: string | null
          phone: string | null
          source_slug: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          gptmaker_response?: Json | null
          id?: string
          lead_id?: string | null
          phone?: string | null
          source_slug?: string | null
          status: string
        }
        Update: {
          created_at?: string
          error?: string | null
          gptmaker_response?: Json | null
          id?: string
          lead_id?: string | null
          phone?: string | null
          source_slug?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_proposals_leads: {
        Row: {
          assigned_to: string | null
          author_email: string | null
          author_name: string | null
          author_phone: string | null
          briefing_notes: string | null
          call_date: string | null
          colaboradores: string | null
          company_description: string | null
          company_name: string | null
          company_website: string | null
          considerations: string | null
          contact_name: string | null
          contact_name_lead: string | null
          contact_role: string | null
          event_date: string | null
          id: string | null
          investment: string | null
          kanban_stage: string | null
          lead_cargo: string | null
          lead_company: string | null
          lead_created_at: string | null
          lead_email: string | null
          lead_id: string | null
          lead_status: string | null
          lead_telefone: string | null
          lost_at_stage: string | null
          lost_notes: string | null
          lost_reason: string | null
          master_asset_id: string | null
          origem: string | null
          product_id: string | null
          product_name: string | null
          product_slug: string | null
          proposal_created_at: string | null
          proposal_status: string | null
          proxima_acao: string | null
          scope: string | null
          slug: string | null
          title: string | null
          valid_until: string | null
          valor_proposta: number | null
          work_email: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_master_asset_id_fkey"
            columns: ["master_asset_id"]
            isOneToOne: false
            referencedRelation: "proposal_master_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_user: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _role_label?: string
          _user_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_daily_snapshot: {
        Args: { target_date?: string }
        Returns: undefined
      }
      get_proposal_by_slug: {
        Args: { p_slug: string }
        Returns: {
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
          master_asset_id: string | null
          product_id: string | null
          scope: string | null
          slug: string
          status: string
          title: string
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "proposals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      list_active_lead_sources: {
        Args: never
        Returns: {
          nome: string
          slug: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_phone_e164: { Args: { input: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_user: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
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
