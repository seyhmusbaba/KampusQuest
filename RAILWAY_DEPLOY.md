# 🚂 KampüsQuest — Railway Yayın Rehberi

## Neden Railway?
✅ WebSocket (Socket.io) tam desteği  
✅ Ücretsiz başlangıç ($5/ay kredi)  
✅ MongoDB Atlas ile kolay entegrasyon  
✅ GitHub'dan otomatik deploy  

---

## 1️⃣ Ön Hazırlık — MongoDB Atlas

1. [mongodb.com/atlas](https://mongodb.com/atlas) → **Sign Up** (ücretsiz)
2. **Create a deployment** → **M0 Free** (512MB)
3. **Username + Password** belirle (kaydet!)
4. **Network Access** → **Add IP Address** → `0.0.0.0/0`
5. **Connect** → **Compass / Drivers** → connection string kopyala:
   ```
   mongodb+srv://KullaniciAdi:Sifre@cluster.mongodb.net/campusgame
   ```

---

## 2️⃣ Railway — Backend Deploy

### A. GitHub'a yükle
```bash
cd kampusgame-klasoru
git init
git add .
git commit -m "KampüsQuest v4"
git remote add origin https://github.com/SENİN_KULLANICI/kampusquest.git
git push -u origin main
```

### B. Railway'de proje oluştur
1. [railway.app](https://railway.app) → **GitHub ile giriş**
2. **New Project** → **Deploy from GitHub repo**
3. Repo seç → Railway otomatik `backend` klasörünü tanır

### C. Root Directory ayarla (ÖNEMLİ!)
1. Project → Service → **Settings**
2. **Root Directory** = `/backend`
3. **Save**

### D. Environment Variables ekle
Settings → **Variables** → aşağıdakileri ekle:

```
MONGODB_URI    = mongodb+srv://user:pass@cluster.mongodb.net/campusgame
JWT_SECRET     = minimum_32_karakter_guclu_bir_secret_buraya_yaz_gizli_tut
NODE_ENV       = production
PORT           = 5000
MAIL_PROVIDER  = gmail
MAIL_USER      = kampusquest.mku@gmail.com
MAIL_PASS      = xxxx xxxx xxxx xxxx   (Gmail Uygulama Şifresi - 16 hane)
MAIL_FROM_NAME = KampüsQuest MKÜ
```

> **Gmail Uygulama Şifresi nasıl alınır?**  
> Google Hesabım → Güvenlik → 2 Adımlı Doğrulama (AÇ) → Uygulama şifreleri → "Posta" → 16 haneli kodu kopyala

### E. Deploy et
- Variables kaydedince Railway otomatik deploy başlar
- **Logs** sekmesinden izle: `🚀 CampusGame Backend çalışıyor` görünmeli
- URL'i kopyala: `https://kampusquest-backend.up.railway.app`

### F. Sağlık kontrolü
Tarayıcıda aç:
```
https://SENIN-URL.up.railway.app/api/health
```
→ `{"status":"ok","db":"connected"}` görünmeli ✅

---

## 3️⃣ Frontend — Railway Static Deploy

### A. Frontend'i ayrı bir service olarak ekle
1. Railway'de aynı projede **New Service** → **GitHub Repo** (aynı repo)
2. **Root Directory** = `/frontend`
3. **Build Command** = `npm run build`
4. **Start Command** = (boş bırak — static hosting)

### B. Frontend Environment Variables
```
REACT_APP_API_URL    = https://BACKEND-URL.up.railway.app/api
REACT_APP_SOCKET_URL = https://BACKEND-URL.up.railway.app
```
`BACKEND-URL`'yi adım 2E'den aldığın Railway URL ile değiştir.

### C. Deploy
Variables kaydedince otomatik build başlar (~2-3 dk).  
Frontend URL'in şöyle görünür: `https://kampusquest.up.railway.app`

---

## 4️⃣ Kontrol Listesi

- [ ] MongoDB Atlas cluster oluşturuldu
- [ ] Atlas Network Access'e `0.0.0.0/0` eklendi
- [ ] GitHub'a push edildi
- [ ] Railway'de backend service oluşturuldu
- [ ] Backend Root Directory = `/backend` ayarlandı
- [ ] Backend Variables eklendi (MONGODB_URI, JWT_SECRET, NODE_ENV)
- [ ] `/api/health` endpoint'i `{"status":"ok","db":"connected"}` döndürüyor
- [ ] Railway'de frontend service oluşturuldu
- [ ] Frontend Variables eklendi (REACT_APP_API_URL, REACT_APP_SOCKET_URL)
- [ ] Frontend URL'inden giriş ekranı açılıyor ✅

---

## 🔧 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| "Application failed to respond" | Backend logs kontrol et, PORT=5000 olduğundan emin ol |
| MongoDB bağlanamıyor | Atlas Network Access'te 0.0.0.0/0 var mı? |
| Socket.io bağlanamıyor | REACT_APP_SOCKET_URL backend URL'i mi (api olmadan)? |
| Build hatası | npm install çalıştı mı? Railway logs bak |
| Mail gönderilemiyor | Gmail 2FA açık mı? MAIL_PASS uygulama şifresi mi? |

---

## 💰 Maliyet

| Servis | Plan | Fiyat |
|--------|------|-------|
| Railway Starter | $5 kredi/ay (yaklaşık yeterli) | **~₺0/ay** |
| MongoDB Atlas | M0 Free Tier | **₺0/ay** |
| **Toplam** | | **~₺0/ay** |

