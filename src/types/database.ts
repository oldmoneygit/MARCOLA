/**
 * @file database.ts
 * @description Tipos do banco de dados Supabase
 * @module types
 */

import type { Suggestion, SuggestionSeverity, SuggestionStatus, SuggestionType } from './analysis';
import type { Client, ClientStatus } from './client';
import type { Payment, PaymentStatus } from './financial';
import type { Ad, AdStatus, Report } from './report';

/**
 * Schema do banco de dados
 */
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'>;
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
      };
      ads: {
        Row: Ad;
        Insert: Omit<Ad, 'id' | 'created_at'>;
        Update: Partial<Omit<Ad, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
      };
      suggestions: {
        Row: Suggestion;
        Insert: Omit<Suggestion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Suggestion, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Enums: {
      client_status: ClientStatus;
      ad_status: AdStatus;
      payment_status: PaymentStatus;
      suggestion_severity: SuggestionSeverity;
      suggestion_type: SuggestionType;
      suggestion_status: SuggestionStatus;
    };
  };
}

/**
 * Tipo helper para extrair Row de uma tabela
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Tipo helper para extrair Insert de uma tabela
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Tipo helper para extrair Update de uma tabela
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
