// Supabase implementation of repositories
import { supabase, Database } from '../supabase';
import { Account, Trade, AccountRepository, TradeRepository, TradeSide, TradeType, PreFundedAccount, FundedAccount } from '../domain/types';

// Type helpers for Supabase
type SupabasePreFundedAccount = {
  id: string;
  name: string;
  starting_balance: number;
  current_balance: number;
  risk_current_pct: number;
  funded_threshold: number;
  daily_loss_limit: number;
  max_loss_amount: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
};

type SupabaseFundedAccount = {
  id: string;
  name: string;
  starting_balance: number;
  current_balance: number;
  risk_current_pct: number;
  daily_loss_limit: number;
  max_loss_amount: number;
  profit_target: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
};

type SupabaseTrade = Database['public']['Tables']['trades']['Row'] & {
  account_type: string;
};
type SupabaseTradeInsert = Database['public']['Tables']['trades']['Insert'] & {
  account_type: string;
};
type SupabaseTradeUpdate = Database['public']['Tables']['trades']['Update'] & {
  account_type?: string;
};

// Helper functions to convert between domain types and Supabase types
function supabasePreFundedAccountToAccount(account: SupabasePreFundedAccount): PreFundedAccount {
  return {
    id: account.id,
    name: account.name,
    type: 'PreFunded',
    starting_balance: account.starting_balance,
    current_balance: account.current_balance,
    risk_current_pct: account.risk_current_pct,
    funded_threshold: account.funded_threshold,
    daily_loss_limit: account.daily_loss_limit,
    max_loss_amount: account.max_loss_amount,
    created_at: account.created_at,
    updated_at: account.updated_at,
    user_id: account.user_id,
  };
}

function supabaseFundedAccountToAccount(account: SupabaseFundedAccount): FundedAccount {
  return {
    id: account.id,
    name: account.name,
    type: 'Funded',
    starting_balance: account.starting_balance,
    current_balance: account.current_balance,
    risk_current_pct: account.risk_current_pct,
    daily_loss_limit: account.daily_loss_limit,
    max_loss_amount: account.max_loss_amount,
    profit_target: account.profit_target,
    created_at: account.created_at,
    updated_at: account.updated_at,
    user_id: account.user_id,
  };
}

function prefundedAccountToSupabaseInsert(account: Omit<PreFundedAccount, 'id' | 'created_at' | 'updated_at'>): Omit<SupabasePreFundedAccount, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: account.name,
    starting_balance: account.starting_balance,
    current_balance: account.current_balance,
    risk_current_pct: account.risk_current_pct,
    funded_threshold: account.funded_threshold,
    daily_loss_limit: account.daily_loss_limit,
    max_loss_amount: account.max_loss_amount,
  };
}

function fundedAccountToSupabaseInsert(account: Omit<FundedAccount, 'id' | 'created_at' | 'updated_at'>): Omit<SupabaseFundedAccount, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: account.name,
    starting_balance: account.starting_balance,
    current_balance: account.current_balance,
    risk_current_pct: account.risk_current_pct,
    daily_loss_limit: account.daily_loss_limit,
    max_loss_amount: account.max_loss_amount,
    profit_target: account.profit_target,
  };
}

function supabaseTradeToTrade(trade: SupabaseTrade): Trade {
  return {
    id: trade.id,
    account_id: trade.account_id,
    account_type: trade.account_type as "PreFunded" | "Funded",
    symbol: trade.symbol,
    side: trade.side as TradeSide,
    trade_type: trade.trade_type as TradeType,
    entry_price: trade.entry_price,
    exit_price: trade.exit_price,
    position_size: trade.position_size,
    pnl_amount: trade.pnl_amount,
    pnl_pct: trade.pnl_pct,
    risk_used_pct: trade.risk_used_pct,
    note: trade.note,
    screenshot_url: trade.screenshot_url,
    closed_at: trade.closed_at,
    created_at: trade.created_at,
  };
}

