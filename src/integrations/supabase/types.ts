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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_logs: {
        Row: {
          id: string
          user_id: string | null
          profile_type: string | null
          session_id: string
          level: string
          category: string
          event: string
          message: string | null
          metadata: Json
          device_info: Json
          duration_ms: number | null
          error_stack: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          profile_type?: string | null
          session_id: string
          level: string
          category: string
          event: string
          message?: string | null
          metadata?: Json
          device_info?: Json
          duration_ms?: number | null
          error_stack?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          profile_type?: string | null
          session_id?: string
          level?: string
          category?: string
          event?: string
          message?: string | null
          metadata?: Json
          device_info?: Json
          duration_ms?: number | null
          error_stack?: string | null
          created_at?: string
        }
        Relationships: []
      }
      account_claim_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          processed_at: string | null
          processed_by: string | null
          selected_trainer_name: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          selected_trainer_name?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          selected_trainer_name?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          password_hash: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          password_hash?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      availabilities: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issued_date: string | null
          name: string
          organization: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          name: string
          organization?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          name?: string
          organization?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          payment_status: string | null
          registration_date: string
          status: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          payment_status?: string | null
          registration_date?: string
          status?: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          payment_status?: string | null
          registration_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "trainer_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_profiles: {
        Row: {
          avatar_url: string | null
          canton: string | null
          city_zip: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          facebook_url: string | null
          facilities_description: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          opening_hours: Json | null
          organization_name: string
          pool_types: string[] | null
          region: string | null
          street: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          canton?: string | null
          city_zip?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facebook_url?: string | null
          facilities_description?: string | null
          id: string
          instagram_url?: string | null
          linkedin_url?: string | null
          opening_hours?: Json | null
          organization_name: string
          pool_types?: string[] | null
          region?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          canton?: string | null
          city_zip?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facebook_url?: string | null
          facilities_description?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          opening_hours?: Json | null
          organization_name?: string
          pool_types?: string[] | null
          region?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          contract_type: string
          created_at: string
          document_url: string | null
          end_date: string | null
          id: string
          location: string
          start_date: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contract_type: string
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          location: string
          start_date: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contract_type?: string
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          location?: string
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flux_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flux_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "flux_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flux_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flux_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flux_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flux_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flux_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "flux_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flux_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flux_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          scheduled_at: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          scheduled_at?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          scheduled_at?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      formations: {
        Row: {
          created_at: string
          document_url: string | null
          end_date: string | null
          id: string
          organization: string
          recycling_organization: string | null
          region: Database["public"]["Enums"]["training_region"] | null
          start_date: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          organization: string
          recycling_organization?: string | null
          region?: Database["public"]["Enums"]["training_region"] | null
          start_date: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          organization?: string
          recycling_organization?: string | null
          region?: Database["public"]["Enums"]["training_region"] | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          contract_type: string
          created_at: string
          description: string
          establishment_id: string | null
          id: string
          link_url: string | null
          location: string
          title: string
          updated_at: string
        }
        Insert: {
          contract_type: string
          created_at?: string
          description: string
          establishment_id?: string | null
          id?: string
          link_url?: string | null
          location: string
          title: string
          updated_at?: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          description?: string
          establishment_id?: string | null
          id?: string
          link_url?: string | null
          location?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_posting_id: string
          message_id: string | null
          cv_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_posting_id: string
          message_id?: string | null
          cv_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_posting_id?: string
          message_id?: string | null
          cv_url?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "internal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          notify_formations: boolean | null
          notify_job_offers: boolean | null
          notify_messages: boolean | null
          notify_recycling: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_formations?: boolean | null
          notify_job_offers?: boolean | null
          notify_messages?: boolean | null
          notify_recycling?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_formations?: boolean | null
          notify_job_offers?: boolean | null
          notify_messages?: boolean | null
          notify_recycling?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_status: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          profile_type_selected: boolean | null
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id: string
          profile_type_selected?: boolean | null
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          profile_type_selected?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biography: string | null
          birth_date: string | null
          canton: string | null
          city_zip: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          profile_type: Database["public"]["Enums"]["profile_type"] | null
          profile_type_selected: boolean | null
          street: string | null
          type: Database["public"]["Enums"]["profile_type"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biography?: string | null
          birth_date?: string | null
          canton?: string | null
          city_zip?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          profile_type_selected?: boolean | null
          street?: string | null
          type?: Database["public"]["Enums"]["profile_type"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biography?: string | null
          birth_date?: string | null
          canton?: string | null
          city_zip?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"] | null
          profile_type_selected?: boolean | null
          street?: string | null
          type?: Database["public"]["Enums"]["profile_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          player_id: string
          platform: string
          profile_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          player_id: string
          platform?: string
          profile_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          player_id?: string
          platform?: string
          profile_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rescuer_profiles: {
        Row: {
          availability_status: boolean | null
          avatar_url: string | null
          canton: string | null
          created_at: string
          first_name: string | null
          id: string
          is_always_available: boolean | null
          last_name: string | null
          phone_visible: boolean | null
          preferred_locations: string[] | null
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          availability_status?: boolean | null
          avatar_url?: string | null
          canton?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          is_always_available?: boolean | null
          last_name?: string | null
          phone_visible?: boolean | null
          preferred_locations?: string[] | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          availability_status?: boolean | null
          avatar_url?: string | null
          canton?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_always_available?: boolean | null
          last_name?: string | null
          phone_visible?: boolean | null
          preferred_locations?: string[] | null
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rescuer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section_certifications: {
        Row: {
          certification_name: string
          created_at: string
          establishment_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          certification_name: string
          created_at?: string
          establishment_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          certification_name?: string
          created_at?: string
          establishment_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_certifications_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          establishment_id: string | null
          event_type: string
          id: string
          location: string | null
          sss_redirect_url: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          establishment_id?: string | null
          event_type: string
          id?: string
          location?: string | null
          sss_redirect_url?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          establishment_id?: string | null
          event_type?: string
          id?: string
          location?: string | null
          sss_redirect_url?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_events_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      section_waiting_lists: {
        Row: {
          created_at: string
          establishment_id: string | null
          event_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          establishment_id?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          establishment_id?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_waiting_lists_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_waiting_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "section_events"
            referencedColumns: ["id"]
          },
        ]
      }
      sss_formations_cache: {
        Row: {
          abbreviation: string | null
          active: boolean | null
          created_at: string | null
          debut: string | null
          fin: string | null
          id: number
          lieu: string | null
          organisateur: string | null
          places: string | null
          places_color: string | null
          places_status: string | null
          scraped_at: string | null
          titre: string
          url: string | null
        }
        Insert: {
          abbreviation?: string | null
          active?: boolean | null
          created_at?: string | null
          debut?: string | null
          fin?: string | null
          id?: number
          lieu?: string | null
          organisateur?: string | null
          places?: string | null
          places_color?: string | null
          places_status?: string | null
          scraped_at?: string | null
          titre: string
          url?: string | null
        }
        Update: {
          abbreviation?: string | null
          active?: boolean | null
          created_at?: string | null
          debut?: string | null
          fin?: string | null
          id?: number
          lieu?: string | null
          organisateur?: string | null
          places?: string | null
          places_color?: string | null
          places_status?: string | null
          scraped_at?: string | null
          titre?: string
          url?: string | null
        }
        Relationships: []
      }
      trainer_courses: {
        Row: {
          created_at: string
          current_participants: number
          date: string
          description: string | null
          end_time: string | null
          id: string
          location: string
          max_participants: number
          price: number | null
          start_time: string | null
          status: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_participants?: number
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          location: string
          max_participants?: number
          price?: number | null
          start_time?: string | null
          status?: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_participants?: number
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string
          max_participants?: number
          price?: number | null
          start_time?: string | null
          status?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_courses_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_profiles: {
        Row: {
          availability_status: boolean | null
          avatar_url: string | null
          canton: string | null
          certifications: string[] | null
          city_zip: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          first_name: string | null
          id: string
          instagram_url: string | null
          is_always_available: boolean | null
          last_name: string | null
          linkedin_url: string | null
          organization_name: string
          region: Database["public"]["Enums"]["training_region"] | null
          street: string | null
          training_specialties: string[] | null
          updated_at: string
          website: string | null
          years_of_experience: number | null
        }
        Insert: {
          availability_status?: boolean | null
          avatar_url?: string | null
          canton?: string | null
          certifications?: string[] | null
          city_zip?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id: string
          instagram_url?: string | null
          is_always_available?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          organization_name: string
          region?: Database["public"]["Enums"]["training_region"] | null
          street?: string | null
          training_specialties?: string[] | null
          updated_at?: string
          website?: string | null
          years_of_experience?: number | null
        }
        Update: {
          availability_status?: boolean | null
          avatar_url?: string | null
          canton?: string | null
          certifications?: string[] | null
          city_zip?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          instagram_url?: string | null
          is_always_available?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          organization_name?: string
          region?: Database["public"]["Enums"]["training_region"] | null
          street?: string | null
          training_specialties?: string[] | null
          updated_at?: string
          website?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_students: {
        Row: {
          certification_issued: boolean | null
          created_at: string
          id: string
          student_id: string
          trainer_id: string
          training_date: string
          training_type: string
          updated_at: string
        }
        Insert: {
          certification_issued?: boolean | null
          created_at?: string
          id?: string
          student_id: string
          trainer_id: string
          training_date: string
          training_type: string
          updated_at?: string
        }
        Update: {
          certification_issued?: boolean | null
          created_at?: string
          id?: string
          student_id?: string
          trainer_id?: string
          training_date?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_students_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_status: {
        Row: {
          created_at: string | null
          id: string
          last_seen_formations_at: string | null
          last_seen_jobs_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen_formations_at?: string | null
          last_seen_jobs_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen_formations_at?: string | null
          last_seen_jobs_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_stats: {
        Row: {
          action: string | null
          action_count: number | null
          admin_email: string | null
          last_action_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_super_admin: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_password_hash: string
          p_user_id: string
        }
        Returns: Json
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      decode_unicode_escapes: { Args: { text_input: string }; Returns: string }
    }
    Enums: {
      profile_type: "maitre_nageur" | "formateur" | "etablissement"
      training_region:
        | "nyon_la_cote"
        | "geneve"
        | "lausanne"
        | "morges"
        | "vaud"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      profile_type: ["maitre_nageur", "formateur", "etablissement"],
      training_region: ["nyon_la_cote", "geneve", "lausanne", "morges", "vaud"],
    },
  },
} as const
