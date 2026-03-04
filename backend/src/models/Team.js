const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name:     { type:String, required:true, unique:true, maxlength:30 },
  tag:      { type:String, required:true, unique:true, maxlength:6, uppercase:true },
  color:    { type:String, default:"#00f5ff" },
  emoji:    { type:String, default:"⚡" },
  leaderId: { type:mongoose.Schema.Types.ObjectId, ref:"User" },
  members:  [{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
  maxMembers: { type:Number, default:5 },
  weeklyXP: { type:Number, default:0 },
  totalXP:  { type:Number, default:0 },
  weekStart:{ type:Date, default: () => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay()); return d;
  }},
  wins:     { type:Number, default:0 },
  isOpen:   { type:Boolean, default:true }, // katılmak için onay gereksiz
}, { timestamps:true });

// Haftalık XP sıfırlama
TeamSchema.methods.checkWeekReset = async function() {
  const now = new Date();
  const weekAgo = new Date(this.weekStart);
  weekAgo.setDate(weekAgo.getDate()+7);
  if(now > weekAgo) {
    this.weeklyXP = 0;
    this.weekStart = new Date(now.setHours(0,0,0,0) - now.getDay()*86400000);
    await this.save();
  }
};

module.exports = mongoose.model("Team", TeamSchema);
