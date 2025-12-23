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
