# 🚀 MKÜ Campus Game — Vercel + Railway Yayın Rehberi

## Mimari
```
Frontend (React) → Vercel (ücretsiz, static hosting)
Backend (Node.js) → Railway (ücretsiz tier, websocket desteği)
Veritabanı (MongoDB) → MongoDB Atlas (ücretsiz 512MB)
```

---

## 1️⃣ MongoDB Atlas Kurulumu

1. [mongodb.com/atlas](https://mongodb.com/atlas) → **Sign Up** (ücretsiz)
2. **Free cluster** oluştur (M0 — 512MB ücretsiz)
3. **Database Access** → Kullanıcı oluştur (username + şifre)
4. **Network Access** → `0.0.0.0/0` ekle (tüm IP)
5. **Connect** → **Drivers** → Connection string kopyala:
   ```
   mongodb+srv://kullanici:sifre@cluster.mongodb.net/campusgame
   ```

---

## 2️⃣ Railway'de Backend Yayınlama

1. [railway.app](https://railway.app) → GitHub ile giriş
2. **New Project** → **Deploy from GitHub repo**
3. Repo seç → **backend** klasörünü root olarak ayarla:
   - Settings → **Root Directory** = `backend`
4. **Variables** (Environment Variables) ekle:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/campusgame
   JWT_SECRET=en_az_32_karakter_cok_guclu_bir_secret_buraya
   NODE_ENV=production
   ```
5. Deploy → URL'i kopyala (örn: `https://mku-campusgame-backend.up.railway.app`)

> ⚡ Railway WebSocket destekler — Socket.io için ideal!

---

## 3️⃣ Vercel'de Frontend Yayınlama

### Adım 1: Environment Variable
`frontend/.env` dosyasına backend URL'ini yaz:
```
REACT_APP_API_URL=https://mku-campusgame-backend.up.railway.app/api
REACT_APP_SOCKET_URL=https://mku-campusgame-backend.up.railway.app
```

### Adım 2: Vercel'e Deploy
```bash
# Terminal'de (frontend klasöründe)
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

**VEYA** GitHub üzerinden:
1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. **New Project** → Repo bağla
3. **Root Directory** = `frontend`
4. **Environment Variables** ekle:
   - `REACT_APP_API_URL` = Railway URL + `/api`
   - `REACT_APP_SOCKET_URL` = Railway URL
5. **Deploy!**

---

## 4️⃣ Kontrol Listesi

- [ ] MongoDB Atlas'ta cluster oluşturuldu
- [ ] Railway'de backend deploy edildi
- [ ] Railway'de env variables eklendi (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`)
- [ ] `https://your-backend.up.railway.app/api/health` → `{"status":"ok"}` döndürüyor
- [ ] Frontend `.env`'e Railway URL yazıldı
- [ ] Vercel'de frontend deploy edildi
- [ ] Vercel'de env variables eklendi
- [ ] Vercel URL'ini ziyaret et → Giriş ekranı görünüyor

---

## 🔧 Sorun Giderme

**CORS hatası:** Railway'deki backend server.js zaten `origin: true` ayarlı, sorun olmamalı.

**Socket.io bağlanamıyor:** Railway WebSocket için `websocket` transport açık olduğunu kontrol et. Settings → Networking → WebSockets: ✅

**"Sunucuya ulaşılamıyor" hatası:** `REACT_APP_API_URL` env variable'ını Vercel'e eklediğinden emin ol, sonra **Redeploy** yap.

**MongoDB bağlanamıyor:** Atlas'ta Network Access'te `0.0.0.0/0` olduğunu kontrol et.

---

## 💰 Maliyet

| Servis | Plan | Fiyat |
|--------|------|-------|
| Vercel | Hobby (Static) | **Ücretsiz** |
| Railway | Starter ($5 kredi/ay) | **~Ücretsiz** |
| MongoDB Atlas | M0 Free | **Ücretsiz** |

> Toplam: **0 TL/ay** (az trafikli proje için)

---

## 🔗 Faydalı Bağlantılar
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/atlas
