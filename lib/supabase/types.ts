export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: "admin" | "manager" | "employee" | "readonly"
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: "admin" | "manager" | "employee" | "readonly"
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          role?: "admin" | "manager" | "employee" | "readonly"
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          full_name: string
          document_id: string | null
          phone: string | null
          email: string | null
          hire_date: string
          contract_type: "fixed_salary" | "per_piece" | "hourly"
          base_salary: number | null
          is_active: boolean
          profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          document_id?: string | null
          phone?: string | null
          email?: string | null
          hire_date: string
          contract_type: "fixed_salary" | "per_piece" | "hourly"
          base_salary?: number | null
          is_active?: boolean
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          document_id?: string | null
          phone?: string | null
          email?: string | null
          hire_date?: string
          contract_type?: "fixed_salary" | "per_piece" | "hourly"
          base_salary?: number | null
          is_active?: boolean
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: "fabric" | "supplies" | "tools" | "machinery"
          fabric_type: string | null
          color: string | null
          quantity: number
          unit: string
          unit_price: number
          minimum_stock: number
          supplier: string | null
          notes: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: "fabric" | "supplies" | "tools" | "machinery"
          fabric_type?: string | null
          color?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          minimum_stock?: number
          supplier?: string | null
          notes?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          category?: "fabric" | "supplies" | "tools" | "machinery"
          fabric_type?: string | null
          color?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          minimum_stock?: number
          supplier?: string | null
          notes?: string | null
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          inventory_item_id: string
          movement_type: "in" | "out" | "adjustment"
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          movement_type: "in" | "out" | "adjustment"
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          total_purchases: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          total_purchases?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          total_purchases?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          id: string
          name: string
          description: string | null
          sale_price: number
          estimated_cost: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sale_price: number
          estimated_cost?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          sale_price?: number
          estimated_cost?: number | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type:
            | "low_stock"
            | "out_of_stock"
            | "order_ready"
            | "order_overdue"
            | "sale_completed"
            | "production_saved"
            | "payment_due"
            | "monthly_report"
            | "inventory_updated"
          title: string
          body: string
          metadata: Json | null
          read: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type:
            | "low_stock"
            | "out_of_stock"
            | "order_ready"
            | "order_overdue"
            | "sale_completed"
            | "production_saved"
            | "payment_due"
            | "monthly_report"
            | "inventory_updated"
          title: string
          body: string
          metadata?: Json | null
          read?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          read?: boolean
          expires_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          low_stock_threshold: number
          currency: string
          timezone: string
          company_name: string
          company_phone: string | null
          company_email: string | null
          company_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          low_stock_threshold?: number
          currency?: string
          timezone?: string
          company_name?: string
          company_phone?: string | null
          company_email?: string | null
          company_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          low_stock_threshold?: number
          currency?: string
          timezone?: string
          company_name?: string
          company_phone?: string | null
          company_email?: string | null
          company_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string | null
          action: "insert" | "update" | "delete"
          old_values: Json | null
          new_values: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id?: string | null
          action: "insert" | "update" | "delete"
          old_values?: Json | null
          new_values?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
