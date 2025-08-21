// Risk Management Engine
import { Account, Trade, AccountMetrics } from '../domain/types';

export interface RiskEngineConfig {
  // Global risk settings
  maxDailyRiskPct: number; // Maximum daily risk percentage (default: 2%)
  maxConsecutiveLosses: number; // Maximum consecutive losses before alert (default: 3)
  
  // Account type specific settings
  preFundedMaxRisk: number; // Maximum risk for PreFunded accounts (default: 1.5%)
  fundedMaxRisk: number; // Maximum risk for Funded accounts (default: 2%)
  
  // Risk reduction factors
  consecutiveLossReduction: number; // Risk reduction per consecutive loss (default: 0.2%)
  nearLimitReduction: number; // Risk reduction when near account limits (default: 0.5%)
}

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  maxDailyRiskPct: 2.0,
  maxConsecutiveLosses: 3,
  preFundedMaxRisk: 1.5,
  fundedMaxRisk: 2.0,
  consecutiveLossReduction: 0.2,
  nearLimitReduction: 0.5,
};

export class RiskEngine {
  private config: RiskEngineConfig;

  constructor(config: RiskEngineConfig = DEFAULT_RISK_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate comprehensive risk metrics for an account
   */
  calculateAccountRisk(account: Account, trades: Trade[]): AccountMetrics & {
    riskAssessment: RiskAssessment;
    recommendations: string[];
  } {
    const basicMetrics = this.calculateBasicMetrics(account, trades);
    const riskAssessment = this.assessRisk(account, trades);
    const recommendations = this.generateRecommendations(account, trades, riskAssessment);

    return {
      ...basicMetrics,
      riskAssessment,
      recommendations,
    };
  }

  /**
   * Calculate basic account metrics
   */
  private calculateBasicMetrics(account: Account, trades: Trade[]): AccountMetrics {
    const equity = account.current_balance;
    const dailyRiskAmount = (account.current_balance * account.risk_current_pct) / 100;

    // Check account type specific limits
    let maxLossReached = false;
    let dailyLossLimitReached = false;
    let remainingToFunded: number | undefined;
    let remainingToProfit: number | undefined;

    if (account.type === 'PreFunded' && account.funded_threshold) {
      remainingToFunded = Math.max(0, account.funded_threshold - account.current_balance);
    }

    if (account.type === 'Funded') {
      if (account.max_loss_amount) {
        const totalLoss = account.starting_balance - account.current_balance;
        maxLossReached = totalLoss >= account.max_loss_amount;
      }

      if (account.daily_loss_limit) {
        const todayTrades = this.getTodayTrades(trades);
        const todayLoss = todayTrades
          .filter(t => t.pnl_amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.pnl_amount), 0);
        dailyLossLimitReached = todayLoss >= account.daily_loss_limit;
      }

      if (account.profit_target) {
        const totalProfit = account.current_balance - account.starting_balance;
        remainingToProfit = Math.max(0, account.profit_target - totalProfit);
      }
    }

    return {
      equity,
      daily_risk_amount: dailyRiskAmount,
      max_loss_reached: maxLossReached,
      daily_loss_limit_reached: dailyLossLimitReached,
      remaining_to_funded: remainingToFunded,
      remaining_to_profit_target: remainingToProfit,
    };
  }

