// Risk management algorithm implementation

import { Account, Trade, AccountType, AccountMetrics } from './types';
import { riskEngine } from '../engine/riskEngine';

// Risk constants
export const RISK_CONSTANTS = {
  INITIAL_RISK_PCT: 1.00,
  MINIMUM_RISK_PCT: 0.25,
  ADJUSTMENT_STEP: 0.25,
  MAX_RISK_PCT: {
    PreFunded: 2.00,
    Funded: 1.25,
  } as const,
} as const;

/**
 * Calculate new risk percentage after a trade
 */
export function calculateNewRiskPercentage(
  currentRiskPct: number,
  pnlAmount: number,
  accountType: AccountType
): number {
  const maxRisk = RISK_CONSTANTS.MAX_RISK_PCT[accountType];
  
  let newRiskPct = currentRiskPct;
  
  if (pnlAmount > 0) {
    // Kazanç: %0.25 artır
    newRiskPct = Math.min(currentRiskPct + RISK_CONSTANTS.ADJUSTMENT_STEP, maxRisk);
  } else if (pnlAmount < 0) {
    // Zarar: %0.25 azalt
    newRiskPct = Math.max(currentRiskPct - RISK_CONSTANTS.ADJUSTMENT_STEP, RISK_CONSTANTS.MINIMUM_RISK_PCT);
  }
  // Breakeven trade: mevcut yüzdeyi koru
  
  return Number(newRiskPct.toFixed(2));
}

/**
 * Calculate daily risk amount
 */
export function calculateDailyRiskAmount(balance: number, riskPercentage: number): number {
  if (!balance || !riskPercentage) return 0;
  return Number((balance * riskPercentage / 100).toFixed(2));
}

/**
 * Calculate total progress USD from TP/SL trades only
 */
export function calculateProgressUSD(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 0;
  
  return trades
    .filter(trade => trade.trade_type === 'TP' || trade.trade_type === 'SL')
    .reduce((sum, trade) => sum + trade.pnl_amount, 0);
}

/**
 * Calculate account metrics based on scenarios
 */
export function calculateAccountMetrics(account: Account, trades: Trade[]): AccountMetrics {
  // Güvenlik kontrolü
  if (!account) {
    return {
      equity: 0,
      daily_risk_amount: 0,
      max_loss_reached: false,
      daily_loss_limit_reached: false,
      remaining_to_funded: 0,
      remaining_to_profit_target: 0,
      daily_loss_remaining: 0,
      daily_pnl: 0,
    };
  }

  const dailyRiskAmount = calculateDailyRiskAmount(account.current_balance, account.risk_current_pct);
  const progressUSD = calculateProgressUSD(trades);
  
  // Calculate daily P&L for funded accounts
  const todayTrades = getTodayTrades(trades);
  const dailyPnL = todayTrades.reduce((sum, trade) => sum + trade.pnl_amount, 0);
  const dailyLossUsed = Math.abs(Math.min(0, dailyPnL));
  
  const baseMetrics: AccountMetrics = {
    equity: account.current_balance,
    daily_risk_amount: dailyRiskAmount,
    max_loss_reached: false,
    daily_loss_limit_reached: false,
  };

  // PreFunded specific calculations
  if (account.type === 'PreFunded' && account.funded_threshold) {
    // Kalan = max(0, funded_threshold - (starting_balance + progress_usd))
    const remainingToFunded = Math.max(0, account.funded_threshold - (account.starting_balance + progressUSD));
    
    return {
      ...baseMetrics,
      remaining_to_funded: remainingToFunded,
      daily_loss_limit_reached: account.daily_loss_limit ? dailyLossUsed >= account.daily_loss_limit : false,
      daily_loss_remaining: account.daily_loss_limit ? Math.max(0, account.daily_loss_limit - dailyLossUsed) : undefined,
      daily_pnl: dailyPnL,
    };
  }

  // Funded specific calculations
  if (account.type === 'Funded') {
    const totalLoss = account.starting_balance - account.current_balance;
    const totalProfit = account.current_balance - account.starting_balance;
    
    const fundedMetrics: AccountMetrics = {
      ...baseMetrics,
      max_loss_reached: account.max_loss_amount ? totalLoss >= account.max_loss_amount : false,
      daily_loss_limit_reached: account.daily_loss_limit ? dailyLossUsed >= account.daily_loss_limit : false,
      daily_loss_remaining: account.daily_loss_limit ? Math.max(0, account.daily_loss_limit - dailyLossUsed) : undefined,
      daily_pnl: dailyPnL,
    };

    // Hedef kâr hesaplama - progress_usd kullanarak
    if (account.profit_target) {
      // Kalan = max(0, profit_target - progress_usd)
      fundedMetrics.remaining_to_profit_target = Math.max(0, account.profit_target - progressUSD);
    }

    return fundedMetrics;
  }

  return baseMetrics;
}

