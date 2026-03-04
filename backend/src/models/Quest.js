const mongoose = require("mongoose");

const QuestSchema = new mongoose.Schema({
  questId:     { type:String, required:true, unique:true },
  title:       { type:String, required:true },
  description: String,
  icon:        { type:String, default:"📋" },
  type:        { type:String, enum:["visit","chat","explore","social","streak","collect"], default:"visit" },
  period:      { type:String, enum:["daily","weekly","permanent"], default:"daily" },

  /* Hedef */
  target:         { type:Number, default:1 },
  locationId:     String,  // belirli bir lokasyon (null = herhangi biri)
  locationCount:  Number,  // kaç farklı lokasyon

  /* Ödüller */
  xpReward:    { type:Number, default:50 },
  badgeReward: {
    id:     String,
    name:   String,
    icon:   String,
    rarity: { type:String, enum:["common","rare","epic","legendary"] },
  },

  isActive:           { type:Boolean, default:true },
  isRepeatable:       { type:Boolean, default:true },
  repeatCooldownHours:{ type:Number,  default:24 },

  /* Görev talimatları (socket'e ne sayılacak) */
  trackEvent: { type:String }, // "location_visit", "chat_message", "new_location", "same_room_players"
  orderIndex: { type:Number, default:0 }, // sıralama
});

module.exports = mongoose.model("Quest", QuestSchema);
