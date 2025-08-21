# 🔒 Güvenlik Politikası

## 📋 İçindekiler

- [🚨 Güvenlik Açığı Bildirimi](#-güvenlik-açığı-bildirimi)
- [🛡️ Güvenlik Önlemleri](#️-güvenlik-önlemleri)
- [🔐 Veri Güvenliği](#-veri-güvenliği)
- [📞 İletişim](#-iletişim)

---

## 🚨 Güvenlik Açığı Bildirimi

Güvenlik açığı bulduysanız, lütfen **özel olarak** bize bildirin. GitHub Issues'da güvenlik açıklarını paylaşmayın.

### Güvenlik Açığı Bildirme Süreci

1. **E-posta ile Bildirin**
   - E-posta: [security@example.com](mailto:security@example.com)
   - Konu: `[SECURITY] Trade Pusula 21 - Güvenlik Açığı`

2. **Bildirim İçeriği**
   ```
   Güvenlik Açığı Türü: [örn. XSS, SQL Injection, etc.]
   Etkilenen Bileşen: [örn. Login form, API endpoint, etc.]
   Açıklama: [Detaylı açıklama]
   Tekrar Üretme Adımları: [Adım adım]
   Etki: [Potansiyel etki]
   ```

3. **Yanıt Süresi**
   - İlk yanıt: 24 saat içinde
   - Detaylı değerlendirme: 72 saat içinde
   - Düzeltme planı: 1 hafta içinde

---

## 🛡️ Güvenlik Önlemleri

### Frontend Güvenliği

- **Input Validation**: Tüm kullanıcı girdileri Zod ile doğrulanır
- **XSS Koruması**: React'in built-in XSS koruması
- **CSRF Koruması**: Supabase Auth ile CSRF koruması
- **Content Security Policy**: Strict CSP kuralları

### Backend Güvenliği

- **Row Level Security (RLS)**: Supabase RLS politikaları
- **SQL Injection Koruması**: Supabase ORM kullanımı
- **Rate Limiting**: API rate limiting
- **Authentication**: JWT tabanlı kimlik doğrulama

### Veri Güvenliği

- **Encryption**: Veriler transit ve rest halinde şifrelenir
- **Backup**: Düzenli veritabanı yedekleme
- **Access Control**: Role-based access control
- **Audit Logging**: Tüm işlemler loglanır

---

## 🔐 Veri Güvenliği

### Kullanıcı Verileri

- **Kişisel Veriler**: Minimum veri toplama prensibi
- **Veri Saklama**: Sadece gerekli veriler saklanır
- **Veri Silme**: Kullanıcı verilerini silme hakkı
- **Veri Taşınabilirliği**: Veri export özelliği

### Finansal Veriler

- **Hassas Veriler**: Finansal veriler şifrelenir
- **Erişim Kontrolü**: Sadece yetkili kullanıcılar
- **Audit Trail**: Tüm finansal işlemler loglanır
- **Backup**: Finansal veriler düzenli yedeklenir

---

## 📞 İletişim

### Güvenlik İletişimi

- **E-posta**: [security@example.com](mailto:security@example.com)
- **PGP Key**: [Güvenlik PGP Anahtarı](#)
- **Güvenlik Advisories**: [GitHub Security Advisories](https://github.com/AlgoWolfx/trade-pusula-21/security/advisories)

### Genel İletişim

- **GitHub Issues**: [Proje Issues](https://github.com/AlgoWolfx/trade-pusula-21/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AlgoWolfx/trade-pusula-21/discussions)

---

## 🔄 Güvenlik Güncellemeleri

### Düzenli Güvenlik Kontrolleri

- **Dependency Scanning**: Haftalık güvenlik taraması
- **Code Review**: Tüm kod değişiklikleri gözden geçirilir
- **Penetration Testing**: Aylık güvenlik testleri
- **Security Updates**: Güvenlik güncellemeleri otomatik uygulanır

### Güvenlik Versiyonları

- **Patch Releases**: Güvenlik düzeltmeleri için
- **Security Advisories**: GitHub Security Advisories
- **CVE Reporting**: CVE numaraları atanır

---

## 📋 Güvenlik Checklist

### Geliştirici Checklist

- [ ] Input validation uygulandı
- [ ] Authentication kontrol edildi
- [ ] Authorization kontrol edildi
- [ ] SQL injection koruması
- [ ] XSS koruması
- [ ] CSRF koruması
- [ ] Rate limiting uygulandı
- [ ] Error handling güvenli
- [ ] Logging uygun seviyede
- [ ] Secrets environment variables'da

### Deployment Checklist

- [ ] HTTPS zorunlu
- [ ] Security headers ayarlandı
- [ ] CSP kuralları uygulandı
- [ ] HSTS etkinleştirildi
- [ ] Rate limiting aktif
- [ ] Monitoring aktif
- [ ] Backup stratejisi
- [ ] Incident response planı

---

## 🙏 Teşekkürler

Güvenlik açıklarını bildiren herkese teşekkürler! 

Güvenlik topluluğunun katkıları projeyi daha güvenli hale getiriyor.
