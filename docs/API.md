# 📚 API Dokümantasyonu

Trade Pusula 21 API'si, Supabase backend üzerinde çalışan RESTful API'dir.

## 📋 İçindekiler

- [🔐 Kimlik Doğrulama](#-kimlik-doğrulama)
- [💼 Hesap API'si](#-hesap-apisi)
- [📈 İşlem API'si](#-işlem-apisi)
- [🎯 Risk Yönetimi](#-risk-yönetimi)
- [📊 Veri Modelleri](#-veri-modelleri)
- [🔧 Hata Kodları](#-hata-kodları)

---

## 🔐 Kimlik Doğrulama

API, Supabase Auth kullanır. Tüm istekler için geçerli bir JWT token gereklidir.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## 💼 Hesap API'si

### Hesap Listesi

```http
GET /rest/v1/accounts
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Test Hesabı",
    "type": "PreFunded",
    "starting_balance": 100000,
    "current_balance": 99500,
    "risk_current_pct": 1.00,
    "funded_threshold": 110000,
    "created_at": "2024-12-19T10:00:00Z",
    "updated_at": "2024-12-19T15:30:00Z"
  }
]
```

### Hesap Detayı

```http
GET /rest/v1/accounts?id=eq.{account_id}
```

### Hesap Oluşturma

```http
POST /rest/v1/accounts
```

**Request Body:**
```json
{
  "name": "Yeni Hesap",
  "type": "PreFunded",
  "starting_balance": 100000,
  "risk_current_pct": 1.00,
  "funded_threshold": 110000
}
```

### Hesap Güncelleme

```http
PATCH /rest/v1/accounts?id=eq.{account_id}
```

**Request Body:**
```json
{
  "current_balance": 100500,
  "risk_current_pct": 1.25,
  "updated_at": "2024-12-19T16:00:00Z"
}
```

### Hesap Silme

```http
DELETE /rest/v1/accounts?id=eq.{account_id}
```

---

## 📈 İşlem API'si

### İşlem Listesi

```http
GET /rest/v1/trades?account_id=eq.{account_id}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "account_id": "account-uuid",
    "account_type": "PreFunded",
    "symbol": "EURUSD",
    "side": "LONG",
    "trade_type": "ENTRY",
    "entry_price": 1.0850,
    "exit_price": 1.0875,
    "position_size": 1.00,
    "pnl_amount": 250.00,
    "pnl_pct": 0.25,
    "risk_used_pct": 1.00,
    "note": "Başarılı işlem",
    "screenshot_url": "https://...",
    "closed_at": "2024-12-19T14:30:00Z",
    "created_at": "2024-12-19T14:30:00Z"
  }
]
```

### İşlem Oluşturma

```http
POST /rest/v1/trades
```

**Request Body:**
```json
{
  "account_id": "account-uuid",
  "account_type": "PreFunded",
  "symbol": "EURUSD",
  "side": "LONG",
  "trade_type": "ENTRY",
  "entry_price": 1.0850,
  "exit_price": 1.0875,
  "position_size": 1.00,
  "pnl_amount": 250.00,
  "pnl_pct": 0.25,
  "risk_used_pct": 1.00,
  "note": "Başarılı işlem",
  "screenshot_url": "https://...",
  "closed_at": "2024-12-19T14:30:00Z"
}
```

### İşlem Güncelleme

```http
PATCH /rest/v1/trades?id=eq.{trade_id}
```

### İşlem Silme

```http
DELETE /rest/v1/trades?id=eq.{trade_id}
```

---

## 🎯 Risk Yönetimi

### Risk Hesaplama

Risk hesaplama işlemleri client-side yapılır:

```typescript
// Yeni risk yüzdesi hesaplama
function calculateNewRiskPercentage(
  currentRiskPct: number,
  pnlAmount: number,
  accountType: AccountType
): number {
  const maxRisk = RISK_CONSTANTS.MAX_RISK_PCT[accountType];
  
  let newRiskPct = currentRiskPct;
  
  if (pnlAmount > 0) {
    // Kazanç: %0.25 artır
    newRiskPct = Math.min(currentRiskPct + 0.25, maxRisk);
  } else if (pnlAmount < 0) {
    // Zarar: %0.25 azalt
    newRiskPct = Math.max(currentRiskPct - 0.25, 0.25);
  }
  
  return Number(newRiskPct.toFixed(2));
}

// Risk tutarı hesaplama
function calculateDailyRiskAmount(balance: number, riskPct: number): number {
  return Number((balance * (riskPct / 100)).toFixed(2));
}
```

### Risk Sabitleri

```typescript
export const RISK_CONSTANTS = {
  INITIAL_RISK_PCT: 1.00,
  MINIMUM_RISK_PCT: 0.25,
  ADJUSTMENT_STEP: 0.25,
  MAX_RISK_PCT: {
    PreFunded: 2.00,
    Funded: 1.25,
  } as const,
} as const;
```

---

## 📊 Veri Modelleri

### Account Model

```typescript
interface Account {
  id: string;
  name: string;
  type: 'PreFunded' | 'Funded';
  starting_balance: number;
  current_balance: number;
  risk_current_pct: number;
  
  // PreFunded specific
  funded_threshold?: number;
  
  // Funded specific
  daily_loss_limit?: number;
  max_loss_amount?: number;
  profit_target?: number;
  
  created_at: string;
  updated_at: string;
}
```

### Trade Model

```typescript
interface Trade {
  id: string;
  account_id: string;
  account_type: 'PreFunded' | 'Funded';
  symbol: string;
  side: 'LONG' | 'SHORT';
  trade_type: 'ENTRY' | 'TP' | 'SL';
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl_amount: number;
  pnl_pct: number;
  risk_used_pct: number;
  note?: string;
  screenshot_url?: string;
  closed_at: string;
  created_at: string;
}
```

### AccountMetrics Model

```typescript
interface AccountMetrics {
  equity: number;
  daily_risk_amount: number;
  max_loss_reached: boolean;
  daily_loss_limit_reached: boolean;
  remaining_to_funded?: number;
  remaining_to_profit_target?: number;
  daily_loss_remaining?: number;
  daily_pnl?: number;
}
```

---

## 🔧 Hata Kodları

### HTTP Status Codes

- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Geçersiz istek
- `401` - Yetkisiz erişim
- `403` - Yasaklı
- `404` - Bulunamadı
- `422` - Doğrulama hatası
- `500` - Sunucu hatası

### Supabase Error Codes

- `PGRST116` - Geçersiz JWT
- `PGRST204` - Hiçbir satır etkilenmedi
- `PGRST301` - Geçersiz filtre
- `PGRST302` - Geçersiz sıralama

### Örnek Hata Response

```json
{
  "error": "PGRST204",
  "message": "No rows returned",
  "details": "The request did not affect any rows"
}
```

---

## 🔗 Bağlantılar

- [Supabase Documentation](https://supabase.com/docs)
- [PostgREST API](https://postgrest.org/en/stable/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## 📞 Destek

API ile ilgili sorularınız için:
- [GitHub Issues](https://github.com/AlgoWolfx/trade-pusula-21/issues)
- [GitHub Discussions](https://github.com/AlgoWolfx/trade-pusula-21/discussions)
