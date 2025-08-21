import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/lib/domain/types';
import { calculateAccountMetrics, formatCurrency, formatPercentage } from '@/lib/domain/risk';
import { useModalStore } from '@/store/ui-store';

interface AccountCardProps {
  account: Account;
  trades: any[]; // Will be properly typed later
}

export default function AccountCard({ account, trades }: AccountCardProps) {
  const navigate = useNavigate();
  const { setAddTradeOpen, setCalendarOpen } = useModalStore();
  
  const metrics = calculateAccountMetrics(account, trades || []);
  const isProfit = account.current_balance > account.starting_balance;
  const isLoss = account.current_balance < account.starting_balance;

  const handleAddTrade = () => {
    setAddTradeOpen(true, account.id);
  };

  const handleViewDetails = () => {
    navigate(`/accounts/${account.id}`);
  };

  const handleViewCalendar = () => {
    setCalendarOpen(true, account.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="gradient-card shadow-elevated border-border/30 hover:border-primary/30 transition-glow group relative overflow-hidden">
        {/* Cosmic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold group-hover:text-cosmic transition-colors">
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
              <div className="text-2xl font-bold">
                {formatCurrency(account.current_balance)}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                isProfit ? 'profit-text' : isLoss ? 'loss-text' : 'text-muted-foreground'
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
              <div className="text-muted-foreground mb-1">Güncel Risk</div>
              <div className="font-bold text-primary">
                {formatPercentage(account.risk_current_pct)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="text-muted-foreground mb-1">Risk Tutarı</div>
              <div className="font-bold text-warning">
                {formatCurrency(metrics.daily_risk_amount)}
              </div>
            </div>
          </div>

          {/* Account type specific metrics */}
          {account.type === 'PreFunded' && metrics.remaining_to_funded !== undefined && (
            <div className="p-4 rounded-lg gradient-aurora/10 border border-info/20">
              <div className="text-sm text-info-foreground">
                <div className="font-medium mb-1">🎯 Funded'a kalan</div>
                <div className="text-xl font-bold text-info">
                  {formatCurrency(metrics.remaining_to_funded)}
                </div>
              </div>
            </div>
          )}

          {account.type === 'Funded' && metrics.remaining_to_profit_target !== undefined && (
            <div className="p-4 rounded-lg gradient-profit/10 border border-profit/20">
              <div className="text-sm text-profit-foreground">
                <div className="font-medium mb-1">🌟 Hedef kâra kalan</div>
                <div className="text-xl font-bold text-profit">
                  {formatCurrency(metrics.remaining_to_profit_target)}
                </div>
              </div>
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}