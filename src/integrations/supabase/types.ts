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
      accounting_entries: {
        Row: {
          catalog_amount: number
          contact_id: string | null
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          final_amount: number
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          quote_id: string | null
          stripe_payment_id: string | null
          subscription_id: string | null
          total_ttc: number | null
          type: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          catalog_amount: number
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_amount: number
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
          total_ttc?: number | null
          type: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          catalog_amount?: number
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_amount?: number
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_id?: string | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
          total_ttc?: number | null
          type?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "agency_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ag_votes: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          proxy_for: string | null
          resolution_index: number
          user_id: string
          vote: string
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          proxy_for?: string | null
          resolution_index: number
          user_id: string
          vote: string
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          proxy_for?: string | null
          resolution_index?: number
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "ag_votes_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "general_assemblies"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          status: string | null
          trial_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          status?: string | null
          trial_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          status?: string | null
          trial_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agencies_trial_account_id_fkey"
            columns: ["trial_account_id"]
            isOneToOne: false
            referencedRelation: "trial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_subscriptions: {
        Row: {
          activation_price_paid: number
          apartments_count: number
          catalog_activation_price: number
          catalog_monthly_price: number
          created_at: string | null
          id: string
          monthly_price: number
          paid_at: string | null
          residences_count: number
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activation_price_paid: number
          apartments_count?: number
          catalog_activation_price: number
          catalog_monthly_price: number
          created_at?: string | null
          id?: string
          monthly_price: number
          paid_at?: string | null
          residences_count?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activation_price_paid?: number
          apartments_count?: number
          catalog_activation_price?: number
          catalog_monthly_price?: number
          created_at?: string | null
          id?: string
          monthly_price?: number
          paid_at?: string | null
          residences_count?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          residence_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          residence_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          residence_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          content_text: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          name: string
          residence_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          residence_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          residence_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_documents_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_requests: {
        Row: {
          assigned_lot_id: string | null
          created_at: string
          id: string
          manager_response: string | null
          message: string | null
          processed_at: string | null
          processed_by: string | null
          residence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_lot_id?: string | null
          created_at?: string
          id?: string
          manager_response?: string | null
          message?: string | null
          processed_at?: string | null
          processed_by?: string | null
          residence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_lot_id?: string | null
          created_at?: string
          id?: string
          manager_response?: string | null
          message?: string | null
          processed_at?: string | null
          processed_by?: string | null
          residence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_requests_assigned_lot_id_fkey"
            columns: ["assigned_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartment_requests_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string | null
          doc_type: string
          file_name: string | null
          file_url: string
          id: string
          uploaded_by: string | null
          verified: boolean | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          doc_type: string
          file_name?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
          verified?: boolean | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          doc_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_fields: {
        Row: {
          application_id: string
          created_at: string | null
          field_key: string
          id: string
          value: Json | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          field_key: string
          id?: string
          value?: Json | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          field_key?: string
          id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "application_fields_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_form_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          fields: Json | null
          id: string
          is_default: boolean | null
          name: string
          required_docs: Json | null
          residence_id: string
          scoring_rules: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          required_docs?: Json | null
          residence_id: string
          scoring_rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          required_docs?: Json | null
          residence_id?: string
          scoring_rules?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_form_templates_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      application_scores: {
        Row: {
          application_id: string
          computed_at: string | null
          id: string
          score_breakdown: Json | null
          score_total: number | null
        }
        Insert: {
          application_id: string
          computed_at?: string | null
          id?: string
          score_breakdown?: Json | null
          score_total?: number | null
        }
        Update: {
          application_id?: string
          computed_at?: string | null
          id?: string
          score_breakdown?: Json | null
          score_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_email: string | null
          candidate_name: string
          candidate_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes_internal: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string | null
          vacancy_id: string
        }
        Insert: {
          candidate_email?: string | null
          candidate_name: string
          candidate_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes_internal?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          vacancy_id: string
        }
        Update: {
          candidate_email?: string | null
          candidate_name?: string
          candidate_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes_internal?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          residence_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          residence_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          residence_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          residence_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          residence_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          residence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean | null
          name: string | null
          residence_id: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          name?: string | null
          residence_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          name?: string | null
          residence_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          last_contact_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          quote_id: string | null
          source: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_contact_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          quote_id?: string | null
          source?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_contact_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          quote_id?: string | null
          source?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "agency_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string | null
          doc_type: string
          email_template_id: string | null
          id: string
          notes: string | null
          received_at: string | null
          requested_by: string
          residence_id: string
          sent_at: string | null
          status: string | null
          tenant_user_id: string
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          email_template_id?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          requested_by: string
          residence_id: string
          sent_at?: string | null
          status?: string | null
          tenant_user_id: string
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          email_template_id?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          requested_by?: string
          residence_id?: string
          sent_at?: string | null
          status?: string | null
          tenant_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          is_public: boolean | null
          residence_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_public?: boolean | null
          residence_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          residence_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          footer_text: string | null
          id: string
          logo_url: string | null
          name: string
          residence_id: string | null
          subject: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name: string
          residence_id?: string | null
          subject: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          residence_id?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          id: string
          post_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      general_assemblies: {
        Row: {
          agenda: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          minutes_url: string | null
          residence_id: string
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          minutes_url?: string | null
          residence_id: string
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          minutes_url?: string | null
          residence_id?: string
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_assemblies_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          building_id: string | null
          created_at: string | null
          door: string | null
          floor: number | null
          id: string
          join_code: string | null
          lot_number: string
          notes: string | null
          owner_id: string | null
          primary_resident_id: string | null
          residence_id: string
          rooms: number | null
          surface: number | null
          tantiemes: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          door?: string | null
          floor?: number | null
          id?: string
          join_code?: string | null
          lot_number: string
          notes?: string | null
          owner_id?: string | null
          primary_resident_id?: string | null
          residence_id: string
          rooms?: number | null
          surface?: number | null
          tantiemes?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          door?: string | null
          floor?: number | null
          id?: string
          join_code?: string | null
          lot_number?: string
          notes?: string | null
          owner_id?: string | null
          primary_resident_id?: string | null
          residence_id?: string
          rooms?: number | null
          surface?: number | null
          tantiemes?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lots_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          price: number | null
          residence_id: string
          seller_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          price?: number | null
          residence_id: string
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          price?: number | null
          residence_id?: string
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      occupancies: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          lot_id: string
          start_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          lot_id: string
          start_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          lot_id?: string
          start_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occupancies_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          carrier: string | null
          collected_at: string | null
          created_at: string
          id: string
          notes: string | null
          received_at: string | null
          recipient_id: string | null
          recipient_name: string
          recipient_unit: string | null
          residence_id: string
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          collected_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          recipient_id?: string | null
          recipient_name: string
          recipient_unit?: string | null
          residence_id: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          collected_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          recipient_id?: string | null
          recipient_name?: string
          recipient_unit?: string | null
          residence_id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          lot_id: string | null
          paid_at: string | null
          payment_method: string | null
          reference: string | null
          residence_id: string
          status: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          lot_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference?: string | null
          residence_id: string
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          lot_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference?: string | null
          residence_id?: string
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string
          event_date: string | null
          event_end_date: string | null
          event_location: string | null
          id: string
          is_pinned: boolean | null
          reply_to_id: string | null
          residence_id: string
          title: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          content: string
          created_at?: string
          event_date?: string | null
          event_end_date?: string | null
          event_location?: string | null
          id?: string
          is_pinned?: boolean | null
          reply_to_id?: string | null
          residence_id: string
          title?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          content?: string
          created_at?: string
          event_date?: string | null
          event_end_date?: string | null
          event_location?: string | null
          id?: string
          is_pinned?: boolean | null
          reply_to_id?: string | null
          residence_id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          activation_price_per_residence: number
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          monthly_price_per_apartment: number
          updated_at: string | null
        }
        Insert: {
          activation_price_per_residence?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price_per_apartment?: number
          updated_at?: string | null
        }
        Update: {
          activation_price_per_residence?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price_per_apartment?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          activation_price: number
          apartments_count: number
          catalog_activation_price: number | null
          catalog_monthly_price: number | null
          client_address: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          final_activation_price: number | null
          final_monthly_price: number | null
          id: string
          monthly_price_per_apartment: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          quote_number: string
          residences_count: number
          sender_address: string | null
          sender_email: string | null
          sender_logo_url: string | null
          sender_name: string | null
          sender_phone: string | null
          sender_siren: string | null
          status: string
          stripe_payment_id: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          activation_price?: number
          apartments_count?: number
          catalog_activation_price?: number | null
          catalog_monthly_price?: number | null
          client_address?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_activation_price?: number | null
          final_monthly_price?: number | null
          id?: string
          monthly_price_per_apartment?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_number: string
          residences_count?: number
          sender_address?: string | null
          sender_email?: string | null
          sender_logo_url?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_siren?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          activation_price?: number
          apartments_count?: number
          catalog_activation_price?: number | null
          catalog_monthly_price?: number | null
          client_address?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_activation_price?: number | null
          final_monthly_price?: number | null
          id?: string
          monthly_price_per_apartment?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          quote_number?: string
          residences_count?: number
          sender_address?: string | null
          sender_email?: string | null
          sender_logo_url?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sender_siren?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      rent_receipts: {
        Row: {
          charges_amount: number | null
          created_at: string | null
          id: string
          lot_id: string | null
          payment_date: string | null
          payment_received: boolean | null
          pdf_url: string | null
          period_end: string
          period_start: string
          rent_amount: number
          residence_id: string
          sent_at: string | null
          sent_by: string | null
          tenant_user_id: string
          total_amount: number
        }
        Insert: {
          charges_amount?: number | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          payment_date?: string | null
          payment_received?: boolean | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          rent_amount: number
          residence_id: string
          sent_at?: string | null
          sent_by?: string | null
          tenant_user_id: string
          total_amount: number
        }
        Update: {
          charges_amount?: number | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          payment_date?: string | null
          payment_received?: boolean | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          rent_amount?: number
          residence_id?: string
          sent_at?: string | null
          sent_by?: string | null
          tenant_user_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "rent_receipts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_receipts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          end_time: string
          id: string
          notes: string | null
          residence_id: string
          resource_name: string
          resource_type: string | null
          start_time: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          residence_id: string
          resource_name: string
          resource_type?: string | null
          start_time: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          residence_id?: string
          resource_name?: string
          resource_type?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      residence_ai_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          fallback_contact_email: string | null
          fallback_contact_name: string | null
          fallback_contact_phone: string | null
          id: string
          residence_id: string
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          fallback_contact_email?: string | null
          fallback_contact_name?: string | null
          fallback_contact_phone?: string | null
          id?: string
          residence_id: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          fallback_contact_email?: string | null
          fallback_contact_name?: string | null
          fallback_contact_phone?: string | null
          id?: string
          residence_id?: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residence_ai_settings_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: true
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      residence_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string | null
          first_name: string | null
          id: string
          invited_by: string | null
          last_name: string | null
          message: string | null
          residence_id: string
          role: string
          status: string
          token: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          message?: string | null
          residence_id: string
          role?: string
          status?: string
          token?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          message?: string | null
          residence_id?: string
          role?: string
          status?: string
          token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residence_invitations_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      residences: {
        Row: {
          address: string | null
          agency_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          postal_code: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          permission_key: string
          residence_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key: string
          residence_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key?: string
          residence_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_recommended: boolean | null
          name: string
          phone: string | null
          rating: number | null
          residence_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_recommended?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          residence_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_recommended?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          residence_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_configs: {
        Row: {
          created_at: string | null
          from_email: string
          from_name: string | null
          host: string
          id: string
          is_active: boolean | null
          password: string
          port: number
          residence_id: string
          updated_at: string | null
          use_tls: boolean | null
          username: string
        }
        Insert: {
          created_at?: string | null
          from_email: string
          from_name?: string | null
          host: string
          id?: string
          is_active?: boolean | null
          password: string
          port?: number
          residence_id: string
          updated_at?: string | null
          use_tls?: boolean | null
          username: string
        }
        Update: {
          created_at?: string | null
          from_email?: string
          from_name?: string | null
          host?: string
          id?: string
          is_active?: boolean | null
          password?: string
          port?: number
          residence_id?: string
          updated_at?: string | null
          use_tls?: boolean | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "smtp_configs_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: true
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_documents: {
        Row: {
          created_at: string | null
          doc_type: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          occupancy_id: string | null
          residence_id: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          occupancy_id?: string | null
          residence_id: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          occupancy_id?: string | null
          residence_id?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_occupancy_id_fkey"
            columns: ["occupancy_id"]
            isOneToOne: false
            referencedRelation: "occupancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_documents_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_dossiers: {
        Row: {
          application_id: string | null
          created_at: string | null
          folder_document_category: string | null
          id: string
          notes: string | null
          residence_id: string
          tenant_user_id: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          folder_document_category?: string | null
          id?: string
          notes?: string | null
          residence_id: string
          tenant_user_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          folder_document_category?: string | null
          id?: string
          notes?: string | null
          residence_id?: string
          tenant_user_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_dossiers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_dossiers_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_dossiers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          priority: string | null
          residence_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          priority?: string | null
          residence_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          priority?: string | null
          residence_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_accounts: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          converted_at: string | null
          created_at: string
          created_by: string | null
          duration_days: number
          email: string
          expires_at: string | null
          id: string
          started_at: string | null
          status: string
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number
          email: string
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_days?: number
          email?: string
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_accounts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          building: string | null
          charges_target: number | null
          created_at: string | null
          door: string | null
          entrance: string | null
          floor: number | null
          id: string
          lot_id: string | null
          notes: string | null
          rent_target: number | null
          residence_id: string
          rooms: number | null
          status: Database["public"]["Enums"]["unit_status"] | null
          surface: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          building?: string | null
          charges_target?: number | null
          created_at?: string | null
          door?: string | null
          entrance?: string | null
          floor?: number | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          rent_target?: number | null
          residence_id: string
          rooms?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          surface?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          building?: string | null
          charges_target?: number | null
          created_at?: string | null
          door?: string | null
          entrance?: string | null
          floor?: number | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          rent_target?: number | null
          residence_id?: string
          rooms?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          surface?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          residence_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          residence_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          residence_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          availability_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          public_token: string | null
          residence_id: string
          status: Database["public"]["Enums"]["vacancy_status"] | null
          template_id: string | null
          title: string
          token_expires_at: string | null
          unit_id: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["vacancy_visibility"] | null
          visit_slots: Json | null
        }
        Insert: {
          availability_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          public_token?: string | null
          residence_id: string
          status?: Database["public"]["Enums"]["vacancy_status"] | null
          template_id?: string | null
          title: string
          token_expires_at?: string | null
          unit_id: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["vacancy_visibility"] | null
          visit_slots?: Json | null
        }
        Update: {
          availability_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          public_token?: string | null
          residence_id?: string
          status?: Database["public"]["Enums"]["vacancy_status"] | null
          template_id?: string | null
          title?: string
          token_expires_at?: string | null
          unit_id?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["vacancy_visibility"] | null
          visit_slots?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "application_form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          access_code: string | null
          arrived_at: string | null
          created_at: string
          expected_at: string | null
          host_id: string
          id: string
          left_at: string | null
          notes: string | null
          purpose: string | null
          residence_id: string
          status: string | null
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          access_code?: string | null
          arrived_at?: string | null
          created_at?: string
          expected_at?: string | null
          host_id: string
          id?: string
          left_at?: string | null
          notes?: string | null
          purpose?: string | null
          residence_id: string
          status?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          access_code?: string | null
          arrived_at?: string | null
          created_at?: string
          expected_at?: string | null
          host_id?: string
          id?: string
          left_at?: string | null
          notes?: string | null
          purpose?: string | null
          residence_id?: string
          status?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_rental: {
        Args: { _residence_id: string; _user_id: string }
        Returns: boolean
      }
      has_cs_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_residence_access: {
        Args: { _residence_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _residence_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "cs" | "resident"
      application_status:
        | "new"
        | "under_review"
        | "shortlist"
        | "accepted"
        | "rejected"
      unit_status: "occupied" | "vacant"
      vacancy_status: "draft" | "open" | "closed"
      vacancy_visibility: "internal" | "public_link"
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
      app_role: ["owner", "admin", "manager", "cs", "resident"],
      application_status: [
        "new",
        "under_review",
        "shortlist",
        "accepted",
        "rejected",
      ],
      unit_status: ["occupied", "vacant"],
      vacancy_status: ["draft", "open", "closed"],
      vacancy_visibility: ["internal", "public_link"],
    },
  },
} as const
