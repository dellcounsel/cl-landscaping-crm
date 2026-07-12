/**
 * Database types for FieldBook. Hand-maintained to match supabase/migrations.
 * Extended milestone-by-milestone (quotes, jobs, invoices, payments, settings).
 *
 * When the schema stabilizes you can regenerate this with:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type UserRole = "owner" | "crew";
export type PriceUnit = "flat" | "hour" | "yard" | "sqft";
export type ClientStatus = "active" | "inactive";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          billing_address: string | null;
          property_address: string | null;
          notes: string | null;
          tags: string[];
          status: ClientStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          billing_address?: string | null;
          property_address?: string | null;
          notes?: string | null;
          tags?: string[];
          status?: ClientStatus;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          billing_address?: string | null;
          property_address?: string | null;
          notes?: string | null;
          tags?: string[];
          status?: ClientStatus;
        };
        Relationships: [];
      };
      price_items: {
        Row: {
          id: string;
          name: string;
          unit: PriceUnit;
          default_rate_cents: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit?: PriceUnit;
          default_rate_cents?: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          unit?: PriceUnit;
          default_rate_cents?: number;
          active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      app_role: {
        Args: Record<never, never>;
        Returns: UserRole;
      };
      is_owner: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      price_unit: PriceUnit;
    };
    CompositeTypes: Record<never, never>;
  };
};

// Convenience row aliases.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type PriceItem = Database["public"]["Tables"]["price_items"]["Row"];
