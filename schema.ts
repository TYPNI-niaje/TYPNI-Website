[?25l
    Select a project:                                                                                                       
                                                                                                                            
  >  1. dzboflywwzwgymjkcvkb [name: TYPNI BACKEND, org: angctemlfjassmnsllxv, region: eu-central-1]                         
    2. lkgqmfqtxpbvwrsguwka [name: clintonkiptooturgut@gmail.com's Project, org: abqnafgxjbahokydwbzj, region: eu-central-1]
                                                                                                                            
                                                                                                                            
    ↑/k up • ↓/j down • / filter • q quit • ? more                                                                          
                                                                                                                            [0D[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[0D[2K
    Select a project:                                                                                                        
                                                                                                                             
    1. dzboflywwzwgymjkcvkb [name: TYPNI BACKEND, org: angctemlfjassmnsllxv, region: eu-central-1]                           
  >  2. lkgqmfqtxpbvwrsguwka [name: clintonkiptooturgut@gmail.com's Project, org: abqnafgxjbahokydwbzj, region: eu-central-1]
                                                                                                                             
                                                                                                                             
    ↑/k up • ↓/j down • / filter • q quit • ? more                                                                           
                                                                                                                             [0D[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[2K[1A[0D[2K [0D[2K[?25h[?1002l[?1003l[?1006lexport type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          publish_date: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          excerpt: string
          id?: string
          publish_date?: string | null
          status: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          publish_date?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          registration_date: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          registration_date?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          registration_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          capacity: number | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          location: string
          organizer_id: string | null
          registration_deadline: string | null
          start_date: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location: string
          organizer_id?: string | null
          registration_deadline?: string | null
          start_date: string
          status: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          organizer_id?: string | null
          registration_deadline?: string | null
          start_date?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          education_level: string | null
          full_name: string | null
          gender: string | null
          id: string
          id_number: string | null
          is_employed: boolean | null
          phone_number: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          id_number?: string | null
          is_employed?: boolean | null
          phone_number?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          education_level?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          is_employed?: boolean | null
          phone_number?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users: {
        Row: {
          email: string | null
          full_name: string | null
          id: string | null
          profile_id: string | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
