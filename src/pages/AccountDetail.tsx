import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { accountRepository, tradeRepository } from '@/lib/repo/localStorage';
import { calculateAccountMetrics, formatCurrency, formatPercentage } from '@/lib/domain/risk';
import AddTradeModal from '@/components/trades/AddTradeModal';
import TradeList from '@/components/trades/TradeList';
import CalendarModal from '@/components/trades/CalendarModal';
import { useModalStore } from '@/store/ui-store';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAddTradeOpen, setCalendarOpen } = useModalStore();

  if (!id) {
    navigate('/');
    return null;
  }

  // Fetch account data
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountRepository.getById(id),
  });

  // Fetch trades for this account
  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trades', id],
    queryFn: () => tradeRepository.getByAccountId(id),
  });

  if (accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-card">
        <div className="animate-pulse-subtle">
          <TrendingUp className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-card">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Hesap Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">
              Bu hesap mevcut değil veya silinmiş olabilir.
            </p>
            <Button onClick={() => navigate('/')} variant="trading-primary">
              Ana Panele Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = calculateAccountMetrics(account, trades);
  const isProfit = account.current_balance > account.starting_balance;
  const isLoss = account.current_balance < account.starting_balance;

  const handleAddTrade = () => {
    setAddTradeOpen(true, account.id);
  };

  const handleOpenCalendar = () => {
    setCalendarOpen(true, account.id);
  };

  return (
    <div className="min-h-screen p-4 gradient-card">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{account.name}</h1>
                <Badge 
                  variant={account.type === 'PreFunded' ? 'secondary' : 'default'}
                >
                  {account.type}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Hesap detayları ve işlem geçmişi
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="trading"
              onClick={handleOpenCalendar}
              className="flex-1 sm:flex-none"
            >
              <Calendar className="h-4 w-4" />
              Takvim
            </Button>
            <Button
              variant="trading-primary"
              onClick={handleAddTrade}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              İşlem Ekle
            </Button>
          </div>
        </motion.div>

        {/* Account Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Güncel Bakiye
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.current_balance)}</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                isProfit ? 'profit-text' : isLoss ? 'loss-text' : 'text-muted-foreground'
              }`}>
                {isProfit ? (
                  <TrendingUp className="h-3 w-3" />
                ) : isLoss ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {formatCurrency(account.current_balance - account.starting_balance)}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risk Yüzdesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(account.risk_current_pct)}
              </div>
              <div className="text-sm text-warning">
                {formatCurrency(metrics.daily_risk_amount)}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam İşlem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trades.length}</div>
              <div className="text-sm text-muted-foreground">
                Kayıtlı işlem sayısı
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Başlangıç Bakiyesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.starting_balance)}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Type Specific Metrics */}
        {account.type === 'PreFunded' && metrics.remaining_to_funded !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="gradient-card shadow-trading border-info/20">
              <CardHeader>
                <CardTitle className="text-info">PreFunded Hesap Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Funded Eşiği</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(account.funded_threshold || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kalan Tutar</div>
                    <div className="text-xl font-bold text-info">
                      {formatCurrency(metrics.remaining_to_funded)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {account.type === 'Funded' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="gradient-card shadow-trading border-profit/20">
              <CardHeader>
                <CardTitle className="text-profit">Funded Hesap Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {account.profit_target && (
                    <div>
                      <div className="text-sm text-muted-foreground">Kâr Hedefi</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(account.profit_target)}
                      </div>
                    </div>
                  )}
                  {metrics.remaining_to_profit_target !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">Hedefe Kalan</div>
                      <div className="text-xl font-bold text-profit">
                        {formatCurrency(metrics.remaining_to_profit_target)}
                      </div>
                    </div>
                  )}
                  {account.max_loss_amount && (
                    <div>
                      <div className="text-sm text-muted-foreground">Max Kayıp Limiti</div>
                      <div className="text-xl font-bold loss-text">
                        {formatCurrency(account.max_loss_amount)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trade List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TradeList 
            accountId={account.id} 
            trades={trades} 
            isLoading={tradesLoading}
          />
        </motion.div>

        {/* Modals */}
        <AddTradeModal accountId={account.id} />
        <CalendarModal accountId={account.id} />
      </div>
    </div>
  );
}