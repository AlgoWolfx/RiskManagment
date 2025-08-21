// Repository exports - Supabase only implementation
import { 
  supabaseAccountRepository, 
  supabaseTradeRepository 
} from './supabaseRepository';
import { AccountRepository, TradeRepository } from '../domain/types';

// Export Supabase repositories directly
export const accountRepository: AccountRepository = supabaseAccountRepository;
export const tradeRepository: TradeRepository = supabaseTradeRepository;

// Export Supabase implementations directly
export { 
  supabaseAccountRepository,
  supabaseTradeRepository 
};
