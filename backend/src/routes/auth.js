const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendVerificationEmail } = require("../utils/mailer");

// Geçici doğrulama kodları: email -> { code, expires, username, userData }
const pendingVerifications = new Map();

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "mku_campus_game_fallback_secret";
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
};

// POST /api/auth/register — Adım 1: Doğrulama kodu gönder
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, studentId, faculty, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Kullanıcı adı, e-posta ve şifre zorunludur" });
    }

    // MKÜ e-posta doğrulaması
    const allowedDomains = ["@ogr.mku.edu.tr", "@mku.edu.tr"];
    const isAllowed = allowedDomains.some(d => email.toLowerCase().endsWith(d));
    if (!isAllowed) {
      return res.status(400).json({ error: "Sadece @ogr.mku.edu.tr veya @mku.edu.tr uzantılı e-postalar ile kayıt olunabilir" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? "E-posta" : "Kullanıcı adı";
      return res.status(409).json({ error: `${field} zaten kullanımda` });
    }

    // E-posta servisi aktif değilse (MAIL_USER yok) → direkt kayıt
    if (!process.env.MAIL_USER) {
      const user = await createUser({ username, email, password, studentId, faculty, avatar });
      const token = generateToken(user._id);
      return res.status(201).json({ message: "Kayıt başarılı! Kampüse hoş geldiniz 🎓", token, user: user.toPublicJSON() });
    }

    // Doğrulama kodu üret ve gönder
    const code = generate6DigitCode();
    pendingVerifications.set(email.toLowerCase(), {
      code, username, password, studentId, faculty, avatar,
      expires: Date.now() + 15 * 60 * 1000, // 15 dakika
    });

    try {
      await sendVerificationEmail(email, username, code);
    } catch (mailErr) {
      console.error("Mail gönderilemedi:", mailErr.message);
      // Mail başarısız → yedek olarak direkt kayıt yap
      const user = await createUser({ username, email, password, studentId, faculty, avatar });
      const token = generateToken(user._id);
      return res.status(201).json({ message: "Kayıt başarılı! Kampüse hoş geldiniz 🎓", token, user: user.toPublicJSON() });
    }

    return res.status(200).json({
      message: "Doğrulama kodu e-postanıza gönderildi",
      requiresVerification: true,
      email,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Helper: kullanıcı oluştur
async function createUser({ username, email, password, studentId, faculty, avatar }) {
  const avatarColors = ["#00f5ff","#39d353","#ffd700","#ff6b35","#bf5fff","#ff3860","#00e5a0","#4f9cf9"];
  const avatarEmojis = ["🎓","👨‍💻","👩‍💻","🦊","🐺","🦁","⚡","🌟"];
  const user = new User({
    username, email, password,
    studentId: studentId || null,
    faculty: faculty || null,
    isVerified: true,
    avatar: {
      color: avatar?.color || avatarColors[Math.floor(Math.random()*avatarColors.length)],
      emoji: avatar?.emoji || avatarEmojis[Math.floor(Math.random()*avatarEmojis.length)],
    },
  });
  await user.save();
  return user;
}

// POST /api/auth/verify-email — Adım 2: Kodu doğrula ve hesap oluştur
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "E-posta ve kod gerekli" });

    const pending = pendingVerifications.get(email.toLowerCase());
    if (!pending) return res.status(400).json({ error: "Doğrulama isteği bulunamadı. Lütfen tekrar kayıt olun." });
    if (Date.now() > pending.expires) {
      pendingVerifications.delete(email.toLowerCase());
      return res.status(400).json({ error: "Doğrulama kodu süresi doldu. Lütfen tekrar kayıt olun." });
    }
    if (pending.code !== String(code).trim()) {
      return res.status(400).json({ error: "Yanlış doğrulama kodu" });
    }

    pendingVerifications.delete(email.toLowerCase());

    // Hesap oluştur
    const user = await createUser({ ...pending, email });
    const token = generateToken(user._id);

    res.status(201).json({
      message: "E-posta doğrulandı! Kampüse hoş geldiniz 🎓",
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// POST /api/auth/resend-code — Kodu tekrar gönder
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    const pending = pendingVerifications.get(email?.toLowerCase());
    if (!pending) return res.status(400).json({ error: "Kayıt isteği bulunamadı" });

    const code = generate6DigitCode();
    pending.code = code;
    pending.expires = Date.now() + 15 * 60 * 1000;

    await sendVerificationEmail(email, pending.username, code);
    res.json({ message: "Kod tekrar gönderildi" });
  } catch (err) {
    res.status(500).json({ error: "Kod gönderilemedi: " + err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre zorunludur" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı" });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: "Giriş başarılı!",
      token,
      user: user.toPublicJSON()
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    // best-effort token clear
    return res.json({ message: "OK" });
    req.user.isOnline = false;
    req.user.socketId = null;
    req.user.lastSeen = new Date();
    await req.user.save();
    res.json({ message: "Çıkış başarılı" });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PATCH /api/auth/profile
router.patch("/profile", auth, async (req, res) => {
  try {
    const { faculty, studentId, avatar } = req.body;
    const allowedUpdates = {};

    if (faculty) allowedUpdates.faculty = faculty;
    if (studentId) allowedUpdates.studentId = studentId;
    if (avatar) {
      if (avatar.color) allowedUpdates["avatar.color"] = avatar.color;
      if (avatar.emoji) allowedUpdates["avatar.emoji"] = avatar.emoji;
    }

    const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, { new: true });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
