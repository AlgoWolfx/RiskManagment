# 🚀 Trade Pusula 21 - Akıllı Risk Yönetimi Platformu

<div align="center">

![Trade Pusula 21](https://img.shields.io/badge/Trade%20Pusula-21-blue?style=for-the-badge&logo=bitcoin)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.55.0-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss)

**Profesyonel Trading Hesap Yönetimi ve Risk Kontrolü**

[🚀 Canlı Demo](#) • [📖 Dokümantasyon](#) • [🐛 Hata Bildir](#)

</div>

---

## 📋 İçindekiler

- [🎯 Özellikler](#-özellikler)
- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🏗️ Teknoloji Stack](#️-teknoloji-stack)
- [📊 Risk Yönetimi Algoritması](#-risk-yönetimi-algoritması)
- [🎨 Ekran Görüntüleri](#-ekran-görüntüleri)
- [🔧 Kurulum](#-kurulum)
- [📁 Proje Yapısı](#-proje-yapısı)
- [🤝 Katkıda Bulunma](#-katkıda-bulunma)
- [📄 Lisans](#-lisans)

---

## 🎯 Özellikler

### 💼 Hesap Yönetimi
- **PreFunded Hesaplar**: Funded eşiğine ulaşma takibi
- **Funded Hesaplar**: Günlük kayıp limiti ve kâr hedefi yönetimi
- **Gerçek Zamanlı Bakiye Takibi**: Otomatik güncelleme
- **Risk Yüzdesi Optimizasyonu**: Akıllı algoritma ile dinamik ayarlama

### 📈 İşlem Takibi
- **Detaylı İşlem Kayıtları**: Giriş/çıkış fiyatları, P&L, risk kullanımı
- **Takvim Görünümü**: Tarih bazlı işlem analizi
- **İşlem İstatistikleri**: Kâr/zarar analizi ve performans metrikleri
- **Screenshot Entegrasyonu**: TradingView görüntüleri

### 🎯 Risk Yönetimi
- **Dinamik Risk Algoritması**: İşlem sonuçlarına göre otomatik ayarlama
- **Günlük Kayıp Limiti**: Funded hesaplar için günlük risk kontrolü
- **Maksimum Kayıp Takibi**: Toplam risk limiti yönetimi
- **Risk Tutarı Hesaplama**: Bakiye bazlı otomatik hesaplama

### 🎨 Kullanıcı Deneyimi
- **Modern UI/UX**: Koyu tema ile profesyonel tasarım
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Gerçek Zamanlı Güncellemeler**: React Query ile cache yönetimi
- **Animasyonlar**: Framer Motion ile akıcı geçişler

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı

### Kurulum

```bash
# 1. Repository'yi klonlayın
git clone https://github.com/AlgoWolfx/trade-pusula-21.git

# 2. Proje dizinine gidin
cd trade-pusula-21

# 3. Bağımlılıkları yükleyin
npm install

# 4. Environment değişkenlerini ayarlayın
cp .env.example .env.local

# 5. Development server'ı başlatın
npm run dev
```

### Environment Değişkenleri

`.env.local` dosyasını oluşturun:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🏗️ Teknoloji Stack

### Frontend
- **React 18.3.1** - Modern UI framework
- **TypeScript 5.8.3** - Tip güvenliği
- **Vite 5.4.19** - Hızlı build tool
- **React Router 6.30.1** - Client-side routing
- **React Query 5.83.0** - Server state management

### UI/UX
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Framer Motion 12.23.12** - Animasyonlar
- **Lucide React 0.462.0** - İkonlar
- **Radix UI** - Accessible components

### Backend & Database
- **Supabase 2.55.0** - Backend as a Service
- **PostgreSQL** - Relational database
- **Real-time subscriptions** - Canlı veri güncellemeleri

### Form & Validation
- **React Hook Form 7.61.1** - Form yönetimi
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers 3.10.0** - Form validation

### State Management
- **Zustand 5.0.7** - Lightweight state management
- **React Query** - Server state caching

---

## 📊 Risk Yönetimi Algoritması

### PreFunded Hesaplar
```
Başlangıç Risk: %1.00
Kazanç → Risk: %1.00 (sabit)
Zarar → Risk: %0.75 (sabit)
```

### Funded Hesaplar
```
Başlangıç Risk: %1.00
Maksimum Risk: %1.25
Kazanç → Risk: +%0.25 (max %1.25'te durur)
Zarar → Risk: -%0.25 (min %0.25'te durur)
```

### Risk Tutarı Hesaplama
```
Risk Tutarı = Güncel Bakiye × Risk Yüzdesi
```

### Günlük Kayıp Limiti (Funded)
```
Kalan Günlük Limit = Günlük Limit - Bugünkü Zarar
```

---

## 🎨 Ekran Görüntüleri

### Dashboard
![Dashboard](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Dashboard+Görünümü)

### Hesap Detayı
![Account Detail](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Hesap+Detayı)

### İşlem Ekleme
![Add Trade](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=İşlem+Ekleme)

---

## 🔧 Kurulum

### Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Production Deployment

```bash
# Build
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, Railway, etc.)
```

---

## 📁 Proje Yapısı

```
trade-pusula-21/
├── src/
│   ├── components/          # UI bileşenleri
│   │   ├── accounts/        # Hesap bileşenleri
│   │   ├── trades/          # İşlem bileşenleri
│   │   └── ui/              # shadcn/ui bileşenleri
│   ├── lib/
│   │   ├── domain/          # İş mantığı
│   │   ├── engine/          # Risk engine
│   │   ├── repo/            # Repository katmanı
│   │   └── validations/     # Form validasyonları
│   ├── pages/               # Sayfa bileşenleri
│   ├── store/               # State management
│   └── hooks/               # Custom hooks
├── public/                  # Statik dosyalar
├── dist/                    # Build çıktısı
└── docs/                    # Dokümantasyon
```

---

## 🤝 Katkıda Bulunma

1. **Fork** yapın
2. **Feature branch** oluşturun (`git checkout -b feature/amazing-feature`)
3. **Commit** yapın (`git commit -m 'Add amazing feature'`)
4. **Push** yapın (`git push origin feature/amazing-feature`)
5. **Pull Request** oluşturun

### Geliştirme Kuralları

- TypeScript kullanın
- ESLint kurallarına uyun
- Test yazın (gelecekte eklenecek)
- Commit mesajlarını açıklayıcı yazın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🙏 Teşekkürler

- [shadcn/ui](https://ui.shadcn.com/) - Harika component library
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animasyonlar

---

<div align="center">

**Made with ❤️ by AlgoWolfx**

[![GitHub](https://img.shields.io/badge/GitHub-AlgoWolfx-181717?style=for-the-badge&logo=github)](https://github.com/AlgoWolfx)

</div>
