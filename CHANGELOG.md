# 📝 Değişiklik Geçmişi

Bu dosya, Trade Pusula 21 projesindeki tüm önemli değişiklikleri listeler.

Format [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) standardına uygun olarak hazırlanmıştır.

## [1.0.0] - 2024-12-19

### 🚀 Eklenenler
- **Hesap Yönetimi Sistemi**
  - PreFunded hesap desteği
  - Funded hesap desteği
  - Gerçek zamanlı bakiye takibi
  - Otomatik risk yüzdesi hesaplama

- **İşlem Takip Sistemi**
  - Detaylı işlem kayıtları
  - P&L hesaplama
  - Risk kullanım takibi
  - Screenshot entegrasyonu

- **Risk Yönetimi Algoritması**
  - Dinamik risk yüzdesi ayarlama
  - Günlük kayıp limiti takibi
  - Maksimum kayıp kontrolü
  - Otomatik risk tutarı hesaplama

- **Kullanıcı Arayüzü**
  - Modern koyu tema tasarım
  - Responsive layout
  - Dashboard görünümü
  - Hesap detay sayfaları
  - İşlem ekleme/düzenleme modalları

- **Teknik Özellikler**
  - TypeScript desteği
  - React Query ile cache yönetimi
  - Supabase backend entegrasyonu
  - Real-time veri güncellemeleri
  - Form validasyonu (Zod)

### 🔧 Teknik Detaylar
- **Frontend**: React 18.3.1, TypeScript 5.8.3, Vite 5.4.19
- **UI Framework**: Tailwind CSS 3.4.17, shadcn/ui
- **Backend**: Supabase 2.55.0, PostgreSQL
- **State Management**: Zustand 5.0.7, React Query 5.83.0
- **Form Management**: React Hook Form 7.61.1, Zod 3.25.76

### 🎯 Risk Algoritması
- **PreFunded Hesaplar**: Kazançta %1.00, zararda %0.75 sabit risk
- **Funded Hesaplar**: Kazançta +%0.25, zararda -%0.25 dinamik risk
- **Maksimum Risk**: Funded hesaplar için %1.25 üst limit
- **Minimum Risk**: Tüm hesaplar için %0.25 alt limit

### 📊 Veritabanı Yapısı
- **prefunded_accounts**: PreFunded hesap bilgileri
- **funded_accounts**: Funded hesap bilgileri
- **trades**: İşlem kayıtları
- **Real-time subscriptions**: Canlı veri güncellemeleri

---

## [Unreleased]

### 🚀 Planlanan Özellikler
- [ ] İşlem düzenleme özelliği
- [ ] Gelişmiş istatistikler ve grafikler
- [ ] Takvim görünümü iyileştirmeleri
- [ ] Export/import özellikleri
- [ ] Çoklu dil desteği
- [ ] Mobil uygulama
- [ ] API dokümantasyonu
- [ ] Unit testler
- [ ] E2E testler

### 🔧 Teknik İyileştirmeler
- [ ] Performance optimizasyonları
- [ ] Code splitting
- [ ] Bundle size optimizasyonu
- [ ] SEO iyileştirmeleri
- [ ] PWA desteği
- [ ] Offline çalışma modu

---

## 📋 Sürüm Numaralandırma

Bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır:

- **MAJOR**: Uyumsuz API değişiklikleri
- **MINOR**: Geriye uyumlu yeni özellikler
- **PATCH**: Geriye uyumlu hata düzeltmeleri

---

## 🔗 Bağlantılar

- [GitHub Repository](https://github.com/AlgoWolfx/trade-pusula-21)
- [Issues](https://github.com/AlgoWolfx/trade-pusula-21/issues)
- [Releases](https://github.com/AlgoWolfx/trade-pusula-21/releases)
