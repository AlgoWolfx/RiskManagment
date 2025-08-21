import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/ui-store';
import { accountRepository } from '@/lib/repo';
import { createAccountSchema, CreateAccountFormData } from '@/lib/validations/schemas';
import { Account } from '@/lib/domain/types';

export default function AddAccountModal() {
  const { isAddAccountOpen, setAddAccountOpen } = useModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Kullanıcı oturum durumunu kontrol et

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      type: 'PreFunded',
    },
    shouldUnregister: true,
  });

  const accountType = watch('type');

  const createAccountMutation = useMutation({
    mutationFn: (accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => 
      accountRepository.create(accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Hesap oluşturuldu',
        description: 'Yeni hesabınız başarıyla eklendi.',
      });
      setAddAccountOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error?.message || 'Hesap oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateAccountFormData) => {
    console.log("Form gönderildi:", data);
    console.log("Kullanıcı oturum durumu:", user);
    
    if (!user) {
      console.error("Kullanıcı oturum açmamış!");
      toast({
        title: "Oturum Hatası",
        description: "Oturumunuz sonlanmış olabilir. Lütfen yeniden giriş yapın.",
        variant: "destructive"
      });
      return;
    }
    
    // Form verilerini kontrol et
    if (data.type === 'Funded' && (!data.daily_loss_limit || !data.max_loss_amount || !data.profit_target)) {
      console.error("Funded hesap için gerekli alanlar eksik:", {
        daily_loss_limit: data.daily_loss_limit,
        max_loss_amount: data.max_loss_amount,
        profit_target: data.profit_target
      });
      toast({
        title: "Form Hatası",
        description: "Funded hesap için tüm alanları doldurun: Günlük Kayıp Limiti, Maksimum Kayıp Tutarı ve Kâr Hedefi",
        variant: "destructive"
      });
      return;
    }
    
    if (data.type === 'PreFunded' && (!data.funded_threshold || !data.daily_loss_limit || !data.max_loss_amount)) {
      console.error("PreFunded hesap için gerekli alanlar eksik:", {
        funded_threshold: data.funded_threshold,
        daily_loss_limit: data.daily_loss_limit,
        max_loss_amount: data.max_loss_amount
      });
      toast({
        title: "Form Hatası",
        description: "PreFunded hesap için tüm alanları doldurun: Funded Eşiği, Günlük Kayıp Limiti ve Maksimum Kayıp Tutarı",
        variant: "destructive"
      });
      return;
    }
    
    // Hesap türüne göre doğru veri yapısı oluştur
    const accountData = data.type === 'PreFunded' 
      ? {
          name: data.name,
          type: 'PreFunded' as const,
          starting_balance: data.starting_balance,
          current_balance: data.starting_balance,
          risk_current_pct: 1.00,
          funded_threshold: data.funded_threshold!,
          daily_loss_limit: data.daily_loss_limit!,
          max_loss_amount: data.max_loss_amount!,
        }
      : {
          name: data.name,
          type: 'Funded' as const,
          starting_balance: data.starting_balance,
          current_balance: data.starting_balance,
          risk_current_pct: 1.00,
          daily_loss_limit: data.daily_loss_limit!,
          max_loss_amount: data.max_loss_amount!,
          profit_target: data.profit_target!,
        };
    
    console.log("Supabase'e gönderilecek veri:", accountData);
    
    // Mutation'ı çalıştır
    createAccountMutation.mutate(accountData, {
      onError: (error: Error) => {
        console.error("Hesap oluşturma hatası (mutation):", error);
      }
    });
  };

  return (
    <Dialog open={isAddAccountOpen} onOpenChange={setAddAccountOpen}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm shadow-elevated border border-border/50">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-xl font-bold text-cosmic">Yeni Hesap Ekle</DialogTitle>
          <DialogDescription className="text-muted-foreground/90 font-medium">
            Uzay trading platformuna yeni bir hesap ekleyin ve maceraya başlayın.
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            console.error('Hesap formu geçersiz:', formErrors);
            toast({
              title: 'Form Hatası',
              description: 'Lütfen zorunlu alanları doldurun ve hataları düzeltin.',
              variant: 'destructive',
            });
          })}
          onSubmitCapture={(e) => {
            console.log('Form submit yakalandı (capture).', e);
          }}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-3">
            <Label htmlFor="name" className="text-foreground font-semibold">Hesap Adı</Label>
            <Input
              id="name"
              placeholder="Örn: Ana Hesap"
              {...register('name')}
              className={`font-medium ${errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
            />
            {errors.name && (
              <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="type" className="text-foreground font-semibold">Hesap Türü</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.type ? 'border-destructive focus:border-destructive' : ''}>
                    <SelectValue placeholder="Hesap türünü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PreFunded">PreFunded</SelectItem>
                    <SelectItem value="Funded">Funded</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive font-medium">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="starting_balance" className="text-foreground font-semibold">Başlangıç Bakiyesi ($)</Label>
            <Input
              id="starting_balance"
              type="number"
              step="0.01"
              placeholder="10000"
              {...register('starting_balance', { valueAsNumber: true })}
              className={`font-medium ${errors.starting_balance ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
            />
            {errors.starting_balance && (
              <p className="text-sm text-destructive font-medium">{errors.starting_balance.message}</p>
            )}
          </div>

          {accountType === 'PreFunded' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5"
            >
              <div className="space-y-3">
                <Label htmlFor="funded_threshold" className="text-foreground font-semibold">Funded Eşiği ($) *</Label>
                <Input
                  id="funded_threshold"
                  type="number"
                  step="0.01"
                  placeholder="15000"
                  required
                  {...register('funded_threshold', { valueAsNumber: true })}
                  className={`font-medium ${errors.funded_threshold ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.funded_threshold && (
                  <p className="text-sm text-destructive font-medium">{errors.funded_threshold.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="daily_loss_limit" className="text-foreground font-semibold">Günlük Kayıp Limiti ($) *</Label>
                <Input
                  id="daily_loss_limit"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  required
                  {...register('daily_loss_limit', { valueAsNumber: true })}
                  className={`font-medium ${errors.daily_loss_limit ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.daily_loss_limit && (
                  <p className="text-sm text-destructive font-medium">{errors.daily_loss_limit.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="max_loss_amount" className="text-foreground font-semibold">Maksimum Kayıp Tutarı ($) *</Label>
                <Input
                  id="max_loss_amount"
                  type="number"
                  step="0.01"
                  placeholder="2000"
                  required
                  {...register('max_loss_amount', { valueAsNumber: true })}
                  className={`font-medium ${errors.max_loss_amount ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.max_loss_amount && (
                  <p className="text-sm text-destructive font-medium">{errors.max_loss_amount.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {accountType === 'Funded' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5"
            >
              <div className="space-y-3">
                <Label htmlFor="funded_daily_loss_limit" className="text-foreground font-semibold">Günlük Kayıp Limiti ($) *</Label>
                <Input
                  id="funded_daily_loss_limit"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  required
                  {...register('daily_loss_limit', { valueAsNumber: true })}
                  className={`font-medium ${errors.daily_loss_limit ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.daily_loss_limit && (
                  <p className="text-sm text-destructive font-medium">{errors.daily_loss_limit.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="funded_max_loss_amount" className="text-foreground font-semibold">Maksimum Kayıp Tutarı ($) *</Label>
                <Input
                  id="funded_max_loss_amount"
                  type="number"
                  step="0.01"
                  placeholder="2000"
                  required
                  {...register('max_loss_amount', { valueAsNumber: true })}
                  className={`font-medium ${errors.max_loss_amount ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.max_loss_amount && (
                  <p className="text-sm text-destructive font-medium">{errors.max_loss_amount.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="profit_target" className="text-foreground font-semibold">Kâr Hedefi ($) *</Label>
                <Input
                  id="profit_target"
                  type="number"
                  step="0.01"
                  placeholder="20000"
                  required
                  {...register('profit_target', { valueAsNumber: true })}
                  className={`font-medium ${errors.profit_target ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'focus:border-primary focus:ring-primary'}`}
                />
                {errors.profit_target && (
                  <p className="text-sm text-destructive font-medium">{errors.profit_target.message}</p>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddAccountOpen(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="cosmic"
              disabled={isSubmitting}
              className="flex-1"
              onClick={() => console.log('Hesap Oluştur butonuna tıklandı')}
            >
              {isSubmitting ? '🚀 Oluşturuluyor...' : '✨ Hesap Oluştur'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}