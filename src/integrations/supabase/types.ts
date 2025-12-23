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
          name: string | null
          residence_id: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          residence_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
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
          lot_number: string
          notes: string | null
          owner_id: string | null
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
          lot_number: string
          notes?: string | null
          owner_id?: string | null
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
          lot_number?: string
          notes?: string | null
          owner_id?: string | null
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
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
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
      posts: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
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
          id?: string
          is_pinned?: boolean | null
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
          id?: string
          is_pinned?: boolean | null
          residence_id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_residence_id_fkey"
            columns: ["residence_id"]
            isOneToOne: false
            referencedRelation: "residences"
            referencedColumns: ["id"]
          },
        ]
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
      residences: {
        Row: {
          address: string | null
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
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
          created_at: string | null
          id: string
          residence_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          residence_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          residence_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
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
