import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, BarChart3, Trash2, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Account, Trade } from '@/lib/domain/types';
import { calculateAccountMetrics, formatCurrency, formatPercentage, shouldShowCelebration } from '@/lib/domain/risk';
import { useModalStore } from '@/store/ui-store';

interface AccountCardProps {
  account: Account;
  trades: Trade[]; // Will be properly typed later
  onDelete?: (accountId: string) => void;
}

export default function AccountCard({ account, trades, onDelete }: AccountCardProps) {
  const navigate = useNavigate();
  const { setAddTradeOpen, setCalendarOpen } = useModalStore();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDailyLimitWarning, setShowDailyLimitWarning] = useState(false);
  
  const metrics = calculateAccountMetrics(account, trades || []);
  const isProfit = account.current_balance > account.starting_balance;
  const isLoss = account.current_balance < account.starting_balance;
  const shouldCelebrate = shouldShowCelebration(account, trades || []);

  // Celebration effect
  useEffect(() => {
    if (shouldCelebrate && !showCelebration) {
      setShowCelebration(true);
      // Celebration effect for 3 seconds
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldCelebrate, showCelebration]);

  // Daily limit warning effect
  useEffect(() => {
    if (metrics.daily_loss_limit_reached && !showDailyLimitWarning) {
      setShowDailyLimitWarning(true);
      // Warning effect for 5 seconds
      const timer = setTimeout(() => setShowDailyLimitWarning(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [metrics.daily_loss_limit_reached, showDailyLimitWarning]);

  const handleAddTrade = () => {
    setAddTradeOpen(true, account.id);
  };

  const handleViewDetails = () => {
    navigate(`/accounts/${account.id}`);
  };

  const handleViewCalendar = () => {
    setCalendarOpen(true, account.id);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(account.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`gradient-card shadow-elevated border-border/30 hover:border-primary/30 transition-glow group relative overflow-hidden ${
        showCelebration ? 'animate-pulse border-primary/50' : ''
      } ${
        showDailyLimitWarning ? 'animate-pulse border-red-400/50' : ''
      }`}>
        {/* Celebration effect */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 rounded-lg"
          >
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1, repeat: 3 }}
              >
                <Trophy className="h-6 w-6 text-yellow-400" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Daily Limit Warning Effect */}
        {showDailyLimitWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-pink-400/20 to-purple-400/20 rounded-lg overflow-hidden"
          >
            {/* Rain effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-3 bg-blue-400/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                  }}
                  animate={{
                    y: ['0px', '200px'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5 + Math.random() * 1,
                    repeat: Infinity,
                    delay: Math.random() * 1.5,
                  }}
                />
              ))}
            </div>
            
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-2xl">🌧️</div>
              </motion.div>
            </div>
            
            <div className="absolute bottom-2 left-2">
              <div className="text-xs text-red-400 font-medium">
                😔 Limit Aşıldı
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Cosmic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white group-hover:text-cosmic transition-colors">
                {account.name}
              </CardTitle>
              <Badge 
                variant={account.type === 'PreFunded' ? 'secondary' : 'default'}
                className="mt-2 font-mono text-xs"
              >
                🚀 {account.type}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(account.current_balance)}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                isProfit ? 'profit-text' : isLoss ? 'loss-text' : 'text-white/80'
              }`}>
                {isProfit ? (
                  <TrendingUp className="h-3 w-3" />
                ) : isLoss ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {formatCurrency(account.current_balance - account.starting_balance)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-white mb-1 font-medium">Güncel Risk</div>
              <div className="font-bold text-primary">
                {formatPercentage(account.risk_current_pct)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="text-white mb-1 font-medium">Risk Tutarı</div>
              <div className="font-bold text-warning">
                {formatCurrency(metrics.daily_risk_amount)}
              </div>
            </div>
          </div>

          {/* Account type specific metrics */}
          {account.type === 'PreFunded' && metrics.remaining_to_funded !== undefined && (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg gradient-aurora/10 border border-info/20 ${
                showCelebration ? 'animate-pulse border-info/50' : ''
              }`}>
                <div className="text-sm text-white">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Funded'a kalan
                  </div>
                  <div className="text-xl font-bold text-info">
                    {formatCurrency(metrics.remaining_to_funded)}
                  </div>
                  {metrics.remaining_to_funded === 0 && (
                    <div className="text-xs text-info/80 mt-1">
                      🎉 Funded hedefine ulaştınız!
                    </div>
                  )}
                </div>
              </div>
              
              {metrics.daily_loss_remaining !== undefined && (
                <div className={`p-4 rounded-lg border ${
                  metrics.daily_loss_limit_reached 
                    ? 'bg-red-400/10 border-red-400/20' 
                    : 'bg-loss/10 border-loss/20'
                }`}>
                  <div className="text-sm text-white">
                    <div className="font-medium mb-1 flex items-center gap-1">
                      {metrics.daily_loss_limit_reached ? '💥' : '⚠️'} 
                      Günlük kayıp limiti kalan
                    </div>
                    <div className={`text-xl font-bold ${
                      metrics.daily_loss_limit_reached ? 'text-red-400' : 'text-loss'
                    }`}>
                      {formatCurrency(metrics.daily_loss_remaining)}
                    </div>
                    {metrics.daily_loss_limit_reached && (
                      <div className="text-xs text-red-400/80 mt-1">
                        😔 Günlük limit aşıldı!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {account.type === 'Funded' && (
            <div className="space-y-3">
              {metrics.remaining_to_profit_target !== undefined && (
                <div className={`p-4 rounded-lg gradient-profit/10 border border-profit/20 ${
                  showCelebration ? 'animate-pulse border-profit/50' : ''
                }`}>
                  <div className="text-sm text-white">
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Hedef kâra kalan
                    </div>
                    <div className="text-xl font-bold text-profit">
                      {formatCurrency(metrics.remaining_to_profit_target)}
                    </div>
                    {metrics.remaining_to_profit_target === 0 && (
                      <div className="text-xs text-profit/80 mt-1">
                        🎉 Kâr hedefine ulaştınız!
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {metrics.daily_loss_remaining !== undefined && (
                <div className={`p-4 rounded-lg border ${
                  metrics.daily_loss_limit_reached 
                    ? 'bg-red-400/10 border-red-400/20' 
                    : 'bg-loss/10 border-loss/20'
                }`}>
                  <div className="text-sm text-white">
                    <div className="font-medium mb-1 flex items-center gap-1">
                      {metrics.daily_loss_limit_reached ? '💥' : '⚠️'} 
                      Günlük kayıp limiti kalan
                    </div>
                    <div className={`text-xl font-bold ${
                      metrics.daily_loss_limit_reached ? 'text-red-400' : 'text-loss'
                    }`}>
                      {formatCurrency(metrics.daily_loss_remaining)}
                    </div>
                    {metrics.daily_loss_limit_reached && (
                      <div className="text-xs text-red-400/80 mt-1">
                        😔 Günlük limit aşıldı!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="cosmic"
              size="sm"
              onClick={handleAddTrade}
              className="flex-1"
            >
              <Plus className="h-4 w-4" />
              İşlem Ekle
            </Button>
            <Button
              variant="aurora"
              size="sm"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4" />
              Detay
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="px-3"
                title="Hesabı Sil"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}