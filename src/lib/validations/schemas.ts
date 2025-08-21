// Zod validation schemas

import { z } from 'zod';

// NaN veya boş string değerlerini optional alanlar için undefined'a çevirir
const optionalNumber = (min: number, minMsg: string, max: number, maxMsg: string) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'number' && Number.isNaN(val)) return undefined;
    return val;
  }, z.number().min(min, minMsg).max(max, maxMsg)).optional();

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Hesap adı gereklidir').max(50, 'Hesap adı çok uzun'),
  type: z.enum(['PreFunded', 'Funded'], {
    required_error: 'Hesap türü seçilmelidir',
  }),
  starting_balance: z.number()
    .min(100, 'Başlangıç bakiyesi en az $100 olmalıdir')
    .max(1000000, 'Başlangıç bakiyesi çok yüksek'),
  
  // PreFunded specific
  funded_threshold: optionalNumber(100, 'Funded eşiği en az $100 olmalıdır', 2000000, 'Funded eşiği çok yüksek'),
  
  // Funded specific
  daily_loss_limit: optionalNumber(50, 'Günlük kayıp limiti en az $50 olmalıdır', 50000, 'Günlük kayıp limiti çok yüksek'),
  max_loss_amount: optionalNumber(100, 'Maksimum kayıp tutarı en az $100 olmalıdır', 100000, 'Maksimum kayıp tutarı çok yüksek'),
  profit_target: optionalNumber(100, 'Kâr hedefi en az $100 olmalıdır', 5000000, 'Kâr hedefi çok yüksek'),
}).refine((data) => {
  if (data.type === 'PreFunded') {
    return data.funded_threshold !== undefined && 
           data.daily_loss_limit !== undefined && 
           data.max_loss_amount !== undefined;
  }
  return true;
}, {
  message: 'PreFunded hesaplar için funded eşiği, günlük kayıp limiti ve maksimum kayıp tutarı gereklidir',
  path: ['funded_threshold'],
}).refine((data) => {
  if (data.type === 'Funded') {
    return data.daily_loss_limit !== undefined && 
           data.max_loss_amount !== undefined && 
           data.profit_target !== undefined;
  }
  return true;
}, {
  message: 'Funded hesaplar için günlük kayıp limiti, maksimum kayıp tutarı ve kâr hedefi gereklidir',
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
  
  trade_type: z.enum(['ENTRY', 'TP', 'SL'], {
    required_error: 'İşlem türü seçilmelidir',
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