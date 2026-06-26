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
      app_settings: {
        Row: {
          calls_enabled: boolean
          connect_sound: string
          connect_url: string | null
          daily_message_limit_free: number
          daily_message_limit_premium: number
          disconnect_url: string | null
          id: number
          incoming_ring_url: string | null
          maintenance_message: string
          maintenance_mode: boolean
          membership_enabled: boolean
          outgoing_ring_url: string | null
          payments_enabled: boolean
          review_approved_welcome: string
          review_pending_message: string
          review_rejected_message: string
          ring_sound: string
          signups_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calls_enabled?: boolean
          connect_sound?: string
          connect_url?: string | null
          daily_message_limit_free?: number
          daily_message_limit_premium?: number
          disconnect_url?: string | null
          id?: number
          incoming_ring_url?: string | null
          maintenance_message?: string
          maintenance_mode?: boolean
          membership_enabled?: boolean
          outgoing_ring_url?: string | null
          payments_enabled?: boolean
          review_approved_welcome?: string
          review_pending_message?: string
          review_rejected_message?: string
          ring_sound?: string
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calls_enabled?: boolean
          connect_sound?: string
          connect_url?: string | null
          daily_message_limit_free?: number
          daily_message_limit_premium?: number
          disconnect_url?: string | null
          id?: number
          incoming_ring_url?: string | null
          maintenance_message?: string
          maintenance_mode?: boolean
          membership_enabled?: boolean
          outgoing_ring_url?: string | null
          payments_enabled?: boolean
          review_approved_welcome?: string
          review_pending_message?: string
          review_rejected_message?: string
          ring_sound?: string
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appeals: {
        Row: {
          created_at: string
          details: string
          email: string
          full_name: string
          id: string
          phone: string | null
          reason: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          reason?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          reason?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banned_ips: {
        Row: {
          banned_user_id: string | null
          created_at: string
          ip: string
          reason: string | null
        }
        Insert: {
          banned_user_id?: string | null
          created_at?: string
          ip: string
          reason?: string | null
        }
        Update: {
          banned_user_id?: string | null
          created_at?: string
          ip?: string
          reason?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          accepted_at: string | null
          callee_id: string
          caller_id: string
          created_at: string
          ended_at: string | null
          id: string
          status: Database["public"]["Enums"]["call_status"]
          type: Database["public"]["Enums"]["call_type"]
        }
        Insert: {
          accepted_at?: string | null
          callee_id: string
          caller_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["call_status"]
          type: Database["public"]["Enums"]["call_type"]
        }
        Update: {
          accepted_at?: string | null
          callee_id?: string
          caller_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["call_status"]
          type?: Database["public"]["Enums"]["call_type"]
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      feature_suggestions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_fingerprint: string | null
          device_label: string | null
          id: string
          ip: string | null
          is_active: boolean
          is_suspicious: boolean
          is_trusted: boolean
          last_seen_at: string
          session_ref: string | null
          suspicious_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_label?: string | null
          id?: string
          ip?: string | null
          is_active?: boolean
          is_suspicious?: boolean
          is_trusted?: boolean
          last_seen_at?: string
          session_ref?: string | null
          suspicious_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_label?: string | null
          id?: string
          ip?: string | null
          is_active?: boolean
          is_suspicious?: boolean
          is_trusted?: boolean
          last_seen_at?: string
          session_ref?: string | null
          suspicious_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      membership_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          requested_tier: Database["public"]["Enums"]["membership_tier"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["membership_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          requested_tier?: Database["public"]["Enums"]["membership_tier"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          requested_tier?: Database["public"]["Enums"]["membership_tier"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
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
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: Database["public"]["Enums"]["notification_audience"]
          body: string
          created_at: string
          created_by: string
          id: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["notification_audience"]
          body: string
          created_at?: string
          created_by: string
          id?: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      photo_access_requests: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          accept_audio_calls: boolean
          accept_video_calls: boolean
          annual_income: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_until: string | null
          block_disabled: boolean
          city: string | null
          country: string | null
          created_at: string
          created_for: string | null
          daily_message_limit_override: number | null
          date_of_birth: string | null
          disability_category:
            | Database["public"]["Enums"]["disability_category"]
            | null
          disability_percentage: number | null
          disability_verification_note: string | null
          disability_verification_status: string
          disability_verification_submitted_at: string | null
          disability_verification_url: string | null
          disability_verified: boolean
          education: string | null
          family_details: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          habits: Json | null
          id: string
          id_verification_note: string | null
          id_verification_status: string
          id_verification_submitted_at: string | null
          id_verification_url: string | null
          interests: string[] | null
          is_banned_permanent: boolean
          is_hidden: boolean
          is_profile_complete: boolean
          is_verified: boolean
          last_seen_at: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          membership_expires_at: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          mother_tongue: string | null
          occupation: string | null
          onboarding_draft: Json
          onboarding_step: number
          partner_about: string | null
          partner_max_age: number | null
          partner_min_age: number | null
          partner_preferences: string | null
          photos_private: boolean
          pin_code: string | null
          preferred_language: string
          religion: string | null
          report_disabled: boolean
          review_decided_at: string | null
          review_decided_by: string | null
          review_notes: string | null
          review_status: string
          show_online_status: boolean
          state: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          accept_audio_calls?: boolean
          accept_video_calls?: boolean
          annual_income?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          block_disabled?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_for?: string | null
          daily_message_limit_override?: number | null
          date_of_birth?: string | null
          disability_category?:
            | Database["public"]["Enums"]["disability_category"]
            | null
          disability_percentage?: number | null
          disability_verification_note?: string | null
          disability_verification_status?: string
          disability_verification_submitted_at?: string | null
          disability_verification_url?: string | null
          disability_verified?: boolean
          education?: string | null
          family_details?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          habits?: Json | null
          id: string
          id_verification_note?: string | null
          id_verification_status?: string
          id_verification_submitted_at?: string | null
          id_verification_url?: string | null
          interests?: string[] | null
          is_banned_permanent?: boolean
          is_hidden?: boolean
          is_profile_complete?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          membership_expires_at?: string | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          mother_tongue?: string | null
          occupation?: string | null
          onboarding_draft?: Json
          onboarding_step?: number
          partner_about?: string | null
          partner_max_age?: number | null
          partner_min_age?: number | null
          partner_preferences?: string | null
          photos_private?: boolean
          pin_code?: string | null
          preferred_language?: string
          religion?: string | null
          report_disabled?: boolean
          review_decided_at?: string | null
          review_decided_by?: string | null
          review_notes?: string | null
          review_status?: string
          show_online_status?: boolean
          state?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          accept_audio_calls?: boolean
          accept_video_calls?: boolean
          annual_income?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          block_disabled?: boolean
          city?: string | null
          country?: string | null
          created_at?: string
          created_for?: string | null
          daily_message_limit_override?: number | null
          date_of_birth?: string | null
          disability_category?:
            | Database["public"]["Enums"]["disability_category"]
            | null
          disability_percentage?: number | null
          disability_verification_note?: string | null
          disability_verification_status?: string
          disability_verification_submitted_at?: string | null
          disability_verification_url?: string | null
          disability_verified?: boolean
          education?: string | null
          family_details?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          habits?: Json | null
          id?: string
          id_verification_note?: string | null
          id_verification_status?: string
          id_verification_submitted_at?: string | null
          id_verification_url?: string | null
          interests?: string[] | null
          is_banned_permanent?: boolean
          is_hidden?: boolean
          is_profile_complete?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          membership_expires_at?: string | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          mother_tongue?: string | null
          occupation?: string | null
          onboarding_draft?: Json
          onboarding_step?: number
          partner_about?: string | null
          partner_max_age?: number | null
          partner_min_age?: number | null
          partner_preferences?: string | null
          photos_private?: boolean
          pin_code?: string | null
          preferred_language?: string
          religion?: string | null
          report_disabled?: boolean
          review_decided_at?: string | null
          review_decided_by?: string | null
          review_notes?: string | null
          review_status?: string
          show_online_status?: boolean
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          couple_names: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          married_on: string | null
          story: string
          updated_at: string
        }
        Insert: {
          couple_names: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          married_on?: string | null
          story: string
          updated_at?: string
        }
        Update: {
          couple_names?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          married_on?: string | null
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_ip_log: {
        Row: {
          created_at: string
          id: string
          ip: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          category: string | null
          context: string | null
          created_at: string
          evidence: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          category?: string | null
          context?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          category?: string | null
          context?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: string[] | null
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
      admin_has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      any_admin_exists: { Args: never; Returns: boolean }
      are_matched: { Args: { _a: string; _b: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      touch_last_seen: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      call_status: "ringing" | "accepted" | "declined" | "ended" | "missed"
      call_type: "audio" | "video"
      disability_category:
        | "visually_impaired"
        | "hearing_impaired"
        | "speech_impaired"
        | "locomotor"
        | "intellectual"
        | "multiple"
        | "other"
      gender: "male" | "female" | "other"
      interest_status: "pending" | "accepted" | "declined"
      marital_status: "never_married" | "divorced" | "widowed"
      membership_request_status: "pending" | "approved" | "rejected"
      membership_tier: "free" | "premium"
      notification_audience: "all" | "user"
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
      call_status: ["ringing", "accepted", "declined", "ended", "missed"],
      call_type: ["audio", "video"],
      disability_category: [
        "visually_impaired",
        "hearing_impaired",
        "speech_impaired",
        "locomotor",
        "intellectual",
        "multiple",
        "other",
      ],
      gender: ["male", "female", "other"],
      interest_status: ["pending", "accepted", "declined"],
      marital_status: ["never_married", "divorced", "widowed"],
      membership_request_status: ["pending", "approved", "rejected"],
      membership_tier: ["free", "premium"],
      notification_audience: ["all", "user"],
    },
  },
} as const
