const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const XP_THRESHOLDS = [0,100,250,500,900,1500,2300,3300,4500,6000,9000,13000];
const TITLES = ["Çaylak","Keşifçi","Gezgin","Bilge","Veteran","Uzman","Usta","Efsane","Mitos","Kampüs Tanrısı","Efsanevi Tanrı","Ölümsüz"];

const UserSchema = new mongoose.Schema({
  username:  { type:String, required:true, unique:true, trim:true, minlength:3, maxlength:20 },
  email:     { type:String, required:true, unique:true, lowercase:true, trim:true },
  password:  { type:String, required:true, minlength:6, select:false },
  studentId: { type:String, default:null },
  faculty:   { type:String, default:null },
  role:      { type:String, enum:["student","moderator","admin"], default:"student" },
  permissions: {
    canDeleteMessages: { type:Boolean, default:false },
    canWarnUsers:      { type:Boolean, default:false },
    canGiveXP:         { type:Boolean, default:false },
    canBanUsers:       { type:Boolean, default:false },
    canManageQuests:   { type:Boolean, default:false },
    canViewAdminPanel: { type:Boolean, default:false },
  },
  isBanned:   { type:Boolean, default:false },
  banReason:  { type:String, default:null },
  warnings:   [{ reason:String, by:String, at:{ type:Date, default:Date.now } }],
  mutedUntil: { type:Date, default:null },
  avatar: {
    color: { type:String, default:"#00f5ff" },
    emoji: { type:String, default:"🎓" },
  },
  xp:    { type:Number, default:0 },
  level: { type:Number, default:1 },
  title: { type:String, default:"Çaylak" },
  lastDailyBonus: { type:Date, default:null },
  loginStreak:    { type:Number, default:0 },
  lastPosition: {
    lat: { type:Number, default:36.3303718 },
    lng: { type:Number, default:36.1963282 },
    x:   { type:Number, default:0.5 },
    y:   { type:Number, default:0.5 },
    updatedAt: { type:Date, default:Date.now },
  },
  currentRoom: { type:String, default:null },
  isOnline:    { type:Boolean, default:false },
  socketId:    { type:String,  default:null },

  // Arkadaş sistemi
  friends:        [{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
  friendRequests: [{
    from:     { type:mongoose.Schema.Types.ObjectId, ref:"User" },
    username: String,
    avatar:   { color:String, emoji:String },
    at:       { type:Date, default:Date.now },
  }],

  // Takım
  teamId: { type:mongoose.Schema.Types.ObjectId, ref:"Team", default:null },

  questProgress:  [{ questId:String, status:{ type:String, enum:["active","completed","claimed","failed"], default:"active" }, progress:{ type:Number, default:0 }, target:{ type:Number, default:1 }, startedAt:{ type:Date, default:Date.now }, completedAt:Date, claimedAt:Date, _id:false }],
  locationVisits: [{ locationId:String, visitCount:{ type:Number, default:0 }, lastVisited:Date, firstDiscoveredAt:Date, _id:false }],
  hiddenFound:    [String], // keşfedilen gizli noktalar
  locationXpClaims: {
    type: Map, of: Date, default: {}
  }, // locationId -> son XP alım zamanı (cooldown kalıcılığı)
  badges:         [{ id:String, name:String, icon:String, earnedAt:{ type:Date, default:Date.now }, rarity:{ type:String, enum:["common","rare","epic","legendary"], default:"common" }, _id:false }],
  stats: {
    totalXpEarned:       { type:Number, default:0 },
    questsCompleted:     { type:Number, default:0 },
    chatMessagesSent:    { type:Number, default:0 },
    locationsDiscovered: { type:Number, default:0 },
    hiddenFound:         { type:Number, default:0 },
    dailyLogins:         { type:Number, default:0 },
    chatXpToday:         { type:Number, default:0 },
    chatXpDate:          { type:Date,   default:null },
    memoryPosts:         { type:Number, default:0 },
  },
  lastSeen: { type:Date, default:Date.now },
}, { timestamps:true });

UserSchema.methods.calculateLevel = function() {
  let level=1;
  for(let i=0;i<XP_THRESHOLDS.length;i++){ if(this.xp>=XP_THRESHOLDS[i]) level=i+1; else break; }
  this.level=Math.min(level,TITLES.length); this.title=TITLES[this.level-1]; return this.level;
};
UserSchema.methods.addXP = async function(amount, source="unknown") {
  const oldLevel=this.level; this.xp+=amount; this.stats.totalXpEarned+=amount; this.calculateLevel(); await this.save();
  return { newXP:this.xp, level:this.level, title:this.title, leveledUp:this.level>oldLevel, amount, source };
};
UserSchema.methods.claimDailyBonus = async function() {
  const now=new Date(), today=now.toDateString(), lastDate=this.lastDailyBonus?this.lastDailyBonus.toDateString():null;
  if(lastDate===today) return { claimed:false };
  const yesterday=new Date(now); yesterday.setDate(yesterday.getDate()-1);
  const streak=(lastDate===yesterday.toDateString())?this.loginStreak+1:1;
  const bonus=Math.min(30+(streak-1)*10,100);
  this.loginStreak=streak; this.lastDailyBonus=now; this.stats.dailyLogins+=1;
  if(streak>=7 && !this.badges.find(b=>b.id==="streak_7")) this.badges.push({id:"streak_7",name:"Sadık Öğrenci",icon:"🔥",rarity:"rare"});
  if(streak>=30 && !this.badges.find(b=>b.id==="streak_30")) this.badges.push({id:"streak_30",name:"Demir İrade",icon:"💎",rarity:"epic"});
  const result=await this.addXP(bonus,"daily_login");
  return { claimed:true, bonus, streak, ...result };
};
UserSchema.methods.addChatXP = async function() {
  const today=new Date().toDateString(), lastDate=this.stats.chatXpDate?this.stats.chatXpDate.toDateString():null;
  if(lastDate!==today){ this.stats.chatXpToday=0; this.stats.chatXpDate=new Date(); }
  if(this.stats.chatXpToday>=50) return null;
  this.stats.chatXpToday+=5; this.stats.chatMessagesSent+=1;
  return await this.addXP(5,"chat_message");
};
UserSchema.methods.recordVisit = async function(locationId) {
  let visit=this.locationVisits.find(v=>v.locationId===locationId), isFirst=false;
  if(!visit){ this.locationVisits.push({locationId,visitCount:1,lastVisited:new Date(),firstDiscoveredAt:new Date()}); this.stats.locationsDiscovered+=1; isFirst=true;
    if(this.stats.locationsDiscovered>=5 && !this.badges.find(b=>b.id==="explorer_5")) this.badges.push({id:"explorer_5",name:"Kaşif",icon:"🗺️",rarity:"common"});
    if(this.stats.locationsDiscovered>=16 && !this.badges.find(b=>b.id==="explorer_all")) this.badges.push({id:"explorer_all",name:"Kampüs Ustası",icon:"🏆",rarity:"legendary"});
  } else { visit.visitCount+=1; visit.lastVisited=new Date(); }
  await this.save(); return { isFirst, totalDiscovered:this.stats.locationsDiscovered };
};
UserSchema.pre("save", async function(next) {
  if(this.isModified("password")) this.password=await bcrypt.hash(this.password,12);
  if(this.isModified("role")){
    const p={student:{canDeleteMessages:false,canWarnUsers:false,canGiveXP:false,canBanUsers:false,canManageQuests:false,canViewAdminPanel:false},moderator:{canDeleteMessages:true,canWarnUsers:true,canGiveXP:false,canBanUsers:false,canManageQuests:false,canViewAdminPanel:true},admin:{canDeleteMessages:true,canWarnUsers:true,canGiveXP:true,canBanUsers:true,canManageQuests:true,canViewAdminPanel:true}};
    this.permissions=p[this.role]||p.student;
  }
  next();
});
UserSchema.methods.comparePassword = async function(c){ return await bcrypt.compare(c,this.password); };
UserSchema.methods.toPublicJSON = function(){
  return { id:this._id, username:this.username, faculty:this.faculty, role:this.role, avatar:this.avatar, xp:this.xp, level:this.level, title:this.title, loginStreak:this.loginStreak, lastPosition:this.lastPosition, currentRoom:this.currentRoom, isOnline:this.isOnline, stats:this.stats, badges:this.badges, permissions:this.permissions, teamId:this.teamId, hiddenFound:this.hiddenFound||[], friends:this.friends||[] };
};
module.exports = mongoose.model("User", UserSchema);
