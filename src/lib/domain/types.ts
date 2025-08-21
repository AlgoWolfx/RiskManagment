// Core domain types for the trading application

export type AccountType = "PreFunded" | "Funded";

export type TradeSide = "LONG" | "SHORT";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  current_balance: number;
  risk_current_pct: number;
  created_at: string;
  updated_at: string;
  
  // PreFunded specific
  funded_threshold?: number;
  
  // Funded specific
  daily_loss_limit?: number;
  max_loss_amount?: number;
  profit_target?: number;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  side: TradeSide;
  entry_price: number;
  exit_price: number;
  position_size?: number;
  pnl_amount: number;
  pnl_pct?: number;
  risk_used_pct: number;
  note?: string;
  screenshot_url?: string;
  closed_at: string;
  created_at: string;
}

// Computed values from account state
export interface AccountMetrics {
  equity: number;
  daily_risk_amount: number;
  max_loss_reached: boolean;
  daily_loss_limit_reached: boolean;
  remaining_to_funded?: number;
  remaining_to_profit_target?: number;
}

// UI State types
export interface MinimumRiskDialog {
  shown: boolean;
  dismissed_at?: string;
}

// Repository interfaces
export interface AccountRepository {
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  create(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account>;
  update(id: string, updates: Partial<Account>): Promise<Account>;
  delete(id: string): Promise<void>;
}

export interface TradeRepository {
  getByAccountId(accountId: string, limit?: number, offset?: number): Promise<Trade[]>;
  getById(id: string): Promise<Trade | null>;
  create(trade: Omit<Trade, 'id' | 'created_at'>): Promise<Trade>;
  update(id: string, updates: Partial<Trade>): Promise<Trade>;
  delete(id: string): Promise<void>;
  getTradesByDateRange(accountId: string, startDate: string, endDate: string): Promise<Trade[]>;
}

// Form schemas types
export interface CreateAccountFormData {
  name: string;
  type: AccountType;
  starting_balance: number;
  funded_threshold?: number;
  daily_loss_limit?: number;
  max_loss_amount?: number;
  profit_target?: number;
}

export interface CreateTradeFormData {
  symbol: string;
  side: TradeSide;
  entry_price: number;
  exit_price: number;
  position_size?: number;
  pnl_amount: number;
  pnl_pct?: number;
  risk_used_pct: number;
  note?: string;
  screenshot_url?: string;
  closed_at: string;
}

// Calendar data
export interface DailyTradeData {
  date: string;
  trade_count: number;
  net_pnl: number;
}