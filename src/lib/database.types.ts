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
      conversations: {
        Row: {
          id: string
          org_id: string
          seeker_id: string
          job_id: string | null
          created_at: string
          last_message_at: string
        }
        Insert: {
          id?: string
          org_id: string
          seeker_id: string
          job_id?: string | null
          created_at?: string
          last_message_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          seeker_id?: string
          job_id?: string | null
          created_at?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          read_at: string | null
          attachment_url: string | null
          attachment_name: string | null
          attachment_size: number | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          read_at?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          read_at?: string | null
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_events: {
        Row: {
          actor_user_id: string
          application_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          actor_user_id: string
          application_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string
          application_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "application_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          employer_notes: string | null
          id: string
          is_favorite: boolean
          job_id: string
          org_id: string
          resume_doc_id: string | null
          screening_answers: Json
          seeker_user_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          is_favorite?: boolean
          job_id: string
          org_id: string
          resume_doc_id?: string | null
          screening_answers?: Json
          seeker_user_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          is_favorite?: boolean
          job_id?: string
          org_id?: string
          resume_doc_id?: string | null
          screening_answers?: Json
          seeker_user_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_doc_id_fkey"
            columns: ["resume_doc_id"]
            isOneToOne: false
            referencedRelation: "seeker_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_seeker_user_id_fkey"
            columns: ["seeker_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          earned_this_month: number | null
          id: string
          next_tier_in: number | null
          spent_this_month: number | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          earned_this_month?: number | null
          id?: string
          next_tier_in?: number | null
          spent_this_month?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          earned_this_month?: number | null
          id?: string
          next_tier_in?: number | null
          spent_this_month?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hides: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_hides_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_hides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_saves: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saves_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          benefits: Json
          city: string | null
          closed_at: string | null
          country: string | null
          created_at: string
          currency: string | null
          dental_requirements: Json
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          internship_available: boolean | null
          new_grad_welcome: boolean
          org_id: string
          published_at: string | null
          requirements: string | null
          responsibilities: string | null
          role_type: Database["public"]["Enums"]["role_type"]
          salary_max: number | null
          salary_min: number | null
          shift_type: string | null
          specialty_tags: string[]
          status: Database["public"]["Enums"]["job_status"]
          title: string
          slug: string | null
          training_provided: boolean
          updated_at: string
        }
        Insert: {
          benefits?: Json
          city?: string | null
          closed_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          dental_requirements?: Json
          description: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          internship_available?: boolean | null
          new_grad_welcome?: boolean
          org_id: string
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          role_type?: Database["public"]["Enums"]["role_type"]
          salary_max?: number | null
          salary_min?: number | null
          shift_type?: string | null
          specialty_tags?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          slug?: string | null
          training_provided?: boolean
          updated_at?: string
        }
        Update: {
          benefits?: Json
          city?: string | null
          closed_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          dental_requirements?: Json
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          internship_available?: boolean | null
          new_grad_welcome?: boolean
          org_id?: string
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          role_type?: Database["public"]["Enums"]["role_type"]
          salary_max?: number | null
          salary_min?: number | null
          shift_type?: string | null
          specialty_tags?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          slug?: string | null
          training_provided?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          max_uses: number | null
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          status: string
          token: string
          used_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          max_uses?: number | null
          org_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          status?: string
          token?: string
          used_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          max_uses?: number | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          status?: string
          token?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          member_role: Database["public"]["Enums"]["org_member_role"]
          org_id: string
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          member_role?: Database["public"]["Enums"]["org_member_role"]
          org_id: string
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          member_role?: Database["public"]["Enums"]["org_member_role"]
          org_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          org_name: string
          org_type: Database["public"]["Enums"]["org_type"]
          owner_user_id: string
          postcode: string | null
          state: string | null
          updated_at: string
          verified_status: Database["public"]["Enums"]["verified_status"]
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          org_name: string
          org_type?: Database["public"]["Enums"]["org_type"]
          owner_user_id: string
          postcode?: string | null
          state?: string | null
          updated_at?: string
          verified_status?: Database["public"]["Enums"]["verified_status"]
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          org_name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          owner_user_id?: string
          postcode?: string | null
          state?: string | null
          updated_at?: string
          verified_status?: Database["public"]["Enums"]["verified_status"]
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          user_id: string
          email: string
          name: string | null
          account_type: 'individual' | 'company' | 'admin' | null
          phone: string | null
          position: string | null
          company_name: string | null
          created_at: string
          updated_at: string
          avatar_url: string | null
          background_url: string | null
          clinic_id: string | null
          status: string | null
        }
        Insert: {
          user_id: string
          email: string
          name?: string | null
          account_type?: 'individual' | 'company' | 'admin' | null
          phone?: string | null
          position?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          background_url?: string | null
          clinic_id?: string | null
          status?: string | null
        }
        Update: {
          user_id?: string
          email?: string
          name?: string | null
          account_type?: 'individual' | 'company' | 'admin' | null
          phone?: string | null
          position?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          background_url?: string | null
          clinic_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      seeker_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          is_default: boolean
          storage_path: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          is_default?: boolean
          storage_path: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          is_default?: boolean
          storage_path?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seeker_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seeker_profiles: {
        Row: {
          bio: string | null
          clinical_exposures: Json | null
          created_at: string
          education_level: string | null
          expected_graduation_date: string | null
          headline: string | null
          license_status: string | null
          preferred_locations: Json | null
          primary_role: Database["public"]["Enums"]["role_type"]
          program: string | null
          school_name: string | null
          seeker_type: Database["public"]["Enums"]["seeker_type"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          clinical_exposures?: Json | null
          created_at?: string
          education_level?: string | null
          expected_graduation_date?: string | null
          headline?: string | null
          license_status?: string | null
          preferred_locations?: Json | null
          primary_role?: Database["public"]["Enums"]["role_type"]
          program?: string | null
          school_name?: string | null
          seeker_type?: Database["public"]["Enums"]["seeker_type"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          clinical_exposures?: Json | null
          created_at?: string
          education_level?: string | null
          expected_graduation_date?: string | null
          headline?: string | null
          license_status?: string | null
          preferred_locations?: Json | null
          primary_role?: Database["public"]["Enums"]["role_type"]
          program?: string | null
          school_name?: string | null
          seeker_type?: Database["public"]["Enums"]["seeker_type"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seeker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seeker_skills: {
        Row: {
          id: string
          level: string
          skill_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: string
          skill_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: string
          skill_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seeker_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seeker_specialty_interests: {
        Row: {
          id: string
          priority: number
          specialty_tag: string
          user_id: string
        }
        Insert: {
          id?: string
          priority?: number
          specialty_tag: string
          user_id: string
        }
        Update: {
          id?: string
          priority?: number
          specialty_tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seeker_specialty_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_aliases: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_aliases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          description: string
          id: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          description: string
          id?: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          description?: string
          id?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "employer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_invite_details: {
        Args: {
          invite_token: string
        }
        Returns: {
          org_name: string
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          inviter_name: string
          is_valid: boolean
        }[]
      }
      accept_invite: {
        Args: {
          invite_token: string
        }
        Returns: Json
      }
    }
    Enums: {
      application_status:
      | "applied"
      | "shortlisted"
      | "interview"
      | "offer"
      | "hired"
      | "rejected"
      | "withdrawn"
      doc_type:
      | "resume"
      | "certificate"
      | "transcript"
      | "recommendation"
      | "license"
      | "other"
      employment_type:
      | "full_time"
      | "part_time"
      | "internship"
      | "contract"
      | "temporary"
      experience_level: "entry" | "junior" | "mid" | "senior"
      job_status: "draft" | "published" | "paused" | "closed"
      member_status: "active" | "invited" | "disabled"
      org_member_role: "owner" | "hr" | "manager"
      org_type: "clinic" | "lab" | "dental_group" | "supplier" | "other"
      role_type:
      | "dentist_gp"
      | "dentist_specialist"
      | "dental_assistant"
      | "dental_nurse"
      | "dental_hygienist"
      | "dental_therapist"
      | "receptionist"
      | "treatment_coordinator"
      | "lab_technician"
      | "clinic_manager"
      | "sterilization_technician"
      | "other"
      seeker_type: "student" | "fresh_grad" | "professional"
      user_role: "seeker" | "employer" | "admin"
      verified_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

type SchemaName = Exclude<keyof Database, "__InternalSupabase">

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: SchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: SchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: SchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: SchemaName },
  EnumName extends PublicEnumNameOrOptions extends { schema: SchemaName }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: SchemaName }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: SchemaName },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: SchemaName
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: SchemaName }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
