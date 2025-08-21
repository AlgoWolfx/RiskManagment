import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { accountRepository, tradeRepository } from '@/lib/repo';
import { calculateAccountMetrics, formatCurrency, formatPercentage } from '@/lib/domain/risk';
import { Trade } from '@/lib/domain/types';
import AddTradeModal from '@/components/trades/AddTradeModal';
import TradeList from '@/components/trades/TradeList';
import CalendarModal from '@/components/trades/CalendarModal';
import { useModalStore } from '@/store/ui-store';
import { useToast } from '@/hooks/use-toast';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAddTradeOpen, setCalendarOpen } = useModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account data
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountRepository.getById(id!),
    enabled: !!id,
  });

  // Fetch trades for this account
  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trades', id],
    queryFn: () => tradeRepository.getByAccountId(id!),
    enabled: !!id,
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      await tradeRepository.delete(tradeId);
    },
    onSuccess: async () => {
      // Önce tüm cache'leri temizle
      await queryClient.invalidateQueries({ queryKey: ['trades', id] });
      await queryClient.invalidateQueries({ queryKey: ['account', id] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      // Cache'i zorla yenile
      await queryClient.refetchQueries({ queryKey: ['account', id] });
      await queryClient.refetchQueries({ queryKey: ['accounts'] });
      
      toast({
        title: 'İşlem silindi',
        description: 'İşlem başarıyla silindi.',
      });
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'İşlem silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Early returns after all hooks are defined
  if (!id) {
    navigate('/');
    return null;
  }

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
            <h2 className="text-xl font-semibold mb-2 text-white">Hesap Bulunamadı</h2>
            <p className="text-white/80 mb-4 font-medium">
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

  const handleEditTrade = (trade: Trade) => {
    // TODO: Implement edit trade functionality
    toast({
      title: 'Düzenleme',
      description: 'İşlem düzenleme özelliği yakında eklenecek.',
    });
  };

  const handleDeleteTrade = (trade: Trade) => {
    deleteTradeMutation.mutate(trade.id);
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
                <h1 className="text-3xl font-bold text-white">{account.name}</h1>
                <Badge 
                  variant={account.type === 'PreFunded' ? 'secondary' : 'default'}
                >
                  {account.type}
                </Badge>
              </div>
              <p className="text-white/80 font-medium">
                Hesap detayları ve işlem geçmişi
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="trading"
              onClick={handleOpenCalendar}
              className="flex-1 sm:flex-none text-white border-white/20 hover:bg-white/10"
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
              <CardTitle className="text-sm font-medium text-white">
                Güncel Bakiye
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(account.current_balance)}</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                isProfit ? 'profit-text' : isLoss ? 'loss-text' : 'text-white/80'
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
              <CardTitle className="text-sm font-medium text-white">
                Risk Yüzdesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatPercentage(account.risk_current_pct)}
              </div>
              <div className="text-sm text-warning">
                {formatCurrency(metrics.daily_risk_amount)}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Toplam İşlem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{trades.length}</div>
              <div className="text-sm text-white/80 font-medium">
                Kayıtlı işlem sayısı
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Başlangıç Bakiyesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(account.starting_balance)}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loss Limits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="gradient-card shadow-trading border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Günlük Kayıp Limiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold loss-text">
                {formatCurrency(account.daily_loss_limit || 0)}
              </div>
              <div className="text-sm text-white/80 font-medium mt-1">Günlük risk limiti</div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-trading border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Maksimum Kayıp Limiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold loss-text">
                {formatCurrency(account.max_loss_amount || 0)}
              </div>
              <div className="text-sm text-white/80 font-medium mt-1">Toplam risk limiti</div>
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
                    <div className="text-sm text-white/80 font-medium">Funded Eşiği</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(account.funded_threshold || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white/80 font-medium">Kalan Tutar</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {account.profit_target && (
                    <div>
                      <div className="text-sm text-white/80 font-medium">Kâr Hedefi</div>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(account.profit_target)}
                      </div>
                    </div>
                  )}
                  {metrics.remaining_to_profit_target !== undefined && (
                    <div>
                      <div className="text-sm text-white/80 font-medium">Hedefe Kalan</div>
                      <div className="text-xl font-bold text-profit">
                        {formatCurrency(metrics.remaining_to_profit_target)}
                      </div>
                    </div>
                  )}
                  {metrics.daily_loss_remaining !== undefined && (
                    <div>
                      <div className="text-sm text-white/80 font-medium">Günlük Limit Kalan</div>
                      <div className="text-xl font-bold text-warning">
                        {formatCurrency(metrics.daily_loss_remaining)}
                      </div>
                    </div>
                  )}
                  {account.max_loss_amount && (
                    <div>
                      <div className="text-sm text-white/80 font-medium">Max Kayıp Limiti</div>
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
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
          />
        </motion.div>

        {/* Modals */}
        <AddTradeModal accountId={account.id} />
        <CalendarModal accountId={account.id} />
      </div>
    </div>
  );
}