/**
 * Get today's trades for daily calculations
 */
function getTodayTrades(trades: Trade[]): Trade[] {
  const today = new Date().toISOString().split('T')[0];
  return trades.filter(trade => trade.closed_at.startsWith(today));
}

/**
 * Calculate advanced account metrics with risk engine
 */
export function calculateAdvancedAccountMetrics(account: Account, trades: Trade[]) {
  return riskEngine.calculateAccountRisk(account, trades);
}

/**
 * Get suggested risk for next trade
 */
export function getSuggestedRisk(account: Account, trades: Trade[]): number {
  return riskEngine.calculateSuggestedRisk(account, trades);
}

/**
 * Update account balance after a trade
 */
export function updateAccountAfterTrade(account: Account, trade: Trade): Partial<Account> {
  let newBalance = account.current_balance;
  
  // Bakiye güncelleme kuralları
  if (trade.trade_type === 'TP') {
    newBalance += trade.pnl_amount;
  } else if (trade.trade_type === 'SL') {
    newBalance += trade.pnl_amount; // pnl_amount zaten negatif
  }
  // ENTRY işlemlerinde bakiye değişmez
  
  newBalance = Number(newBalance.toFixed(2));
  
  const newRiskPct = calculateNewRiskPercentage(
    account.risk_current_pct,
    trade.pnl_amount,
    account.type
  );

  // Sadece güncellenecek alanları döndür
  return {
    current_balance: newBalance,
    risk_current_pct: newRiskPct,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Check if minimum risk dialog should be shown
 */
export function shouldShowMinimumRiskDialog(
  riskPct: number,
  lastDismissedAt?: string
): boolean {
  if (riskPct !== RISK_CONSTANTS.MINIMUM_RISK_PCT) {
    return false;
  }

  if (!lastDismissedAt) {
    return true;
  }

  // Don't show again for 24 hours after dismissal
  const dismissedTime = new Date(lastDismissedAt).getTime();
  const now = new Date().getTime();
  const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);

  return hoursElapsed >= 24;
}

/**
 * Check if celebration should be shown
 */
export function shouldShowCelebration(account: Account, trades: Trade[]): boolean {
  if (!account || !trades) return false;
  
  const metrics = calculateAccountMetrics(account, trades);
  
  if (account.type === 'PreFunded') {
    return metrics.remaining_to_funded === 0;
  } else if (account.type === 'Funded') {
    return metrics.remaining_to_profit_target === 0;
  }
  
  return false;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `%${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Format currency for Turkish locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number for Turkish locale
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Debug function to log risk engine calculations
 */
export function debugRiskCalculation(account: Account, trade: Trade, trades: Trade[]) {
  console.log('=== Risk Engine Debug ===');
  console.log('Account:', {
    id: account.id,
    name: account.name,
    type: account.type,
    starting_balance: account.starting_balance,
    current_balance: account.current_balance,
    risk_current_pct: account.risk_current_pct,
    funded_threshold: account.type === 'PreFunded' ? account.funded_threshold : undefined,
    profit_target: account.type === 'Funded' ? account.profit_target : undefined
  });
  
  console.log('New Trade:', {
    trade_type: trade.trade_type,
    pnl_amount: trade.pnl_amount,
    symbol: trade.symbol
  });
  
  const progressUSD = calculateProgressUSD(trades);
  console.log('Progress USD:', progressUSD);
  
  const accountUpdates = updateAccountAfterTrade(account, trade);
  console.log('Account Updates:', accountUpdates);
  
  const updatedAccount = {
    ...account,
    ...accountUpdates
  } as Account;
  
  const newMetrics = calculateAccountMetrics(updatedAccount, trades);
  console.log('New Metrics:', newMetrics);
  
  const shouldCelebrate = shouldShowCelebration(updatedAccount, trades);
  console.log('Should Celebrate:', shouldCelebrate);
  console.log('=== End Debug ===');
}