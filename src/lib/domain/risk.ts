// Risk management algorithm implementation

import { Account, Trade, AccountType, AccountMetrics } from './types';

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
    // Winning trade: increase by 0.25%
    newRiskPct = Math.min(currentRiskPct + RISK_CONSTANTS.ADJUSTMENT_STEP, maxRisk);
  } else if (pnlAmount < 0) {
    // Losing trade: decrease by 0.25%
    newRiskPct = Math.max(currentRiskPct - RISK_CONSTANTS.ADJUSTMENT_STEP, RISK_CONSTANTS.MINIMUM_RISK_PCT);
  }
  // Breakeven trade: maintain current percentage
  
  return Number(newRiskPct.toFixed(2));
}

/**
 * Calculate recommended daily risk amount
 */
export function calculateDailyRiskAmount(balance: number, riskPct: number): number {
  return Number((balance * (riskPct / 100)).toFixed(2));
}

/**
 * Calculate account metrics
 */
export function calculateAccountMetrics(account: Account, trades: Trade[]): AccountMetrics {
  const dailyRiskAmount = calculateDailyRiskAmount(account.current_balance, account.risk_current_pct);
  
  const baseMetrics: AccountMetrics = {
    equity: account.current_balance,
    daily_risk_amount: dailyRiskAmount,
    max_loss_reached: false,
    daily_loss_limit_reached: false,
  };

  // PreFunded specific calculations
  if (account.type === 'PreFunded' && account.funded_threshold) {
    return {
      ...baseMetrics,
      remaining_to_funded: Math.max(0, account.funded_threshold - account.current_balance),
    };
  }

  // Funded specific calculations
  if (account.type === 'Funded') {
    const totalLoss = account.starting_balance - account.current_balance;
    
    const fundedMetrics: AccountMetrics = {
      ...baseMetrics,
      max_loss_reached: account.max_loss_amount ? totalLoss >= account.max_loss_amount : false,
      daily_loss_limit_reached: false, // Would need daily trades to calculate
    };

    if (account.profit_target) {
      fundedMetrics.remaining_to_profit_target = Math.max(0, account.profit_target - account.current_balance);
    }

    return fundedMetrics;
  }

  return baseMetrics;
}

/**
 * Update account balance after a trade
 */
export function updateAccountAfterTrade(account: Account, trade: Trade): Account {
  const newBalance = Number((account.current_balance + trade.pnl_amount).toFixed(2));
  const newRiskPct = calculateNewRiskPercentage(
    account.risk_current_pct,
    trade.pnl_amount,
    account.type
  );

  return {
    ...account,
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