function tradeToSupabaseInsert(trade: Omit<Trade, 'id' | 'created_at'>): SupabaseTradeInsert {
  return {
    account_id: trade.account_id,
    account_type: trade.account_type,
    symbol: trade.symbol,
    side: trade.side,
    trade_type: trade.trade_type,
    entry_price: trade.entry_price,
    exit_price: trade.exit_price,
    position_size: trade.position_size,
    pnl_amount: trade.pnl_amount,
    pnl_pct: trade.pnl_pct,
    risk_used_pct: trade.risk_used_pct,
    note: trade.note,
    screenshot_url: trade.screenshot_url,
    closed_at: trade.closed_at,
  };
}

// Account Repository Implementation
export class SupabaseAccountRepository implements AccountRepository {
  async getAll(): Promise<Account[]> {
    // View'dan tüm hesapları al
    const { data, error } = await supabase
      .from('accounts_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data.map((account: unknown) => {
      // Önce account'un doğru yapıda olduğunu kontrol et
      const accountData = account as { type?: string };
      
      if (accountData.type === 'PreFunded') {
        // Tip dönüşümünü güvenli bir şekilde yap
        return supabasePreFundedAccountToAccount(account as unknown as SupabasePreFundedAccount);
      } else {
        // Tip dönüşümünü güvenli bir şekilde yap
        return supabaseFundedAccountToAccount(account as unknown as SupabaseFundedAccount);
      }
    });
  }

  async getById(id: string): Promise<Account | null> {
    // Önce PreFunded tablosunda ara
    let { data, error } = await supabase
      .from('prefunded_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      return supabasePreFundedAccountToAccount(data);
    }

    // Bulamazsa Funded tablosunda ara
    ({ data, error } = await supabase
      .from('funded_accounts')
      .select('*')
      .eq('id', id)
      .single());

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return supabaseFundedAccountToAccount(data);
  }

  async create(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    console.log("SupabaseAccountRepository.create çağrıldı:", accountData);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Mevcut kullanıcı:", user);
      
      if (!user) {
        console.error("Kullanıcı oturum açmamış");
        throw new Error('User not authenticated');
      }

      // Daha detaylı debug logları
      console.log("Hesap türü:", accountData.type);
      console.log("Hesap verisi:", JSON.stringify(accountData, null, 2));
      
      // Tarayıcı konsoluna da yazdır (localStorage hatası kontrolü için)
      if (typeof window !== 'undefined') {
        window.alert = function() {}; // Uyarıları engelle
        try {
          const testKey = 'supabase_test';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          console.log("localStorage erişimi başarılı");
        } catch (err) {
          console.error("localStorage erişim hatası:", err);
        }
      }

      if (accountData.type === 'PreFunded') {
        const prefundedData = prefundedAccountToSupabaseInsert(accountData as Omit<PreFundedAccount, 'id' | 'created_at' | 'updated_at'>);
        console.log("PreFunded insert verisi:", prefundedData);
        
        const insertDataWithUser = {
          ...prefundedData,
          user_id: user.id,
        };
        
        console.log("PreFunded - Supabase'e gönderilecek veri:", insertDataWithUser);
        
        const { data, error } = await supabase
          .from('prefunded_accounts')
          .insert(insertDataWithUser)
          .select()
          .single();

        if (error) {
          console.error("PreFunded insert hatası:", error);
          throw new Error(`Failed to create PreFunded account: ${error.message}`);
        }

        console.log("Oluşturulan PreFunded hesap:", data);
        return supabasePreFundedAccountToAccount(data);
      } else if (accountData.type === 'Funded') {
        // Funded hesap için özel kontroller
        const fundedAccount = accountData as FundedAccount;
        if (!fundedAccount.daily_loss_limit || !fundedAccount.max_loss_amount || !fundedAccount.profit_target) {
          console.error("Funded hesap için gerekli alanlar eksik:", { 
            daily_loss_limit: fundedAccount.daily_loss_limit, 
            max_loss_amount: fundedAccount.max_loss_amount, 
            profit_target: fundedAccount.profit_target 
          });
          throw new Error('Funded hesap için gerekli alanlar eksik');
        }
        
        const fundedData = fundedAccountToSupabaseInsert(accountData as Omit<FundedAccount, 'id' | 'created_at' | 'updated_at'>);
        console.log("Funded insert verisi:", fundedData);
        
        const insertDataWithUser = {
          ...fundedData,
          user_id: user.id,
        };
        
        console.log("Funded - Supabase'e gönderilecek veri:", insertDataWithUser);
        
        const { data, error } = await supabase
          .from('funded_accounts')
          .insert(insertDataWithUser)
          .select()
          .single();

        if (error) {
          console.error("Funded insert hatası:", error);
          throw new Error(`Failed to create Funded account: ${error.message}`);
        }

        console.log("Oluşturulan Funded hesap:", data);
        return supabaseFundedAccountToAccount(data);
      } else {
        throw new Error(`Bilinmeyen hesap türü: ${accountData.type}`);
      }
    } catch (error) {
      console.error("Hesap oluşturma işlemi sırasında hata:", error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    console.log('Repository update çağrıldı:', { id, updates });
    
    // Hesap türünü belirle
    const account = await this.getById(id);
    if (!account) {
      throw new Error('Account not found');
    }

    console.log('Güncellenecek hesap:', account);

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    console.log('Supabase\'e gönderilecek veri:', updateData);

    if (account.type === 'PreFunded') {
      console.log('PreFunded hesap güncelleniyor...');
      const { data, error } = await supabase
        .from('prefunded_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('PreFunded güncelleme hatası:', error);
        throw new Error(`Failed to update PreFunded account: ${error.message}`);
      }

      console.log('PreFunded güncelleme başarılı:', data);
      return supabasePreFundedAccountToAccount(data);
    } else {
      console.log('Funded hesap güncelleniyor...');
      const { data, error } = await supabase
        .from('funded_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Funded güncelleme hatası:', error);
        throw new Error(`Failed to update Funded account: ${error.message}`);
      }

      console.log('Funded güncelleme başarılı:', data);
      return supabaseFundedAccountToAccount(data);
    }
  }

  async delete(id: string): Promise<void> {
    // Hesap türünü belirle
    const account = await this.getById(id);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.type === 'PreFunded') {
      const { error } = await supabase
        .from('prefunded_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete PreFunded account: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('funded_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete Funded account: ${error.message}`);
      }
    }
  }
}

// Trade Repository Implementation
export class SupabaseTradeRepository implements TradeRepository {
  async getByAccountId(accountId: string, limit = 50, offset = 0): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', accountId)
      .order('closed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch trades: ${error.message}`);
    }

    return data.map(supabaseTradeToTrade);
  }

  async getById(id: string): Promise<Trade | null> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch trade: ${error.message}`);
    }

    return supabaseTradeToTrade(data);
  }

  async create(tradeData: Omit<Trade, 'id' | 'created_at'>): Promise<Trade> {
    const insertData = tradeToSupabaseInsert(tradeData);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Add user_id to insert data
    const insertDataWithUser = {
      ...insertData,
      user_id: user.id,
    };
    
    const { data, error } = await supabase
      .from('trades')
      .insert(insertDataWithUser)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trade: ${error.message}`);
    }

    return supabaseTradeToTrade(data);
  }

  async update(id: string, updates: Partial<Trade>): Promise<Trade> {
    const updateData: SupabaseTradeUpdate = {
      ...updates,
    };

    const { data, error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update trade: ${error.message}`);
    }

    return supabaseTradeToTrade(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete trade: ${error.message}`);
    }
  }

  async getTradesByDateRange(accountId: string, startDate: string, endDate: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', accountId)
      .gte('closed_at', startDate)
      .lte('closed_at', endDate)
      .order('closed_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch trades by date range: ${error.message}`);
    }

    return data.map(supabaseTradeToTrade);
  }
}

// Repository instances
export const supabaseAccountRepository = new SupabaseAccountRepository();
export const supabaseTradeRepository = new SupabaseTradeRepository();
