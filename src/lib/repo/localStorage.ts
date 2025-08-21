// localStorage implementation of repositories

import { Account, Trade, AccountRepository, TradeRepository } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const ACCOUNTS_KEY = 'trading_accounts';
const TRADES_KEY = 'trading_trades';

// Helper functions
function getStorageData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
}

function setStorageData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

// Account Repository Implementation
export class LocalStorageAccountRepository implements AccountRepository {
  async getAll(): Promise<Account[]> {
    return getStorageData<Account>(ACCOUNTS_KEY);
  }

  async getById(id: string): Promise<Account | null> {
    const accounts = await this.getAll();
    return accounts.find(account => account.id === id) || null;
  }

  async create(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const now = new Date().toISOString();
    const account: Account = {
      ...accountData,
      id: uuidv4(),
      risk_current_pct: 1.00, // Initial risk percentage
      created_at: now,
      updated_at: now,
    };

    const accounts = await this.getAll();
    accounts.push(account);
    setStorageData(ACCOUNTS_KEY, accounts);

    return account;
  }

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const accounts = await this.getAll();
    const index = accounts.findIndex(account => account.id === id);
    
    if (index === -1) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updatedAccount = {
      ...accounts[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    accounts[index] = updatedAccount;
    setStorageData(ACCOUNTS_KEY, accounts);

    return updatedAccount;
  }

  async delete(id: string): Promise<void> {
    const accounts = await this.getAll();
    const filteredAccounts = accounts.filter(account => account.id !== id);
    setStorageData(ACCOUNTS_KEY, filteredAccounts);

    // Also delete all trades for this account
    const trades = getStorageData<Trade>(TRADES_KEY);
    const filteredTrades = trades.filter(trade => trade.account_id !== id);
    setStorageData(TRADES_KEY, filteredTrades);
  }
}

// Trade Repository Implementation
export class LocalStorageTradeRepository implements TradeRepository {
  async getByAccountId(accountId: string, limit = 50, offset = 0): Promise<Trade[]> {
    const trades = getStorageData<Trade>(TRADES_KEY);
    return trades
      .filter(trade => trade.account_id === accountId)
      .sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime())
      .slice(offset, offset + limit);
  }

  async getById(id: string): Promise<Trade | null> {
    const trades = getStorageData<Trade>(TRADES_KEY);
    return trades.find(trade => trade.id === id) || null;
  }

  async create(tradeData: Omit<Trade, 'id' | 'created_at'>): Promise<Trade> {
    const trade: Trade = {
      ...tradeData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };

    const trades = getStorageData<Trade>(TRADES_KEY);
    trades.push(trade);
    setStorageData(TRADES_KEY, trades);

    return trade;
  }

  async update(id: string, updates: Partial<Trade>): Promise<Trade> {
    const trades = getStorageData<Trade>(TRADES_KEY);
    const index = trades.findIndex(trade => trade.id === id);
    
    if (index === -1) {
      throw new Error(`Trade with id ${id} not found`);
    }

    const updatedTrade = {
      ...trades[index],
      ...updates,
    };

    trades[index] = updatedTrade;
    setStorageData(TRADES_KEY, trades);

    return updatedTrade;
  }

  async delete(id: string): Promise<void> {
    const trades = getStorageData<Trade>(TRADES_KEY);
    const filteredTrades = trades.filter(trade => trade.id !== id);
    setStorageData(TRADES_KEY, filteredTrades);
  }

  async getTradesByDateRange(accountId: string, startDate: string, endDate: string): Promise<Trade[]> {
    const trades = getStorageData<Trade>(TRADES_KEY);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return trades.filter(trade => {
      if (trade.account_id !== accountId) return false;
      const tradeDate = new Date(trade.closed_at);
      return tradeDate >= start && tradeDate <= end;
    });
  }
}

// Repository instances
export const accountRepository = new LocalStorageAccountRepository();
export const tradeRepository = new LocalStorageTradeRepository();