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
export type QuoteStatus =
  | "draft"
  | "sent"
  | "approved"
  | "declined"
  | "expired";

/** Shape of each entry in quotes.line_items (jsonb). Money in integer cents. */
export type QuoteLineItem = {
  description: string;
  qty: number;
  rate_cents: number;
  total_cents: number;
  price_item_id?: string | null;
};

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
      quotes: {
        Row: {
          id: string;
          client_id: string;
          status: QuoteStatus;
          line_items: QuoteLineItem[];
          subtotal_cents: number;
          tax_rate: number;
          tax_cents: number;
          total_cents: number;
          notes: string | null;
          public_token: string;
          valid_until: string | null;
          sent_at: string | null;
          approved_at: string | null;
          declined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          status?: QuoteStatus;
          line_items?: QuoteLineItem[];
          subtotal_cents?: number;
          tax_rate?: number;
          tax_cents?: number;
          total_cents?: number;
          notes?: string | null;
          public_token?: string;
          valid_until?: string | null;
          sent_at?: string | null;
          approved_at?: string | null;
          declined_at?: string | null;
        };
        Update: {
          client_id?: string;
          status?: QuoteStatus;
          line_items?: QuoteLineItem[];
          subtotal_cents?: number;
          tax_rate?: number;
          tax_cents?: number;
          total_cents?: number;
          notes?: string | null;
          public_token?: string;
          valid_until?: string | null;
          sent_at?: string | null;
          approved_at?: string | null;
          declined_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
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
      quote_status: QuoteStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};

// Convenience row aliases.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type PriceItem = Database["public"]["Tables"]["price_items"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
