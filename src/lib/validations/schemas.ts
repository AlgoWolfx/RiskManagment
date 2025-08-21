// Zod validation schemas

import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Hesap adı gereklidir').max(50, 'Hesap adı çok uzun'),
  type: z.enum(['PreFunded', 'Funded'], {
    required_error: 'Hesap türü seçilmelidir',
  }),
  starting_balance: z.number()
    .min(100, 'Başlangıç bakiyesi en az $100 olmalıdir')
    .max(1000000, 'Başlangıç bakiyesi çok yüksek'),
  
  // PreFunded specific
  funded_threshold: z.number()
    .min(100, 'Funded eşiği en az $100 olmalıdır')
    .max(2000000, 'Funded eşiği çok yüksek')
    .optional(),
  
  // Funded specific
  daily_loss_limit: z.number()
    .min(50, 'Günlük kayıp limiti en az $50 olmalıdır')
    .max(50000, 'Günlük kayıp limiti çok yüksek')
    .optional(),
  max_loss_amount: z.number()
    .min(100, 'Maksimum kayıp tutarı en az $100 olmalıdır')
    .max(100000, 'Maksimum kayıp tutarı çok yüksek')
    .optional(),
  profit_target: z.number()
    .min(100, 'Kâr hedefi en az $100 olmalıdır')
    .max(5000000, 'Kâr hedefi çok yüksek')
    .optional(),
}).refine((data) => {
  if (data.type === 'PreFunded') {
    return data.funded_threshold !== undefined;
  }
  return true;
}, {
  message: 'PreFunded hesaplar için funded eşiği gereklidir',
  path: ['funded_threshold'],
}).refine((data) => {
  if (data.type === 'Funded') {
    return data.daily_loss_limit !== undefined && data.max_loss_amount !== undefined;
  }
  return true;
}, {
  message: 'Funded hesaplar için günlük kayıp limiti ve maksimum kayıp tutarı gereklidir',
  path: ['daily_loss_limit'],
});

export const createTradeSchema = z.object({
  symbol: z.string()
    .min(1, 'Sembol gereklidir')
    .max(20, 'Sembol çok uzun')
    .regex(/^[A-Z0-9]+$/, 'Sembol sadece büyük harf ve rakam içermelidir'),
  
  side: z.enum(['LONG', 'SHORT'], {
    required_error: 'İşlem yönü seçilmelidir',
  }),
  
  entry_price: z.number()
    .min(0.001, 'Giriş fiyatı 0\'dan büyük olmalıdır')
    .max(1000000, 'Giriş fiyatı çok yüksek'),
  
  exit_price: z.number()
    .min(0.001, 'Çıkış fiyatı 0\'dan büyük olmalıdır')
    .max(1000000, 'Çıkış fiyatı çok yüksek'),
  
  position_size: z.number()
    .min(0.001, 'Pozisyon büyüklüğü 0\'dan büyük olmalıdır')
    .max(1000000, 'Pozisyon büyüklüğü çok yüksek')
    .optional(),
  
  pnl_amount: z.number()
    .min(-100000, 'P&L tutarı çok düşük')
    .max(100000, 'P&L tutarı çok yüksek'),
  
  pnl_pct: z.number()
    .min(-100, 'P&L yüzdesi çok düşük')
    .max(1000, 'P&L yüzdesi çok yüksek')
    .optional(),
  
  risk_used_pct: z.number()
    .min(0.01, 'Kullanılan risk en az %0.01 olmalıdır')
    .max(10, 'Kullanılan risk en fazla %10 olabilir'),
  
  note: z.string()
    .max(500, 'Not çok uzun')
    .optional(),
  
  screenshot_url: z.string()
    .url('Geçerli bir URL giriniz')
    .optional()
    .or(z.literal('')),
  
  closed_at: z.string()
    .min(1, 'Kapanış tarihi gereklidir'),
});

export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type CreateTradeFormData = z.infer<typeof createTradeSchema>;