  /**
   * Assess overall risk level for an account
   */
  private assessRisk(account: Account, trades: Trade[]): RiskAssessment {
    const recentTrades = trades.slice(0, 10); // Last 10 trades
    const consecutiveLosses = this.getConsecutiveLosses(recentTrades);
    const winRate = this.calculateWinRate(recentTrades);
    const avgRiskPerTrade = this.calculateAverageRisk(recentTrades);
    const volatility = this.calculateVolatility(recentTrades);

    // Calculate risk score (0-100, where 100 is highest risk)
    let riskScore = 0;

    // Consecutive losses factor
    if (consecutiveLosses >= this.config.maxConsecutiveLosses) {
      riskScore += 30;
    } else {
      riskScore += (consecutiveLosses / this.config.maxConsecutiveLosses) * 20;
    }

    // Win rate factor
    if (winRate < 0.3) {
      riskScore += 25;
    } else if (winRate < 0.5) {
      riskScore += 15;
    } else if (winRate > 0.7) {
      riskScore -= 5;
    }

    // Risk per trade factor
    const maxRisk = account.type === 'PreFunded' 
      ? this.config.preFundedMaxRisk 
      : this.config.fundedMaxRisk;
    
    if (avgRiskPerTrade > maxRisk) {
      riskScore += 20;
    }

    // Account limit proximity
    if (account.type === 'Funded') {
      if (account.max_loss_amount) {
        const lossProximity = (account.starting_balance - account.current_balance) / account.max_loss_amount;
        if (lossProximity > 0.8) {
          riskScore += 25;
        } else if (lossProximity > 0.6) {
          riskScore += 15;
        }
      }
    }

    // Volatility factor
    if (volatility > 0.05) { // 5% volatility threshold
      riskScore += 10;
    }

    // Cap at 100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 30) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      riskScore,
      riskLevel,
      consecutiveLosses,
      winRate,
      avgRiskPerTrade,
      volatility,
    };
  }

  /**
   * Generate risk management recommendations
   */
  private generateRecommendations(
    account: Account, 
    trades: Trade[], 
    riskAssessment: RiskAssessment
  ): string[] {
    const recommendations: string[] = [];

    // High risk level recommendations
    if (riskAssessment.riskLevel === 'CRITICAL') {
      recommendations.push('🚨 KRITIK: Trading durdurun ve stratejinizi gözden geçirin');
      recommendations.push('💡 Risk yönetimi kurallarınızı yeniden değerlendirin');
    } else if (riskAssessment.riskLevel === 'HIGH') {
      recommendations.push('⚠️ YÜKSEK RİSK: Risk miktarınızı azaltmayı düşünün');
      recommendations.push('📊 Son işlemlerinizi analiz edin ve pattern arayın');
    }

    // Consecutive losses
    if (riskAssessment.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      recommendations.push(`🔄 ${riskAssessment.consecutiveLosses} ardışık kayıp - Trading molası vermeyi düşünün`);
      recommendations.push('🎯 Bir sonraki işlemde risk miktarını %50 azaltın');
    }

    // Low win rate
    if (riskAssessment.winRate < 0.4) {
      recommendations.push(`📉 Düşük kazanma oranı (%${(riskAssessment.winRate * 100).toFixed(1)}) - Strateji gözden geçirilmeli`);
    }

    // High risk per trade
    const maxRisk = account.type === 'PreFunded' 
      ? this.config.preFundedMaxRisk 
      : this.config.fundedMaxRisk;
    
    if (riskAssessment.avgRiskPerTrade > maxRisk) {
      recommendations.push(`⚖️ İşlem başına ortalama risk çok yüksek (%${riskAssessment.avgRiskPerTrade.toFixed(2)})`);
      recommendations.push(`📏 Maksimum %${maxRisk} risk kullanın`);
    }

    // Account specific recommendations
    if (account.type === 'Funded' && account.max_loss_amount) {
      const lossProximity = (account.starting_balance - account.current_balance) / account.max_loss_amount;
      if (lossProximity > 0.8) {
        recommendations.push('🚫 Maksimum kayıp limitine çok yakınsınız - İşlem yapmayın');
      } else if (lossProximity > 0.6) {
        recommendations.push('⚠️ Kayıp limitinin %60\'ına ulaştınız - Çok dikkatli olun');
      }
    }

    // Positive recommendations
    if (riskAssessment.riskLevel === 'LOW' && riskAssessment.winRate > 0.6) {
      recommendations.push('✅ İyi performans - Mevcut stratejinizi sürdürün');
    }

    if (recommendations.length === 0) {
      recommendations.push('📈 Risk seviyeniz normal - Dikkatli trading yapabilirsiniz');
    }

    return recommendations;
  }

  /**
   * Calculate suggested risk percentage for next trade
   */
  calculateSuggestedRisk(account: Account, trades: Trade[]): number {
    const riskAssessment = this.assessRisk(account, trades);
    let baseRisk = account.risk_current_pct;

    // Reduce risk based on consecutive losses
    if (riskAssessment.consecutiveLosses > 0) {
      const reduction = riskAssessment.consecutiveLosses * this.config.consecutiveLossReduction;
      baseRisk = Math.max(0.25, baseRisk - reduction);
    }

    // Reduce risk if near account limits
    if (account.type === 'Funded' && account.max_loss_amount) {
      const lossProximity = (account.starting_balance - account.current_balance) / account.max_loss_amount;
      if (lossProximity > 0.5) {
        baseRisk = Math.max(0.25, baseRisk - this.config.nearLimitReduction);
      }
    }

    // Risk level adjustments
    switch (riskAssessment.riskLevel) {
      case 'CRITICAL':
        return 0; // No trading recommended
      case 'HIGH':
        return Math.max(0.25, baseRisk * 0.5);
      case 'MEDIUM':
        return Math.max(0.5, baseRisk * 0.75);
      default:
        return baseRisk;
    }
  }

  // Helper methods
  private getTodayTrades(trades: Trade[]): Trade[] {
    const today = new Date().toISOString().split('T')[0];
    return trades.filter(trade => trade.closed_at.startsWith(today));
  }

  private getConsecutiveLosses(trades: Trade[]): number {
    let consecutive = 0;
    for (const trade of trades) {
      if (trade.pnl_amount < 0) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const wins = trades.filter(trade => trade.pnl_amount > 0).length;
    return wins / trades.length;
  }

  private calculateAverageRisk(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalRisk = trades.reduce((sum, trade) => sum + trade.risk_used_pct, 0);
    return totalRisk / trades.length;
  }

  private calculateVolatility(trades: Trade[]): number {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(trade => trade.pnl_pct || 0);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) / 100; // Convert to decimal
  }
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  consecutiveLosses: number;
  winRate: number;
  avgRiskPerTrade: number;
  volatility: number;
}

// Export default instance
export const riskEngine = new RiskEngine();
