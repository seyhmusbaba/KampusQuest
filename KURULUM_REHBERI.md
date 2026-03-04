# MKÜ Campus Game — Kurulum ve Çalıştırma Rehberi

**Hatay Mustafa Kemal Üniversitesi Tayfur Sökmen Kampüsü**  
**Web Tabanlı Multiplayer Kampüs Oyunu**

---

## İçindekiler

1. [Proje Yapısı](#1-proje-yapısı)
2. [Ön Koşullar](#2-ön-koşullar)
3. [MongoDB Kurulumu](#3-mongodb-kurulumu)
4. [Backend Kurulumu](#4-backend-kurulumu)
5. [Frontend Kurulumu](#5-frontend-kurulumu)
6. [İlk Çalıştırma](#6-i̇lk-çalıştırma)
7. [Oyun Nasıl Oynanır](#7-oyun-nasıl-oynanır)
8. [Sorun Giderme](#8-sorun-giderme)
9. [Production Deploy](#9-production-deploy)

---

## 1. Proje Yapısı

```
campusgame/
│
├── backend/                         ← Node.js sunucu
│   ├── .env                         ← Ortam değişkenleri (düzenlenecek)
│   ├── package.json
│   └── src/
│       ├── server.js                ← Ana giriş noktası
│       ├── models/
│       │   ├── User.js              ← Kullanıcı + XP + seviye sistemi
│       │   ├── Message.js           ← Sohbet mesajları (7 gün TTL)
│       │   └── Quest.js             ← Görev sistemi
│       ├── routes/
│       │   ├── auth.js              ← Kayıt / Giriş / Profil
│       │   └── game.js              ← Sıralama / Mesajlar / İstatistik
│       ├── middleware/
│       │   └── auth.js              ← JWT doğrulama
│       └── socket/
│           └── gameSocket.js        ← Gerçek zamanlı oyun motoru
│
├── frontend/                        ← React uygulaması
│   ├── .env                         ← API adresleri
│   ├── package.json
│   └── src/
│       ├── App.js                   ← Ana uygulama
│       ├── index.js                 ← React girişi
│       ├── assets/
│       │   └── campus-map.json      ← MKÜ kampüs harita verisi
│       ├── components/
│       │   ├── AuthPage.jsx         ← Giriş / Kayıt ekranı
│       │   ├── GamePage.jsx         ← Ana oyun sayfası
│       │   ├── GameCanvas.jsx       ← Canvas render + hareket motoru
│       │   ├── GameHUD.jsx          ← XP bar, bildirimler, HUD
│       │   ├── ChatPanel.jsx        ← Alan bazlı sohbet
│       │   └── LeaderboardPanel.jsx ← Sıralama tablosu
│       ├── hooks/
│       │   ├── useAuth.js           ← JWT kimlik doğrulama
│       │   └── useGameSocket.js     ← Socket.io bağlantısı
│       └── utils/
│           ├── projection.js        ← lat/lng ↔ canvas koordinat dönüşümü
│           ├── renderer.js          ← Canvas 2D render motoru
│           └── api.js               ← Axios HTTP istemcisi
│
└── scripts/
    ├── fetch-osm-data.js            ← OpenStreetMap'ten veri çeken script
    └── generate-real-map.js         ← Gerçek koordinatlı harita üreteci
```

---

## 2. Ön Koşullar

### Gerekli Yazılımlar

Aşağıdaki yazılımların sisteminizde kurulu olması gerekir:

#### Node.js (v18 veya üzeri)

```bash
# Sürümü kontrol et
node --version
# v18.x.x veya üzeri çıkmalı

npm --version
# 9.x.x veya üzeri çıkmalı
```

**Node.js yüklü değilse:**
- https://nodejs.org adresine gidin
- "LTS" (Long Term Support) sürümünü indirin
- Kurulum sihirbazını takip edin
- Terminal/Komut İstemi'ni yeniden açın

#### MongoDB (v6 veya üzeri)

```bash
# Sürümü kontrol et
mongod --version
# db version v6.x.x veya üzeri çıkmalı
```

**MongoDB yüklü değilse:** Aşağıdaki bölümü okuyun.

#### Git (opsiyonel)

```bash
git --version
```

---

## 3. MongoDB Kurulumu

### Windows'ta MongoDB Kurulumu

1. https://www.mongodb.com/try/download/community adresine gidin
2. **"Windows"** seçin, **"msi"** paketi indirin
3. İndirilen `.msi` dosyasını çalıştırın
4. Kurulum sihirbazında:
   - "Complete" kurulum tipini seçin
   - **"Install MongoDB as a Service"** kutusunu işaretleyin (önemli!)
   - "Run service as Network Service user" seçili kalsın
   - "Install MongoDB Compass" seçeneğini işaretleyebilirsiniz (görsel arayüz)
5. Kurulumu tamamlayın

**Servis durumunu kontrol etmek için:**
```bash
# Windows PowerShell (Yönetici olarak)
Get-Service MongoDB
# Running yazmalı

# Eğer çalışmıyorsa başlat:
Start-Service MongoDB
```

### macOS'ta MongoDB Kurulumu

```bash
# Homebrew ile (Homebrew yoksa: https://brew.sh)
brew tap mongodb/brew
brew install mongodb-community@7.0

# Servisi başlat
brew services start mongodb/brew/mongodb-community

# Çalışıyor mu kontrol et
brew services list | grep mongodb
```

### Ubuntu/Linux'ta MongoDB Kurulumu

```bash
# GPG anahtarı ekle
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Repository ekle
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multirelease" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Güncelle ve kur
sudo apt-get update
sudo apt-get install -y mongodb-org

# Başlat ve otomatik başlangıca ekle
sudo systemctl start mongod
sudo systemctl enable mongod

# Kontrol
sudo systemctl status mongod
```

### MongoDB Bağlantısını Test Et

```bash
# MongoDB shell aç
mongosh

# Bağlantı başarılıysa şunu görürsünüz:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/...
# test>

# Çıkmak için:
exit
```

---

## 4. Backend Kurulumu

### Adım 4.1 — Backend klasörüne gir

```bash
cd campusgame/backend
```

### Adım 4.2 — Bağımlılıkları yükle

```bash
npm install
```

Bu komut şu paketleri yükler:
- `express` — Web sunucusu
- `socket.io` — Gerçek zamanlı iletişim
- `mongoose` — MongoDB bağlantısı
- `jsonwebtoken` — JWT kimlik doğrulama
- `bcryptjs` — Şifre şifreleme
- `cors` — Cross-Origin Resource Sharing
- `helmet` — Güvenlik başlıkları
- `express-rate-limit` — İstek sınırlama
- `morgan` — HTTP log
- `dotenv` — Ortam değişkenleri

### Adım 4.3 — .env dosyasını düzenle

`backend/.env` dosyasını bir metin editörüyle aç:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusgame
JWT_SECRET=mku_campus_game_jwt_secret_change_in_production_2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Değiştirmen gereken tek şey:**
- `JWT_SECRET` — Production'da güçlü, rastgele bir string yaz (en az 32 karakter)

**Geliştirme için diğer değerleri olduğu gibi bırakabilirsin.**

### Adım 4.4 — Backend'i başlat

```bash
# Geliştirme modu (otomatik yeniden başlatır)
npm run dev

# Normal başlatma
npm start
```

**Başarılı çıktı şöyle görünmeli:**

```
✅ MongoDB bağlandı: mongodb://localhost:27017/campusgame

🚀 CampusGame Backend çalışıyor
   Port     : 5000
   API      : http://localhost:5000/api
   Health   : http://localhost:5000/api/health
   MongoDB  : mongodb://localhost:27017/campusgame
   Env      : development
```

### Adım 4.5 — Backend'i test et

Tarayıcıda veya terminalde:

```bash
curl http://localhost:5000/api/health
```

Şunu görmelisin:
```json
{
  "status": "ok",
  "uptime": 5.23,
  "timestamp": "2026-02-25T10:30:00.000Z",
  "db": "connected"
}
```

---

## 5. Frontend Kurulumu

### Adım 5.1 — Yeni terminal aç, frontend klasörüne gir

```bash
# Backend'i çalışır halde bırak, yeni terminal aç
cd campusgame/frontend
```

### Adım 5.2 — Bağımlılıkları yükle

```bash
npm install
```

Bu işlem internet hızına göre 2-5 dakika sürebilir.

### Adım 5.3 — .env dosyasını kontrol et

`frontend/.env` dosyası:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Backend farklı bir port veya makinede çalışıyorsa** bu adresleri güncelle.

### Adım 5.4 — Frontend'i başlat

```bash
npm start
```

**Başarılı çıktı:**

```
Compiled successfully!

You can now view campusgame-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

webpack compiled successfully
```

Tarayıcı otomatik açılır. Açılmazsa: **http://localhost:3000**

---

## 6. İlk Çalıştırma

### Adım 6.1 — İki terminal çalışır durumda olmalı

| Terminal | Klasör | Komut | Durum |
|---|---|---|---|
| Terminal 1 | `backend/` | `npm run dev` | ✅ Port 5000 |
| Terminal 2 | `frontend/` | `npm start` | ✅ Port 3000 |

### Adım 6.2 — Kayıt Ol

1. Tarayıcıda **http://localhost:3000** aç
2. "KAYIT" sekmesine tıkla
3. Formu doldur:
   - **Kullanıcı Adı:** En az 3 karakter
   - **E-posta:** Geçerli bir e-posta
   - **Şifre:** En az 6 karakter
   - **Fakülte:** Listeden seçim yap (opsiyonel)
4. "HESAP OLUŞTUR →" butonuna tıkla

### Adım 6.3 — Kampüse Giriş

Kayıt başarılıysa otomatik olarak oyun ekranına yönlendirilirsin:

- Sol üstte **kullanıcı adın ve XP barın** görünür
- Sağ üstte **online oyuncu sayısı** görünür
- Haritada **MKÜ Tayfur Sökmen Kampüsü** binalarını görürsün
- **Renkli daireler** oyun lokasyonlarını gösterir (XP kazanılan alanlar)

### Adım 6.4 — Multiplayer Test

Aynı anda birden fazla oyuncuyla test etmek için:

1. Farklı bir tarayıcı aç (veya gizli/inkognito mod)
2. **http://localhost:3000** adresine git
3. Farklı bir kullanıcı adıyla kayıt ol
4. İki oyuncu haritada birbirini görür

---

## 7. Oyun Nasıl Oynanır

### Hareket

| Eylem | Kontrol |
|---|---|
| Yukarı hareket | `W` veya `↑` |
| Aşağı hareket | `S` veya `↓` |
| Sola hareket | `A` veya `←` |
| Sağa hareket | `D` veya `→` |
| Belirli noktaya git | Haritada tıkla |
| Yakınlaştır/Uzaklaştır | Mouse scroll |
| Haritayı kaydır | Mouse sürükle |

### XP Kazanma

Haritada renkli daire içinde gösterilen lokasyonlara yaklaştığında otomatik XP kazanırsın:

| Lokasyon | XP | Bekleme Süresi |
|---|---|---|
| 📚 Merkez Kütüphane | 50 XP | 5 dakika |
| 🍽️ Merkez Yemekhane | 30 XP | 3 dakika |
| 🌾 Ziraat Fakültesi | 60 XP | 10 dakika |
| 🏛️ Rektörlük Meydanı | 20 XP | 2 dakika |
| 📋 Öğrenci İşleri | 100 XP | 15 dakika |

### Seviyeler

| Seviye | XP Eşiği | Unvan |
|---|---|---|
| 1 | 0 | Çaylak |
| 2 | 100 | Keşifçi |
| 3 | 250 | Gezgin |
| 4 | 500 | Bilge |
| 5 | 900 | Veteran |
| 6 | 1500 | Uzman |
| 7 | 2300 | Usta |
| 8 | 3300 | Efsane |
| 9 | 4500 | Mitos |
| 10 | 6000 | Kampüs Tanrısı |

### Sohbet

Bir lokasyona girdiğinde sağdaki panel açılır:
- **Sağ alttaki 💬 butonu** ile chat panelini açıp kapatabilirsin
- Sadece aynı alanda bulunanlarla sohbet edebilirsin
- Farklı bir alana geçince farklı sohbet odasına katılırsın

### Sıralama Tablosu

Sol ortadaki 🏆 butonu ile sıralama tablosunu açabilirsin.

---

## 8. Sorun Giderme

### Problem: "MongoDB bağlantı hatası"

```
❌ MongoDB bağlantı hatası: connect ECONNREFUSED 127.0.0.1:27017
```

**Çözüm:**

```bash
# Windows
net start MongoDB
# veya
Get-Service MongoDB | Start-Service

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
sudo systemctl status mongod
```

---

### Problem: "Port 5000 already in use"

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Çözüm:**

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMARASI> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID_NUMARASI>

# veya backend/.env'de PORT değerini değiştir:
PORT=5001
```

---

### Problem: "CORS hatası" (tarayıcı konsolunda)

```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Çözüm:** `backend/.env` dosyasını kontrol et:

```
CORS_ORIGIN=http://localhost:3000
```

Backend'i yeniden başlat.

---

### Problem: "Socket.io bağlanmıyor"

Sol altta veya sağ üstte "Bağlanıyor..." yazısı kaybolmuyor.

**Çözüm:**

1. Backend çalışıyor mu kontrol et: http://localhost:5000/api/health
2. `frontend/.env` dosyasını kontrol et:
   ```
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
3. Tarayıcı konsolunda (`F12`) hata var mı bak

---

### Problem: "npm install" çok uzun sürüyor veya hata veriyor

```bash
# npm cache temizle
npm cache clean --force

# Tekrar dene
npm install

# Hâlâ çalışmıyorsa node_modules sil
rm -rf node_modules package-lock.json
npm install
```

---

### Problem: Frontend açılıyor ama harita görünmüyor

`frontend/src/assets/campus-map.json` dosyasının var olduğunu kontrol et:

```bash
ls frontend/src/assets/
# campus-map.json dosyası görünmeli
```

Yoksa generate et:

```bash
cd campusgame
node scripts/generate-real-map.js
```

---

### Problem: Tarayıcı konsolunda "React" veya "JSX" hataları

```bash
# frontend klasöründe
cd frontend
rm -rf node_modules
npm install
npm start
```

---

## 9. Production Deploy

### 9.1 — Environment Hazırlığı

**backend/.env** (production):

```bash
PORT=5000
MONGODB_URI=mongodb+srv://KULLANICI:SIFRE@cluster.mongodb.net/campusgame
JWT_SECRET=BURAYA_EN_AZ_64_KARAKTERLIK_RASTGELE_STRING_YAZ
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://kampus.senindomain.com
NODE_ENV=production
```

**Güçlü JWT secret üretmek için:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 9.2 — Frontend Build

```bash
cd campusgame/frontend

# Production .env oluştur
cat > .env.production << EOF
REACT_APP_API_URL=https://api.senindomain.com/api
REACT_APP_SOCKET_URL=https://api.senindomain.com
EOF

# Build al
npm run build
# /build klasörü oluşur
```

---

### 9.3 — Sunucuya Yükle (VPS/Sunucu)

```bash
# Backend sunucuya kopyala
scp -r campusgame/backend user@sunucu_ip:/var/www/campusgame/

# Frontend build'i kopyala
scp -r campusgame/frontend/build user@sunucu_ip:/var/www/campusgame/public/

# Sunucuya bağlan
ssh user@sunucu_ip
cd /var/www/campusgame/backend
npm install --production
```

---

### 9.4 — PM2 ile Çalıştır

```bash
# PM2 yükle (global)
npm install -g pm2

# Backend'i başlat
cd /var/www/campusgame/backend
pm2 start src/server.js --name campusgame-api

# Sistem açılışında otomatik başlat
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
pm2 logs campusgame-api
```

---

### 9.5 — Nginx Yapılandırması

```nginx
# /etc/nginx/sites-available/campusgame

# Frontend
server {
    listen 80;
    server_name kampus.senindomain.com;

    root /var/www/campusgame/public;
    index index.html;

    # React Router için
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Önbellekleme
    location ~* \.(js|css|png|jpg|ico|json)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.senindomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # Socket.io için WebSocket desteği
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Timeout (Socket.io için)
        proxy_read_timeout 86400;
    }
}
```

```bash
# Yapılandırmayı etkinleştir
sudo ln -s /etc/nginx/sites-available/campusgame /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 9.6 — SSL (HTTPS) — Ücretsiz

```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx

# Sertifika al (domain yerine kendi domainini yaz)
sudo certbot --nginx -d kampus.senindomain.com -d api.senindomain.com

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

---

### 9.7 — Docker Compose (Alternatif)

Tüm servisleri Docker ile çalıştırmak için `docker-compose.yml`:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: campusgame

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "5000:5000"
    env_file: ./backend/.env
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017/campusgame
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

**backend/Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**frontend/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```bash
# Docker Compose ile başlat
docker-compose up -d

# Log'ları izle
docker-compose logs -f

# Durdur
docker-compose down
```

---

## Harita Verisi Hakkında

Kampüs haritası `frontend/src/assets/campus-map.json` dosyasındadır.

**Mevcut veriler Google Places API ile doğrulanmıştır (Şubat 2026):**

| Bina | Gerçek Koordinat |
|---|---|
| Rektörlük Binası | 36.3334, 36.1985 |
| Merkez Kütüphane | 36.3287, 36.1942 |
| Merkez Yemekhane | 36.3304, 36.1963 |
| Eğitim Fakültesi | 36.3311, 36.1950 |
| Güzel Sanatlar Fakültesi | 36.3307, 36.1950 |
| Fen ve Edebiyat Fakültesi | 36.3275, 36.1971 |
| Veteriner Fakültesi | 36.3296, 36.1979 |
| Ziraat Fakültesi | 36.3251, 36.1959 |
| Tıp Fakültesi | 36.3350, 36.1981 |
| Diş Hekimliği Fakültesi | 36.3348, 36.1980 |
| Sağlık Yüksekokulu | 36.3278, 36.1943 |
| KYK Kız Öğrenci Yurdu | 36.3280, 36.1922 |
| Kapalı Spor Salonu | 36.3343, 36.1955 |
| Fen Bilimleri Enstitüsü | 36.3272, 36.1940 |
| İİBF | 36.3298, 36.1945 |

> **Not:** Mühendislik Fakültesi Tayfur Sökmen Kampüsü'nde **bulunmamaktadır**.
> İskenderun'daki Mühendislik Fakültesi ayrı bir kampüstedir.

**Haritayı güncellemek için:**

```bash
# OSM'den canlı veri çek (internet gerektirir)
node scripts/fetch-osm-data.js

# veya Google Places koordinatlarıyla yeniden üret
node scripts/generate-real-map.js
```

---

## Hızlı Komut Özeti

```bash
# Backend başlat
cd campusgame/backend && npm install && npm run dev

# Frontend başlat (yeni terminal)
cd campusgame/frontend && npm install && npm start

# Harita verisini yenile
node campusgame/scripts/generate-real-map.js

# Backend sağlık kontrolü
curl http://localhost:5000/api/health

# MongoDB'yi elle başlat
# Windows: net start MongoDB
# macOS:   brew services start mongodb/brew/mongodb-community
# Linux:   sudo systemctl start mongod
```

---

*Hatay Mustafa Kemal Üniversitesi · Tayfur Sökmen Kampüsü · MKÜ Campus Game v1.0*
