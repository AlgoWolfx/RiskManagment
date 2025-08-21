# 🚀 Deployment Rehberi

Trade Pusula 21 projesini farklı platformlarda nasıl deploy edeceğinizi öğrenin.

## 📋 İçindekiler

- [🔧 Ön Gereksinimler](#-ön-gereksinimler)
- [☁️ Vercel Deployment](#️-vercel-deployment)
- [🌐 Netlify Deployment](#-netlify-deployment)
- [⚡ Railway Deployment](#-railway-deployment)
- [🐳 Docker Deployment](#-docker-deployment)
- [🔧 Environment Variables](#-environment-variables)
- [📊 Performance Optimizasyonu](#-performance-optimizasyonu)

---

## 🔧 Ön Gereksinimler

### Supabase Kurulumu

1. **Supabase Projesi Oluşturun**
   - [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
   - "New Project" butonuna tıklayın
   - Proje adını ve şifresini belirleyin
   - Region seçin (en yakın bölgeyi seçin)

2. **Veritabanı Tablolarını Oluşturun**

```sql
-- PreFunded hesaplar tablosu
CREATE TABLE prefunded_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  starting_balance DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  risk_current_pct DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  funded_threshold DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funded hesaplar tablosu
CREATE TABLE funded_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  starting_balance DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  risk_current_pct DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  daily_loss_limit DECIMAL(15,2),
  max_loss_amount DECIMAL(15,2),
  profit_target DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İşlemler tablosu
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('PreFunded', 'Funded')),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('ENTRY', 'TP', 'SL')),
  entry_price DECIMAL(10,5) NOT NULL,
  exit_price DECIMAL(10,5) NOT NULL,
  position_size DECIMAL(10,2) NOT NULL,
  pnl_amount DECIMAL(15,2) NOT NULL,
  pnl_pct DECIMAL(5,2) NOT NULL,
  risk_used_pct DECIMAL(5,2) NOT NULL,
  note TEXT,
  screenshot_url TEXT,
  closed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexler
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_closed_at ON trades(closed_at);
```

3. **RLS (Row Level Security) Ayarları**

```sql
-- RLS'yi etkinleştirin
ALTER TABLE prefunded_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE funded_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Politikalar oluşturun (auth kullanıyorsanız)
CREATE POLICY "Users can view own accounts" ON prefunded_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON prefunded_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON prefunded_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Aynı politikaları funded_accounts ve trades için de oluşturun
```

4. **API Anahtarlarını Alın**
   - Project Settings > API
   - Project URL ve anon key'i kopyalayın

---

## ☁️ Vercel Deployment

### 1. Vercel CLI ile Deployment

```bash
# Vercel CLI'yi yükleyin
npm i -g vercel

# Proje dizininde
cd trade-pusula-21

# Build oluşturun
npm run build

# Deploy edin
vercel

# Production'a deploy edin
vercel --prod
```

### 2. Vercel Dashboard ile Deployment

1. **GitHub Repository'yi Bağlayın**
   - [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
   - "New Project" butonuna tıklayın
   - GitHub repository'nizi seçin

2. **Build Ayarları**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**
   - "Deploy" butonuna tıklayın

### 3. Vercel Configuration

`vercel.json` dosyası oluşturun:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🌐 Netlify Deployment

### 1. Netlify CLI ile Deployment

```bash
# Netlify CLI'yi yükleyin
npm install -g netlify-cli

# Proje dizininde
cd trade-pusula-21

# Build oluşturun
npm run build

# Deploy edin
netlify deploy --dir=dist --prod
```

### 2. Netlify Dashboard ile Deployment

1. **GitHub Repository'yi Bağlayın**
   - [Netlify Dashboard](https://app.netlify.com/)'a gidin
   - "New site from Git" butonuna tıklayın
   - GitHub repository'nizi seçin

2. **Build Ayarları**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Netlify Configuration

`netlify.toml` dosyası oluşturun:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## ⚡ Railway Deployment

### 1. Railway CLI ile Deployment

```bash
# Railway CLI'yi yükleyin
npm install -g @railway/cli

# Login olun
railway login

# Proje oluşturun
railway init

# Deploy edin
railway up
```

### 2. Railway Dashboard ile Deployment

1. **GitHub Repository'yi Bağlayın**
   - [Railway Dashboard](https://railway.app/)'a gidin
   - "New Project" butonuna tıklayın
   - "Deploy from GitHub repo" seçin

2. **Build Ayarları**
   ```
   Build Command: npm run build
   Start Command: npm run preview
   ```

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

---

## 🐳 Docker Deployment

### 1. Dockerfile Oluşturun

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Nginx Configuration

`nginx.conf` dosyası oluşturun:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 3. Docker Compose

`docker-compose.yml` dosyası oluşturun:

```yaml
version: '3.8'

services:
  trade-pusula:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

### 4. Docker Deployment

```bash
# Build image
docker build -t trade-pusula-21 .

# Run container
docker run -d -p 80:80 --env-file .env.local trade-pusula-21

# Docker Compose ile
docker-compose up -d
```

---

## 🔧 Environment Variables

### Gerekli Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn
```

### Environment Variables Kontrolü

```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  analytics: {
    id: import.meta.env.VITE_ANALYTICS_ID,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },
};

// Environment variables kontrolü
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing required environment variables');
}
```

---

## 📊 Performance Optimizasyonu

### 1. Build Optimizasyonu

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          utils: ['date-fns', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

### 2. Code Splitting

```typescript
// Lazy loading components
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const AddTradeModal = lazy(() => import('@/components/trades/AddTradeModal'));

// Suspense ile sarmalayın
<Suspense fallback={<LoadingSpinner />}>
  <AccountDetail />
</Suspense>
```

### 3. Image Optimization

```typescript
// Vite plugin for image optimization
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
    }),
  ],
});
```

---

## 🔗 Bağlantılar

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📞 Destek

Deployment ile ilgili sorularınız için:
- [GitHub Issues](https://github.com/AlgoWolfx/trade-pusula-21/issues)
- [GitHub Discussions](https://github.com/AlgoWolfx/trade-pusula-21/discussions)
