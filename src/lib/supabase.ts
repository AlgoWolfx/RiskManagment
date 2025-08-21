import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pztpmbtodvlrnnofhpxb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dHBtYnRvZHZscm5ub2ZocHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDc0MTUsImV4cCI6MjA3MTIyMzQxNX0.UwVqZvKrl2GOAtCPWk150LB5rwbzMXGsJfE3G6tCmDA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
             accounts: {
         Row: {
           id: string;
           name: string;
           type: 'PreFunded' | 'Funded';
           starting_balance: number;
           current_balance: number;
           risk_current_pct: number;
           funded_threshold: number | null;
           daily_loss_limit: number | null;
           max_loss_amount: number | null;
           profit_target: number | null;
           user_id: string | null;
           created_at: string;
           updated_at: string;
         };
                 Insert: {
           id?: string;
           name: string;
           type: 'PreFunded' | 'Funded';
           starting_balance: number;
           current_balance: number;
           risk_current_pct?: number;
           funded_threshold?: number | null;
           daily_loss_limit?: number | null;
           max_loss_amount?: number | null;
           profit_target?: number | null;
           user_id?: string | null;
           created_at?: string;
           updated_at?: string;
         };
                 Update: {
           id?: string;
           name?: string;
           type?: 'PreFunded' | 'Funded';
           starting_balance?: number;
           current_balance?: number;
           risk_current_pct?: number;
           funded_threshold?: number | null;
           daily_loss_limit?: number | null;
           max_loss_amount?: number | null;
           profit_target?: number | null;
           user_id?: string | null;
           created_at?: string;
           updated_at?: string;
         };
      };
             trades: {
         Row: {
           id: string;
           account_id: string;
           symbol: string;
           side: 'LONG' | 'SHORT';
           trade_type: 'ENTRY' | 'TP' | 'SL';
           entry_price: number;
           exit_price: number;
           position_size: number | null;
           pnl_amount: number;
           pnl_pct: number | null;
           risk_used_pct: number;
           note: string | null;
           screenshot_url: string | null;
           closed_at: string;
           user_id: string | null;
           created_at: string;
         };
                 Insert: {
           id?: string;
           account_id: string;
           symbol: string;
           side: 'LONG' | 'SHORT';
           trade_type?: 'ENTRY' | 'TP' | 'SL';
           entry_price: number;
           exit_price: number;
           position_size?: number | null;
           pnl_amount: number;
           pnl_pct?: number | null;
           risk_used_pct: number;
           note?: string | null;
           screenshot_url?: string | null;
           closed_at: string;
           user_id?: string | null;
           created_at?: string;
         };
                 Update: {
           id?: string;
           account_id?: string;
           symbol?: string;
           side?: 'LONG' | 'SHORT';
           trade_type?: 'ENTRY' | 'TP' | 'SL';
           entry_price?: number;
           exit_price?: number;
           position_size?: number | null;
           pnl_amount?: number;
           pnl_pct?: number | null;
           risk_used_pct?: number;
           note?: string | null;
           screenshot_url?: string | null;
           closed_at?: string;
           user_id?: string | null;
           created_at?: string;
         };
      };
    };
  };
}
