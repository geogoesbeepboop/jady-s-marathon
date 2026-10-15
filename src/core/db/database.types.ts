
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "agenda_item_audiences": {
                  Row: {
                    "agenda_item_id": string,"audience_id": string,"event_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda_item_id": string,"audience_id": string,"event_id": string
                  }
                  Update: {
                    "agenda_item_id"?: string,"audience_id"?: string,"event_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_item_audiences_agenda_item_id_event_id_fkey"
      columns: ["agenda_item_id","event_id"]
isOneToOne: false
      referencedRelation: "agenda_items"
      referencedColumns: ["id","event_id"]
    },{
      foreignKeyName: "agenda_item_audiences_audience_id_event_id_fkey"
      columns: ["audience_id","event_id"]
isOneToOne: false
      referencedRelation: "audiences"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"agenda_items": {
                  Row: {
                    "details": string | null,"dress_code": string | null,"ends_at": string | null,"event_id": string,"id": string,"key": string,"place_id": string | null,"starts_at": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "details"?: string | null,"dress_code"?: string | null,"ends_at"?: string | null,"event_id": string,"id"?: string,"key": string,"place_id"?: string | null,"starts_at": string,"title": string
                  }
                  Update: {
                    "details"?: string | null,"dress_code"?: string | null,"ends_at"?: string | null,"event_id"?: string,"id"?: string,"key"?: string,"place_id"?: string | null,"starts_at"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_items_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "agenda_items_place_id_event_id_fkey"
      columns: ["place_id","event_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"audience_members": {
                  Row: {
                    "audience_id": string,"event_id": string,"person_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience_id": string,"event_id": string,"person_id": string
                  }
                  Update: {
                    "audience_id"?: string,"event_id"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audience_members_audience_id_event_id_fkey"
      columns: ["audience_id","event_id"]
isOneToOne: false
      referencedRelation: "audiences"
      referencedColumns: ["id","event_id"]
    },{
      foreignKeyName: "audience_members_person_id_event_id_fkey"
      columns: ["person_id","event_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"audiences": {
                  Row: {
                    "event_id": string,"id": string,"key": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"id"?: string,"key": string,"name": string
                  }
                  Update: {
                    "event_id"?: string,"id"?: string,"key"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audiences_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string,"ends_on": string,"id": string,"name": string,"slug": string,"starts_on": string,"theme": NonNullable<Json>,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_on": string,"id"?: string,"name": string,"slug": string,"starts_on": string,"theme"?: NonNullable<Json>,"timezone": string
                  }
                  Update: {
                    "created_at"?: string,"ends_on"?: string,"id"?: string,"name"?: string,"slug"?: string,"starts_on"?: string,"theme"?: NonNullable<Json>,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"join_tokens": {
                  Row: {
                    "created_at": string,"person_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"person_id": string,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"person_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "join_tokens_person_id_fkey"
      columns: ["person_id"]
isOneToOne: true
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"marathon_cheer_claims": {
                  Row: {
                    "created_at": string,"event_id": string,"person_id": string,"place_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"event_id": string,"person_id": string,"place_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"person_id"?: string,"place_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "marathon_cheer_claims_person_id_event_id_fkey"
      columns: ["person_id","event_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id","event_id"]
    },{
      foreignKeyName: "marathon_cheer_claims_place_id_event_id_fkey"
      columns: ["place_id","event_id"]
isOneToOne: false
      referencedRelation: "marathon_cheer_spots"
      referencedColumns: ["place_id","event_id"]
    }
                  ]
                },"marathon_cheer_spots": {
                  Row: {
                    "event_id": string,"miles": (number)[],"place_id": string,"tip": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"miles": (number)[],"place_id": string,"tip"?: string | null
                  }
                  Update: {
                    "event_id"?: string,"miles"?: (number)[],"place_id"?: string,"tip"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "marathon_cheer_spots_place_id_event_id_fkey"
      columns: ["place_id","event_id"]
isOneToOne: true
      referencedRelation: "places"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"marathon_races": {
                  Row: {
                    "course": Json | null,"distance_miles": number,"event_id": string,"name": string,"tracker_note": string | null,"tracker_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "course"?: Json | null,"distance_miles"?: number,"event_id": string,"name": string,"tracker_note"?: string | null,"tracker_url"?: string | null
                  }
                  Update: {
                    "course"?: Json | null,"distance_miles"?: number,"event_id"?: string,"name"?: string,"tracker_note"?: string | null,"tracker_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "marathon_races_event_id_fkey"
      columns: ["event_id"]
isOneToOne: true
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"marathon_runners": {
                  Row: {
                    "bib": string | null,"corral": string | null,"event_id": string,"fade_percent": number,"pace_seconds_per_mile": number,"person_id": string,"starts_at": string,"tracker_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bib"?: string | null,"corral"?: string | null,"event_id": string,"fade_percent"?: number,"pace_seconds_per_mile": number,"person_id": string,"starts_at": string,"tracker_url"?: string | null
                  }
                  Update: {
                    "bib"?: string | null,"corral"?: string | null,"event_id"?: string,"fade_percent"?: number,"pace_seconds_per_mile"?: number,"person_id"?: string,"starts_at"?: string,"tracker_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "marathon_runners_person_id_event_id_fkey"
      columns: ["person_id","event_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"people": {
                  Row: {
                    "display_name": string,"event_id": string,"id": string,"key": string,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "display_name": string,"event_id": string,"id"?: string,"key": string,"role": string
                  }
                  Update: {
                    "display_name"?: string,"event_id"?: string,"id"?: string,"key"?: string,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "people_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"person_devices": {
                  Row: {
                    "auth_user_id": string,"bound_at": string,"event_id": string,"person_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_user_id": string,"bound_at"?: string,"event_id": string,"person_id": string
                  }
                  Update: {
                    "auth_user_id"?: string,"bound_at"?: string,"event_id"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "person_devices_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_devices_person_id_event_id_fkey"
      columns: ["person_id","event_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id","event_id"]
    }
                  ]
                },"places": {
                  Row: {
                    "address": string | null,"event_id": string,"id": string,"key": string,"kind": string,"lat": number | null,"lng": number | null,"name": string,"notes": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"event_id": string,"id"?: string,"key": string,"kind": string,"lat"?: number | null,"lng"?: number | null,"name": string,"notes"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"event_id"?: string,"id"?: string,"key"?: string,"kind"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string,"notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_see_agenda_item":
{ Args: { "p_event_id": string,"p_item_id": string }; Returns: boolean
                           },
"is_event_member":
{ Args: { "p_event_id": string }; Returns: boolean
                           },
"my_person_id":
{ Args: { "p_event_id": string }; Returns: string
                           },
"preview_join_token":
{ Args: { "p_token": string }; Returns: {
              "display_name": string,"event_name": string,"theme": Json
            }[]
                           },
"redeem_join_token":
{ Args: { "p_token": string }; Returns: string
                           },
"seed_event":
{ Args: { "p_rotate"?: (string)[],"p_seed": Json,"p_token_hashes": Json }; Returns: {
              "person_key": string
            }[]
                           },
"seed_marathon":
{ Args: { "p_data": Json,"p_slug": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
