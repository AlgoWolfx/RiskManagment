import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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
import { useModalStore } from '@/store/ui-store';
import { tradeRepository, accountRepository } from '@/lib/repo/localStorage';
import { createTradeSchema, CreateTradeFormData } from '@/lib/validations/schemas';
import { updateAccountAfterTrade } from '@/lib/domain/risk';

interface AddTradeModalProps {
  accountId: string;
}

export default function AddTradeModal({ accountId }: AddTradeModalProps) {
  const { isAddTradeOpen, selectedAccountId, setAddTradeOpen } = useModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOpen = isAddTradeOpen && selectedAccountId === accountId;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTradeFormData>({
    resolver: zodResolver(createTradeSchema),
    defaultValues: {
      side: 'LONG',
      closed_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    },
  });

  const entryPrice = watch('entry_price');
  const exitPrice = watch('exit_price');
  const positionSize = watch('position_size');
  const side = watch('side');

  // Auto-calculate P&L when prices change
  const calculatePnL = () => {
    if (!entryPrice || !exitPrice || !positionSize) return { amount: 0, pct: 0 };
    
    let pnlAmount = 0;
    if (side === 'LONG') {
      pnlAmount = (exitPrice - entryPrice) * positionSize;
    } else {
      pnlAmount = (entryPrice - exitPrice) * positionSize;
    }

    const pnlPct = ((pnlAmount / (entryPrice * positionSize)) * 100);
    
    return {
      amount: Number(pnlAmount.toFixed(2)),
      pct: Number(pnlPct.toFixed(2)),
    };
  };

  const calculatedPnL = calculatePnL();

  const createTradeMutation = useMutation({
    mutationFn: async (tradeData: CreateTradeFormData) => {
      // Create the trade with all required fields
      const trade = await tradeRepository.create({
        account_id: accountId,
        symbol: tradeData.symbol,
        side: tradeData.side,
        entry_price: tradeData.entry_price,
        exit_price: tradeData.exit_price,
        position_size: tradeData.position_size,
        pnl_amount: tradeData.pnl_amount,
        pnl_pct: tradeData.pnl_pct,
        risk_used_pct: tradeData.risk_used_pct,
        note: tradeData.note,
        screenshot_url: tradeData.screenshot_url,
        closed_at: tradeData.closed_at,
      });

      // Update account balance and risk percentage
      const account = await accountRepository.getById(accountId);
      if (account) {
        const updatedAccount = updateAccountAfterTrade(account, trade);
        await accountRepository.update(accountId, updatedAccount);
      }

      return trade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast({
        title: 'İşlem eklendi',
        description: 'Yeni işleminiz başarıyla kaydedildi.',
      });
      
      setAddTradeOpen(false);
      reset();
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'İşlem kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateTradeFormData) => {
    const finalTradeData = {
      ...data,
      pnl_amount: calculatedPnL.amount || data.pnl_amount,
      pnl_pct: calculatedPnL.pct || data.pnl_pct,
    };
    createTradeMutation.mutate(finalTradeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setAddTradeOpen(false)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İşlem Ekle</DialogTitle>
          <DialogDescription>
            İşlem detaylarını girin ve hesap bakiyenizi güncelleyin.
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Sembol</Label>
              <Input
                id="symbol"
                placeholder="EURUSD"
                {...register('symbol')}
                className={errors.symbol ? 'border-destructive' : ''}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">{errors.symbol.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">İşlem Yönü</Label>
              <Controller
                name="side"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LONG">LONG</SelectItem>
                      <SelectItem value="SHORT">SHORT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_price">Giriş Fiyatı</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.00001"
                placeholder="1.0850"
                {...register('entry_price', { valueAsNumber: true })}
                className={errors.entry_price ? 'border-destructive' : ''}
              />
              {errors.entry_price && (
                <p className="text-sm text-destructive">{errors.entry_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit_price">Çıkış Fiyatı</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.00001"
                placeholder="1.0875"
                {...register('exit_price', { valueAsNumber: true })}
                className={errors.exit_price ? 'border-destructive' : ''}
              />
              {errors.exit_price && (
                <p className="text-sm text-destructive">{errors.exit_price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position_size">Pozisyon Büyüklüğü (Lot)</Label>
            <Input
              id="position_size"
              type="number"
              step="0.01"
              placeholder="1.00"
              {...register('position_size', { valueAsNumber: true })}
              className={errors.position_size ? 'border-destructive' : ''}
            />
            {errors.position_size && (
              <p className="text-sm text-destructive">{errors.position_size.message}</p>
            )}
          </div>

          {/* Calculated P&L Display */}
          {entryPrice && exitPrice && positionSize && (
            <div className="p-3 rounded-lg gradient-card border">
              <div className="text-sm font-medium mb-2">Hesaplanan P&L</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Miktar: </span>
                  <span className={`font-semibold ${
                    calculatedPnL.amount >= 0 ? 'profit-text' : 'loss-text'
                  }`}>
                    ${calculatedPnL.amount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Yüzde: </span>
                  <span className={`font-semibold ${
                    calculatedPnL.pct >= 0 ? 'profit-text' : 'loss-text'
                  }`}>
                    %{calculatedPnL.pct}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="risk_used_pct">Kullanılan Risk (%)</Label>
            <Input
              id="risk_used_pct"
              type="number"
              step="0.01"
              placeholder="1.00"
              {...register('risk_used_pct', { valueAsNumber: true })}
              className={errors.risk_used_pct ? 'border-destructive' : ''}
            />
            {errors.risk_used_pct && (
              <p className="text-sm text-destructive">{errors.risk_used_pct.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="closed_at">Kapanış Tarihi</Label>
            <Input
              id="closed_at"
              type="datetime-local"
              {...register('closed_at')}
              className={errors.closed_at ? 'border-destructive' : ''}
            />
            {errors.closed_at && (
              <p className="text-sm text-destructive">{errors.closed_at.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot_url">TradingView Screenshot URL (Opsiyonel)</Label>
            <Input
              id="screenshot_url"
              type="url"
              placeholder="https://tradingview.com/..."
              {...register('screenshot_url')}
              className={errors.screenshot_url ? 'border-destructive' : ''}
            />
            {errors.screenshot_url && (
              <p className="text-sm text-destructive">{errors.screenshot_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Not (Opsiyonel)</Label>
            <Textarea
              id="note"
              placeholder="İşlem hakkında notlarınız..."
              {...register('note')}
              className={`min-h-[80px] ${errors.note ? 'border-destructive' : ''}`}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddTradeOpen(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="trading-primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'İşlem Kaydet'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}