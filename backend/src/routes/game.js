const express  = require("express");
const User     = require("../models/User");
const Message  = require("../models/Message");
const Quest    = require("../models/Quest");
const Team     = require("../models/Team");
const MemoryPost = require("../models/MemoryPost");
const auth     = require("../middleware/auth");
const router   = express.Router();

const requireRole = (...roles) => (req,res,next) => !roles.includes(req.user?.role) ? res.status(403).json({error:"Yetkisiz"}) : next();
const requirePerm = (p) => (req,res,next) => !req.user?.permissions?.[p] ? res.status(403).json({error:"Yetkisiz"}) : next();

router.get("/leaderboard", auth, async (req,res) => {
  try {
    const all = await User.find({isBanned:false}).select("username avatar xp level title stats faculty isOnline role teamId").sort({xp:-1}).limit(50);
    res.json({ leaderboard: all.map((u,i)=>({rank:i+1,id:u._id,username:u.username,avatar:u.avatar,xp:u.xp,level:u.level,title:u.title,faculty:u.faculty,questsCompleted:u.stats.questsCompleted,isOnline:u.isOnline,role:u.role,teamId:u.teamId})) });
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

router.get("/online-players", auth, async (req,res) => {
  try {
    const players = await User.find({isOnline:true}).select("username avatar xp level title lastPosition currentRoom faculty role");
    res.json({ players: players.map(p=>p.toPublicJSON()) });
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

// Sohbet geçmişi — sadece o oturuma ait mesajlar (sessionId ile)
router.get("/messages/:roomId", auth, async (req,res) => {
  try {
    const { roomId } = req.params;
    const { limit=50, since } = req.query;
    // 'since' varsa sadece o tarihten sonraki mesajları getir (oturum başlangıcı)
    const query = { roomId };
    if (since) query.createdAt = { $gt: new Date(parseInt(since)) };
    const msgs = await Message.find(query).sort({createdAt:-1}).limit(parseInt(limit));
    res.json({ messages: msgs.reverse() });
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

router.get("/quests", auth, async (req,res) => {
  try { const quests=await Quest.find({isActive:true}).sort({orderIndex:1}); res.json({quests,myProgress:req.user.questProgress||[]}); }
  catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

router.get("/stats", auth, async (req,res) => {
  try {
    const total=await User.countDocuments({isBanned:false}), online=await User.countDocuments({isOnline:true});
    const myRank=await User.countDocuments({xp:{$gt:req.user.xp},isBanned:false})+1;
    res.json({global:{totalPlayers:total,onlinePlayers:online},personal:{...req.user.toPublicJSON(),rank:myRank}});
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

// Anı Defteri
router.get("/memories/:locationId", auth, async (req,res) => {
  try {
    const posts = await MemoryPost.find({locationId:req.params.locationId}).sort({isPinned:-1,createdAt:-1}).limit(30);
    res.json({ posts });
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

// Takım API
router.get("/teams", auth, async (req,res) => {
  try { const teams=await Team.find({}).sort({weeklyXP:-1}).limit(20).populate("members","username avatar level"); res.json({teams}); }
  catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});
router.get("/teams/leaderboard", auth, async (req,res) => {
  try { const teams=await Team.find({}).sort({weeklyXP:-1}).limit(10); res.json({teams}); }
  catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});

// Admin rotaları
router.get("/admin/users", auth, requirePerm("canViewAdminPanel"), async (req,res) => {
  try {
    const {search,role,page=1,limit=20}=req.query;
    const query={}; if(search) query.$or=[{username:{$regex:search,$options:"i"}},{email:{$regex:search,$options:"i"}}]; if(role) query.role=role;
    const users=await User.find(query).select("-password").sort({createdAt:-1}).skip((page-1)*limit).limit(parseInt(limit));
    const total=await User.countDocuments(query);
    res.json({users,total,page:parseInt(page),totalPages:Math.ceil(total/limit)});
  } catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});
router.patch("/admin/users/:id/role", auth, requireRole("admin"), async (req,res) => {
  try { const {role}=req.body; if(!["student","moderator","admin"].includes(role)) return res.status(400).json({error:"Geçersiz rol"}); const user=await User.findByIdAndUpdate(req.params.id,{role},{new:true}).select("-password"); res.json({user}); }
  catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});
router.post("/admin/users/:id/give-xp", auth, requirePerm("canGiveXP"), async (req,res) => {
  try { const {amount,reason}=req.body; const t=await User.findById(req.params.id); if(!t) return res.status(404).json({error:"Bulunamadı"}); const r=await t.addXP(parseInt(amount),`admin:${req.user.username}`); res.json({success:true,...r}); }
  catch(e){ res.status(500).json({error:"Sunucu hatası"}); }
});
router.patch("/admin/users/:id/ban",   auth, requirePerm("canBanUsers"), async (req,res) => { try { const u=await User.findByIdAndUpdate(req.params.id,{isBanned:true,banReason:req.body.reason},{new:true}).select("-password"); res.json({success:true,user:u}); } catch(e){ res.status(500).json({error:"Sunucu hatası"}); } });
router.patch("/admin/users/:id/unban", auth, requirePerm("canBanUsers"), async (req,res) => { try { const u=await User.findByIdAndUpdate(req.params.id,{isBanned:false,banReason:null},{new:true}).select("-password"); res.json({success:true,user:u}); } catch(e){ res.status(500).json({error:"Sunucu hatası"}); } });
router.patch("/admin/quests/:questId/toggle", auth, requirePerm("canManageQuests"), async (req,res) => { try { const q=await Quest.findOne({questId:req.params.questId}); if(!q) return res.status(404).json({error:"Bulunamadı"}); q.isActive=!q.isActive; await q.save(); res.json({success:true,isActive:q.isActive}); } catch(e){ res.status(500).json({error:"Sunucu hatası"}); } });

module.exports = router;
