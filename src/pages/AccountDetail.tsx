import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, Target, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { accountRepository, tradeRepository } from '@/lib/repo';
import { calculateAccountMetrics, formatCurrency, formatPercentage, calculateProgressUSD, shouldShowCelebration } from '@/lib/domain/risk';
import { Trade } from '@/lib/domain/types';
import AddTradeModal from '@/components/trades/AddTradeModal';
import TradeList from '@/components/trades/TradeList';
import CalendarModal from '@/components/trades/CalendarModal';
import { useModalStore } from '@/store/ui-store';
import { useToast } from '@/hooks/use-toast';
import { updateAccountAfterTrade } from '@/lib/domain/risk';
import { Account } from '@/lib/domain/types';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAddTradeOpen, setCalendarOpen } = useModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDailyLimitWarning, setShowDailyLimitWarning] = useState(false);

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

  // Debug logları
  useEffect(() => {
    if (account) {
      console.log('=== ACCOUNT DETAIL DEBUG ===');
      console.log('Account data loaded:', account);
      console.log('Trades data loaded:', trades);
      console.log('Account current balance:', account.current_balance);
      console.log('Account risk percentage:', account.risk_current_pct);
      console.log('=== END ACCOUNT DETAIL DEBUG ===');
    }
  }, [account, trades]);

  // Celebration effect
  useEffect(() => {
    if (account && trades.length > 0) {
      const shouldCelebrate = shouldShowCelebration(account, trades);
      if (shouldCelebrate && !showCelebration) {
        setShowCelebration(true);
        // Celebration effect for 5 seconds
        const timer = setTimeout(() => setShowCelebration(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [account, trades, showCelebration]);

  const metrics = account ? calculateAccountMetrics(account, trades) : {
    equity: 0,
    daily_risk_amount: 0,
    max_loss_reached: false,
    daily_loss_limit_reached: false,
    remaining_to_funded: 0,
    remaining_to_profit_target: 0,
    daily_loss_remaining: 0,
    daily_pnl: 0,
  };
  const isProfit = account ? account.current_balance > account.starting_balance : false;
  const isLoss = account ? account.current_balance < account.starting_balance : false;
  const progressUSD = calculateProgressUSD(trades);

  // Daily limit warning effect
  useEffect(() => {
    if (account && metrics.daily_loss_limit_reached && !showDailyLimitWarning) {
      setShowDailyLimitWarning(true);
      // Warning effect for 8 seconds
      const timer = setTimeout(() => setShowDailyLimitWarning(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [account, metrics.daily_loss_limit_reached, showDailyLimitWarning]);

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      // Önce işlemi sil
      await tradeRepository.delete(tradeId);
      
      // Sonra hesabı yeniden hesapla ve güncelle
      if (account) {
        console.log('=== DELETE TRADE ACCOUNT UPDATE DEBUG ===');
        console.log('Account before deletion:', account);
        console.log('Trade to delete ID:', tradeId);
        
        // Kalan işlemleri al (silinen işlem hariç)
        const remainingTrades = trades.filter(t => t.id !== tradeId);
        console.log('Remaining trades after deletion:', remainingTrades);
        
        // Hesabı başlangıç durumuna döndür
        const resetAccount = {
          ...account,
          current_balance: account.starting_balance,
          risk_current_pct: 1.00, // Başlangıç risk yüzdesi
        };
        
        console.log('Reset account to initial state:', resetAccount);
        
        // Kalan işlemleri sırayla uygula
        let currentAccount: Account = resetAccount;
        for (const trade of remainingTrades) {
          const accountUpdates = updateAccountAfterTrade(currentAccount, trade);
          currentAccount = {
            ...currentAccount,
            ...accountUpdates,
          } as Account;
        }
        
        console.log('Final account state after reapplying trades:', currentAccount);
        
        // Hesabı güncelle
        const updatedAccount = await accountRepository.update(id!, {
          current_balance: currentAccount.current_balance,
          risk_current_pct: currentAccount.risk_current_pct,
        });
        
        console.log('Updated account from repository:', updatedAccount);
        console.log('=== END DELETE TRADE ACCOUNT UPDATE DEBUG ===');
      }
    },
    onSuccess: async () => {
      console.log('=== DELETE CACHE UPDATE DEBUG ===');
      
      // Tüm cache'leri temizle ve yenile
      await queryClient.invalidateQueries({ queryKey: ['trades', id] });
      await queryClient.invalidateQueries({ queryKey: ['account', id] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['all-trades'] });
      
      // Cache'i zorla yenile - daha agresif
      await queryClient.refetchQueries({ queryKey: ['account', id], exact: true });
      await queryClient.refetchQueries({ queryKey: ['accounts'], exact: true });
      await queryClient.refetchQueries({ queryKey: ['trades', id], exact: true });
      await queryClient.refetchQueries({ queryKey: ['all-trades'], exact: true });
      
      // Ek olarak tüm account ve trade cache'lerini temizle
      await queryClient.removeQueries({ queryKey: ['account', id] });
      await queryClient.removeQueries({ queryKey: ['trades', id] });
      
      // Kısa bir bekleme süresi
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Yeniden yükle
      await queryClient.prefetchQuery({
        queryKey: ['account', id],
        queryFn: () => accountRepository.getById(id!),
      });
      
      await queryClient.prefetchQuery({
        queryKey: ['trades', id],
        queryFn: () => tradeRepository.getByAccountId(id!),
      });
      
      console.log('=== END DELETE CACHE UPDATE DEBUG ===');
      
      toast({
        title: 'İşlem silindi',
        description: 'İşlem başarıyla silindi ve hesap güncellendi.',
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
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 hover:text-white transition-all duration-200 shadow-lg"
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

        {/* Celebration Banner */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 border border-yellow-400/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1, repeat: 5 }}
              >
                <Trophy className="h-8 w-8 text-yellow-400" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-400">
                  🎉 Tebrikler!
                </h3>
                <p className="text-white/90">
                  {account.type === 'PreFunded' 
                    ? 'Funded hedefine ulaştınız!' 
                    : 'Kâr hedefine ulaştınız!'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Limit Warning Banner */}
        {showDailyLimitWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-gradient-to-r from-red-400/20 via-pink-400/20 to-purple-400/20 border border-red-400/30 rounded-lg p-4 relative overflow-hidden"
          >
            {/* Rain effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-4 bg-blue-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-20px',
                  }}
                  animate={{
                    y: ['0px', '100vh'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-3 relative z-10">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-4xl">🌧️</div>
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-400">
                  😔 Maalesef Olmadı...
                </h3>
                <p className="text-white/90">
                  Günlük kayıp limitini aştınız. Bir dahaki sefere stratejinizi geliştirin.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
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
              <CardTitle className="text-sm font-medium text-white flex items-center gap-1">
                <Target className="h-4 w-4" />
                İlerleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{formatCurrency(progressUSD)}</div>
              <div className="text-sm text-white/80 font-medium">
                TP/SL İşlemleri
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
          <Card className={`gradient-card shadow-trading border-border/30 ${
            metrics.daily_loss_limit_reached ? 'border-red-500/50 bg-red-500/5' : ''
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-1">
                {metrics.daily_loss_limit_reached ? '💥' : '⚠️'}
                Günlük Kayıp Limiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                metrics.daily_loss_limit_reached ? 'text-red-400' : 'loss-text'
              }`}>
                {formatCurrency(account.daily_loss_limit || 0)}
              </div>
              <div className="text-sm text-white/80 font-medium mt-1">
                {metrics.daily_loss_limit_reached ? 'Limit aşıldı!' : 'Günlük risk limiti'}
              </div>
              {metrics.daily_loss_remaining !== undefined && (
                <div className="text-xs text-white/60 mt-1">
                  Kalan: {formatCurrency(metrics.daily_loss_remaining)}
                </div>
              )}
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
            <Card className={`gradient-card shadow-trading border-info/20 ${
              showCelebration ? 'animate-pulse border-info/50' : ''
            }`}>
              <CardHeader>
                <CardTitle className="text-info flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  PreFunded Hesap Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div>
                    <div className="text-sm text-white/80 font-medium">İlerleme</div>
                    <div className="text-xl font-bold text-info">
                      {formatCurrency(progressUSD)}
                    </div>
                  </div>
                  {metrics.daily_loss_remaining !== undefined && (
                    <div>
                      <div className="text-sm text-white/80 font-medium">Günlük Kayıp Limiti</div>
                      <div className="text-xl font-bold text-warning">
                        {formatCurrency(metrics.daily_loss_remaining)}
                      </div>
                    </div>
                  )}
                </div>
                {metrics.remaining_to_funded === 0 && (
                  <div className="mt-3 p-3 bg-info/10 border border-info/30 rounded-lg">
                    <div className="text-info font-medium text-center">
                      🎉 Funded hedefine ulaştınız! Tebrikler!
                    </div>
                  </div>
                )}
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
            <Card className={`gradient-card shadow-trading border-profit/20 ${
              showCelebration ? 'animate-pulse border-profit/50' : ''
            }`}>
              <CardHeader>
                <CardTitle className="text-profit flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Funded Hesap Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <div>
                    <div className="text-sm text-white/80 font-medium">İlerleme</div>
                    <div className="text-xl font-bold text-info">
                      {formatCurrency(progressUSD)}
                    </div>
                  </div>
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
                {metrics.remaining_to_profit_target === 0 && (
                  <div className="mt-3 p-3 bg-profit/10 border border-profit/30 rounded-lg">
                    <div className="text-profit font-medium text-center">
                      🎉 Kâr hedefine ulaştınız! Tebrikler!
                    </div>
                  </div>
                )}
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