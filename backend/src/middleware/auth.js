const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Yetkilendirme token'ı gerekli" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mku_campus_game_fallback_secret");

    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token süresi doldu" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Geçersiz token" });
    }
    next(err);
  }
};

module.exports = auth;
