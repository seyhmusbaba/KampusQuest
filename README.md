# 🎮 MKÜ Campus Game

## Kurulum

### Backend
```bash
cd backend
npm install
cp .env.example .env   # MongoDB bağlantısını düzenleyin
npm run dev            # Port 5000'de başlar
```

### Frontend
```bash
cd frontend
npm install
npm start              # Port 3000'de başlar
```

## Ağ Ayarları

Frontend otomatik olarak sunucunun IP'sini `window.location.hostname` ile bulur.

- **Aynı bilgisayardan**: `http://localhost:3000` — otomatik çalışır
- **LAN'daki başka bilgisayardan**: `http://SUNUCU_IP:3000` — otomatik çalışır, ayar gerekmez
- **Özel IP belirtmek için**: `frontend/.env` dosyasında `REACT_APP_API_URL` ve `REACT_APP_SOCKET_URL` satırlarını ekleyin

## İlk Admin

MongoDB'de şunu çalıştırın:
```js
db.users.updateOne({ username: "kullaniciadin" }, { $set: { role: "admin" } })
```
