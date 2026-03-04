require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const Team=require("./models/Team");
const MemoryPost=require("./models/MemoryPost");
const initGameSocket = require("./socket/gameSocket");
const { seedQuests } = require("./utils/seedQuests");

const app = express();
const server = http.createServer(app);

// CORS — tüm originlere izin ver (LAN multiplayer için)
const corsOptions = {
  origin: true,          // herkese izin ver
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};

// ─── Socket.io ────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"], credentials: false },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ─── Middleware ───────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
const apiLimiter  = rateLimit({ windowMs:15*60*1000, max:3000, message:{ error:"Çok fazla istek." } });
const authLimiter = rateLimit({ windowMs:15*60*1000, max:300,  message:{ error:"Çok fazla giriş denemesi" } });
app.use("/api/", apiLimiter);

// ─── Routes ──────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/game", gameRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("*", (req, res) => res.status(404).json({ error: "Endpoint bulunamadı" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Sunucu hatası" });
});

// ─── MongoDB ──────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/campusgame", {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ MongoDB bağlandı");
  } catch (err) {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  }
}

// ─── Start ────────────────────────────────────────
async function start() {
  await connectDB();
  await seedQuests();
  initGameSocket(io);

  const PORT = process.env.PORT || 5000;
  // 0.0.0.0 → hem localhost hem LAN IP'den erişim
  server.listen(PORT, "0.0.0.0", () => {
    const os = require("os");
    const nets = os.networkInterfaces();
    let lanIP = "???";
    for (const n of Object.values(nets).flat()) {
      if (n.family==="IPv4" && !n.internal) { lanIP = n.address; break; }
    }
    console.log(`\n🚀 CampusGame Backend çalışıyor`);
    console.log(`   Localhost  : http://localhost:${PORT}/api`);
    console.log(`   LAN IP     : http://${lanIP}:${PORT}/api`);
    console.log(`   Health     : http://localhost:${PORT}/api/health`);
    console.log(`   MongoDB    : ${process.env.MONGODB_URI||"mongodb://localhost:27017/campusgame"}`);
    console.log(`\n   👥 Arkadaşın şunu açsın: http://${lanIP}:3000\n`);
  });
}

start();

process.on("SIGTERM", async () => { await mongoose.connection.close(); server.close(()=>process.exit(0)); });
process.on("SIGINT",  async () => { await mongoose.connection.close(); server.close(()=>process.exit(0)); });
