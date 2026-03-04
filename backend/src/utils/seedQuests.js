const Quest = require("../models/Quest");

const QUESTS = [
  { questId:"daily_visit_1",    period:"daily",     type:"visit",   trackEvent:"location_visit",    title:"İlk Adım",            description:"Herhangi bir alana gir",                    icon:"👣", target:1,  xpReward:30,   orderIndex:1 },
  { questId:"daily_visit_3",    period:"daily",     type:"visit",   trackEvent:"location_visit",    title:"Gezgin",              description:"3 farklı alana gir",                        icon:"🗺️", target:3,  xpReward:75,   orderIndex:2 },
  { questId:"daily_chat_5",     period:"daily",     type:"chat",    trackEvent:"chat_message",      title:"Sosyal Kelebek",      description:"5 sohbet mesajı gönder",                    icon:"💬", target:5,  xpReward:50,   orderIndex:3 },
  { questId:"daily_chat_10",    period:"daily",     type:"chat",    trackEvent:"chat_message",      title:"Dedikodu Ustası",     description:"10 sohbet mesajı gönder",                   icon:"🗣️", target:10, xpReward:80,   orderIndex:4 },
  { questId:"daily_social",     period:"daily",     type:"social",  trackEvent:"same_room_players", title:"Buluşma Noktası",     description:"Bir alanda 2+ kişiyle aynı anda ol",        icon:"👥", target:1,  xpReward:60,   orderIndex:5 },
  { questId:"daily_library",    period:"daily",     type:"visit",   trackEvent:"location_visit",    title:"Bilgi Avcısı",        description:"Kütüphaneye git",       locationId:"library",   icon:"📚", target:1,  xpReward:40,   orderIndex:6 },
  { questId:"daily_cafeteria",  period:"daily",     type:"visit",   trackEvent:"location_visit",    title:"İyi İştahlar",        description:"Yemekhanesini ziyaret et", locationId:"cafeteria", icon:"🍽️", target:1, xpReward:30,   orderIndex:7 },
  { questId:"weekly_explore_8", period:"weekly",    type:"explore", trackEvent:"new_location",      title:"Kampüs Kaşifi",       description:"8 farklı alan keşfet",                      icon:"🔭", target:8,  xpReward:300,  orderIndex:10, badgeReward:{ id:"weekly_explorer", name:"Haftalık Kaşif", icon:"🔭", rarity:"rare"} },
  { questId:"weekly_chat_50",   period:"weekly",    type:"chat",    trackEvent:"chat_message",      title:"İletişim Uzmanı",     description:"50 sohbet mesajı gönder",                   icon:"📡", target:50, xpReward:250,  orderIndex:11, badgeReward:{ id:"weekly_chatter", name:"İletişim Uzmanı", icon:"📡", rarity:"rare"} },
  { questId:"weekly_visit_15",  period:"weekly",    type:"visit",   trackEvent:"location_visit",    title:"Tur Rehberi",         description:"15 alan ziyareti yap",                      icon:"🎫", target:15, xpReward:200,  orderIndex:12 },
  { questId:"weekly_streak",    period:"weekly",    type:"streak",  trackEvent:"daily_login",       title:"Düzenli Ziyaretçi",   description:"7 gün üst üste giriş yap",                  icon:"🔥", target:7,  xpReward:400,  orderIndex:13, badgeReward:{ id:"streak_7", name:"Sadık Öğrenci", icon:"🔥", rarity:"rare"} },
  { questId:"perm_all_locs",    period:"permanent", type:"explore", trackEvent:"new_location",      title:"Kampüs Tanrısı",      description:"Tüm 16 alanı keşfet",                       icon:"🏛️", target:16, xpReward:1000, orderIndex:20, isRepeatable:false, badgeReward:{ id:"explorer_all", name:"Kampüs Ustası", icon:"🏆", rarity:"legendary"} },
  { questId:"perm_chat_100",    period:"permanent", type:"chat",    trackEvent:"chat_message",      title:"Sözün Efendisi",      description:"100 sohbet mesajı gönder",                  icon:"💎", target:100,xpReward:500,  orderIndex:21, isRepeatable:false, badgeReward:{ id:"chatter_100", name:"Sözün Efendisi", icon:"💎", rarity:"epic"} },
];

async function seedQuests() {
  for (const q of QUESTS) {
    await Quest.findOneAndUpdate({ questId: q.questId }, q, { upsert:true, new:true });
  }
  console.log(`✅ ${QUESTS.length} görev seed edildi`);
}

module.exports = { seedQuests, QUESTS };
