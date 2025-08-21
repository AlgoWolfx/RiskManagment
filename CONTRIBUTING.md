# 🤝 Katkıda Bulunma Rehberi

Trade Pusula 21 projesine katkıda bulunmak istediğiniz için teşekkürler! Bu rehber, projeye nasıl katkıda bulunabileceğinizi açıklar.

## 📋 İçindekiler

- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [🐛 Hata Bildirimi](#-hata-bildirimi)
- [💡 Özellik Önerisi](#-özellik-önerisi)
- [🔧 Geliştirme](#-geliştirme)
- [📝 Commit Mesajları](#-commit-mesajları)
- [🎨 Kod Stili](#-kod-stili)
- [🧪 Test](#-test)

---

## 🚀 Hızlı Başlangıç

1. **Repository'yi fork edin**
2. **Local clone oluşturun**
   ```bash
   git clone https://github.com/YOUR_USERNAME/trade-pusula-21.git
   cd trade-pusula-21
   ```
3. **Branch oluşturun**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Değişikliklerinizi yapın**
5. **Commit edin**
   ```bash
   git commit -m "feat: add new feature"
   ```
6. **Push edin**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Pull Request oluşturun**

---

## 🐛 Hata Bildirimi

Hata bildirirken lütfen şu bilgileri ekleyin:

### Hata Raporu Şablonu

```markdown
## 🐛 Hata Açıklaması
Kısa ve net bir açıklama

## 🔄 Tekrar Üretme Adımları
1. '...' sayfasına gidin
2. '...' butonuna tıklayın
3. '...' alanına yazın
4. Hata görünür

## 📱 Beklenen Davranış
Ne olması gerektiği

## 🖥️ Sistem Bilgileri
- İşletim Sistemi: [örn. Windows 11]
- Tarayıcı: [örn. Chrome 120]
- Node.js Versiyonu: [örn. 18.17.0]

## 📸 Ekran Görüntüleri
Varsa ekran görüntüleri ekleyin

## 🔧 Ek Bilgiler
Varsa ek bilgiler
```

---

## 💡 Özellik Önerisi

Yeni özellik önerirken:

### Özellik Önerisi Şablonu

```markdown
## 🚀 Özellik Açıklaması
Özelliğin ne yapacağı

## 💭 Kullanım Senaryosu
Ne zaman ve nasıl kullanılacak

## 🎯 Faydalar
Bu özelliğin sağlayacağı faydalar

## 🔧 Teknik Detaylar
Varsa teknik detaylar

## 📝 Ek Bilgiler
Varsa ek bilgiler
```

---

## 🔧 Geliştirme

### Geliştirme Ortamı Kurulumu

```bash
# Bağımlılıkları yükleyin
npm install

# Development server'ı başlatın
npm run dev

# Linting çalıştırın
npm run lint

# Build oluşturun
npm run build
```

### Kod Standartları

- **TypeScript** kullanın
- **ESLint** kurallarına uyun
- **Prettier** formatını koruyun
- **Component** isimleri PascalCase
- **Function** isimleri camelCase
- **Constant** isimleri UPPER_SNAKE_CASE

### Dosya Organizasyonu

```
src/
├── components/          # UI bileşenleri
│   ├── accounts/        # Hesap bileşenleri
│   ├── trades/          # İşlem bileşenleri
│   └── ui/              # shadcn/ui bileşenleri
├── lib/
│   ├── domain/          # İş mantığı
│   ├── engine/          # Risk engine
│   ├── repo/            # Repository katmanı
│   └── validations/     # Form validasyonları
├── pages/               # Sayfa bileşenleri
├── store/               # State management
└── hooks/               # Custom hooks
```

---

## 📝 Commit Mesajları

[Conventional Commits](https://www.conventionalcommits.org/) standardını kullanın:

### Commit Türleri

- `feat:` - Yeni özellik
- `fix:` - Hata düzeltmesi
- `docs:` - Dokümantasyon değişiklikleri
- `style:` - Kod formatı değişiklikleri
- `refactor:` - Kod refactoring
- `test:` - Test ekleme/düzenleme
- `chore:` - Build süreçleri, araçlar

### Örnekler

```bash
feat: add daily loss limit tracking for funded accounts
fix: resolve risk percentage calculation bug
docs: update README with new features
style: format code with prettier
refactor: simplify risk calculation logic
test: add unit tests for risk engine
chore: update dependencies
```

---

## 🎨 Kod Stili

### TypeScript

```typescript
// Interface tanımları
interface Account {
  id: string;
  name: string;
  type: AccountType;
  current_balance: number;
  risk_current_pct: number;
}

// Function tanımları
export function calculateRiskAmount(
  balance: number, 
  riskPct: number
): number {
  return Number((balance * (riskPct / 100)).toFixed(2));
}

// Component tanımları
export default function AccountCard({ 
  account, 
  metrics 
}: AccountCardProps) {
  return (
    <Card className="gradient-card">
      {/* Component içeriği */}
    </Card>
  );
}
```

### CSS/Tailwind

```css
/* Custom CSS sınıfları */
.gradient-card {
  @apply bg-gradient-to-br from-gray-900 to-gray-800;
}

.profit-text {
  @apply text-green-400;
}

.loss-text {
  @apply text-red-400;
}
```

---

## 🧪 Test

### Test Yazma Kuralları

- Her yeni özellik için test yazın
- Unit testler için Jest kullanın
- Integration testler için React Testing Library kullanın
- Test dosyaları `.test.ts` veya `.test.tsx` uzantısında olsun

### Test Örneği

```typescript
import { render, screen } from '@testing-library/react';
import { calculateRiskAmount } from '@/lib/domain/risk';

describe('Risk Calculation', () => {
  test('should calculate risk amount correctly', () => {
    const balance = 10000;
    const riskPct = 1.5;
    const expected = 150;
    
    expect(calculateRiskAmount(balance, riskPct)).toBe(expected);
  });
});
```

---

## 📞 İletişim

- **GitHub Issues**: [Proje Issues](https://github.com/AlgoWolfx/trade-pusula-21/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AlgoWolfx/trade-pusula-21/discussions)

---

## 🙏 Teşekkürler

Katkıda bulunduğunuz için teşekkürler! 🎉

Her katkınız projeyi daha iyi hale getiriyor.
