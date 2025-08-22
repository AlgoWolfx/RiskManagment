import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tradeRepository, accountRepository } from '@/lib/repo';
import { createTradeSchema, CreateTradeFormData } from '@/lib/validations/schemas';
import { Trade } from '@/lib/domain/types';
import { updateAccountAfterTrade, calculateAccountMetrics } from '@/lib/domain/risk';

interface EditTradeModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditTradeModal({ trade, isOpen, onClose }: EditTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTradeFormData>({
    resolver: zodResolver(createTradeSchema),
    defaultValues: {
      side: 'LONG',
      trade_type: 'ENTRY',
      closed_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    },
  });

  // Trade değiştiğinde formu güncelle
  useEffect(() => {
    if (trade) {
      reset({
        symbol: trade.symbol,
        side: trade.side,
        trade_type: trade.trade_type,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        position_size: trade.position_size,
        pnl_amount: trade.pnl_amount,
        pnl_pct: trade.pnl_pct,
        risk_used_pct: trade.risk_used_pct,
        note: trade.note || '',
        screenshot_url: trade.screenshot_url || '',
        closed_at: format(new Date(trade.closed_at), 'yyyy-MM-dd\'T\'HH:mm'),
      });
    }
  }, [trade, reset]);

  const tradeType = watch('trade_type');
  const pnlAmount = watch('pnl_amount');

  // SL seçildiğinde P&L'yi otomatik olarak negatif yap
  useEffect(() => {
    if (tradeType === 'SL' && pnlAmount && pnlAmount > 0) {
      setValue('pnl_amount', -Math.abs(pnlAmount));
      toast({
        title: 'SL İşlemi',
        description: 'SL işlemlerinde P&L otomatik olarak negatif yapıldı.',
      });
    }
  }, [tradeType, pnlAmount, setValue, toast]);

  const updateTradeMutation = useMutation({
    mutationFn: async (tradeData: CreateTradeFormData) => {
      if (!trade) {
        throw new Error('Düzenlenecek işlem bulunamadı');
      }

      // SL işlemlerinde P&L'nin negatif olduğundan emin ol
      let finalPnlAmount = tradeData.pnl_amount;
      if (tradeData.trade_type === 'SL' && finalPnlAmount > 0) {
        finalPnlAmount = -Math.abs(finalPnlAmount);
      }

      // Önce hesabı al
      const account = await accountRepository.getById(trade.account_id);
      if (!account) {
        throw new Error('Hesap bulunamadı');
      }

      // Günlük kayıp limiti kontrolü (mevcut işlem hariç)
      const existingTrades = await tradeRepository.getByAccountId(trade.account_id);
      const tradesWithoutCurrent = existingTrades.filter(t => t.id !== trade.id);
      const metrics = calculateAccountMetrics(account, tradesWithoutCurrent);
      
      // Eğer günlük kayıp limiti aşılmışsa ve yeni işlem zarar edecekse uyarı ver
      if (metrics.daily_loss_limit_reached && finalPnlAmount < 0) {
        throw new Error('Günlük kayıp limitini aştınız. Yeni zarar işlemi ekleyemezsiniz.');
      }

      // Eski işlemin P&L'sini hesap bakiyesinden çıkar
      const oldPnlAmount = trade.pnl_amount;
      const correctedBalance = account.current_balance - oldPnlAmount;

      // Update the trade
      const updatedTrade = await tradeRepository.update(trade.id, {
        symbol: tradeData.symbol,
        side: tradeData.side,
        trade_type: tradeData.trade_type,
        entry_price: tradeData.entry_price,
        exit_price: tradeData.exit_price,
        position_size: tradeData.position_size,
        pnl_amount: finalPnlAmount,
        pnl_pct: tradeData.pnl_pct,
        risk_used_pct: tradeData.risk_used_pct,
        note: tradeData.note,
        screenshot_url: tradeData.screenshot_url,
        closed_at: tradeData.closed_at,
        account_type: trade.account_type, // Mevcut account_type'ı koru
      });

      // Yeni P&L'yi düzeltilmiş bakiyeye ekle
      const newBalance = correctedBalance + finalPnlAmount;
      
      // Hesabı güncelle
      await accountRepository.update(trade.account_id, {
        current_balance: newBalance,
      });

      return updatedTrade;
    },
    onSuccess: async () => {
      // Cache'leri temizle ve yenile
      await queryClient.invalidateQueries({ queryKey: ['trades', trade?.account_id] });
      await queryClient.invalidateQueries({ queryKey: ['account', trade?.account_id] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['all-trades'] });
      
      toast({
        title: 'İşlem güncellendi',
        description: 'İşlem başarıyla güncellendi.',
      });
      
      onClose();
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'İşlem güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateTradeFormData) => {
    updateTradeMutation.mutate(data);
  };

  if (!trade) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">İşlem Düzenle</DialogTitle>
          <DialogDescription className="text-white/70">
            İşlem detaylarını güncelleyin.
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-white">Sembol</Label>
              <Input
                id="symbol"
                placeholder="EURUSD"
                {...register('symbol')}
                className={`${errors.symbol ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
              />
              {errors.symbol && (
                <p className="text-sm text-red-400">{errors.symbol.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="side" className="text-white">İşlem Yönü</Label>
              <Controller
                name="side"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="border-white/30 bg-white/10 text-white focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
                      <SelectItem value="LONG" className="text-green-400">LONG</SelectItem>
                      <SelectItem value="SHORT" className="text-blue-400">SHORT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_type" className="text-white">İşlem Türü</Label>
              <Controller
                name="trade_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className={`border-white/30 bg-white/10 text-white focus:border-blue-500 ${
                      tradeType === 'TP' ? 'text-green-400 border-green-500/50' :
                      tradeType === 'SL' ? 'text-red-400 border-red-500/50' :
                      'text-yellow-400 border-yellow-500/50'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
                      <SelectItem value="ENTRY" className="text-yellow-400">ENTRY</SelectItem>
                      <SelectItem value="TP" className="text-green-400">TP</SelectItem>
                      <SelectItem value="SL" className="text-red-400">SL</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* SL İşlemi Uyarısı */}
          {tradeType === 'SL' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 font-medium">
                ⚠️ SL (Stop Loss) İşlemi: P&L otomatik olarak negatif yapılacak
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_price" className="text-white">Giriş Fiyatı</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.00001"
                placeholder="1.0850"
                {...register('entry_price', { valueAsNumber: true })}
                className={`${errors.entry_price ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
              />
              {errors.entry_price && (
                <p className="text-sm text-red-400">{errors.entry_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit_price" className="text-white">Çıkış Fiyatı</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.00001"
                placeholder="1.0875"
                {...register('exit_price', { valueAsNumber: true })}
                className={`${errors.exit_price ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
              />
              {errors.exit_price && (
                <p className="text-sm text-red-400">{errors.exit_price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position_size" className="text-white">Pozisyon Büyüklüğü (Lot)</Label>
            <Input
              id="position_size"
              type="number"
              step="0.01"
              placeholder="1.00"
              {...register('position_size', { valueAsNumber: true })}
              className={`${errors.position_size ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
            />
            {errors.position_size && (
              <p className="text-sm text-red-400">{errors.position_size.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pnl_amount" className="text-white">
                P&L Miktarı ($)
                {tradeType === 'SL' && <span className="text-red-400 ml-1">*Negatif</span>}
              </Label>
              <Input
                id="pnl_amount"
                type="number"
                step="0.01"
                placeholder={tradeType === 'SL' ? "-100.00" : "0.00"}
                {...register('pnl_amount', { valueAsNumber: true })}
                className={`${errors.pnl_amount ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500 ${
                  tradeType === 'SL' ? 'border-red-500/50' : ''
                }`}
              />
              {errors.pnl_amount && (
                <p className="text-sm text-red-400">{errors.pnl_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pnl_pct" className="text-white">P&L Yüzdesi (%)</Label>
              <Input
                id="pnl_pct"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('pnl_pct', { valueAsNumber: true })}
                className={`${errors.pnl_pct ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
              />
              {errors.pnl_pct && (
                <p className="text-sm text-red-400">{errors.pnl_pct.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_used_pct" className="text-white">Kullanılan Risk (%)</Label>
            <Input
              id="risk_used_pct"
              type="number"
              step="0.01"
              placeholder="1.00"
              {...register('risk_used_pct', { valueAsNumber: true })}
              className={`${errors.risk_used_pct ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
            />
            {errors.risk_used_pct && (
              <p className="text-sm text-red-400">{errors.risk_used_pct.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="closed_at" className="text-white">Kapanış Tarihi</Label>
            <Input
              id="closed_at"
              type="datetime-local"
              {...register('closed_at')}
              className={`${errors.closed_at ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
            />
            {errors.closed_at && (
              <p className="text-sm text-red-400">{errors.closed_at.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot_url" className="text-white">TradingView Screenshot URL (Opsiyonel)</Label>
            <Input
              id="screenshot_url"
              type="url"
              placeholder="https://tradingview.com/..."
              {...register('screenshot_url')}
              className={`${errors.screenshot_url ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
            />
            {errors.screenshot_url && (
              <p className="text-sm text-red-400">{errors.screenshot_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-white">Not (Opsiyonel)</Label>
            <Textarea
              id="note"
              placeholder="İşlem hakkında notlarınız..."
              {...register('note')}
              className={`min-h-[80px] ${errors.note ? 'border-red-500' : 'border-white/30 bg-white/10 text-white'} focus:border-blue-500`}
            />
            {errors.note && (
              <p className="text-sm text-red-400">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-500/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-400/50 transition-all duration-200"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
