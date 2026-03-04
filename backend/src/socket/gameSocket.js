const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Message = require("../models/Message");
const Quest   = require("../models/Quest");
const Team    = require("../models/Team");
const MemoryPost = require("../models/MemoryPost");

/* ════════════════════════════════════════════════════════════════
   KAMPÜS VERİLERİ
════════════════════════════════════════════════════════════════ */

// 16 lokasyon — sohbet + XP
const ALL_LOCATIONS = [
  { id:"library",        chatRoomId:"chat_library",        name:"Merkez Kütüphane",    icon:"📚", lat:36.3286885, lng:36.1941526, r:28,  xpReward:50, xpCooldown:300000,  isXpZone:true  },
  { id:"cafeteria",      chatRoomId:"chat_cafeteria",       name:"Merkez Yemekhane",    icon:"🍽️",lat:36.3303718, lng:36.1963282, r:35,  xpReward:30, xpCooldown:180000,  isXpZone:true  },
  { id:"ziraat",         chatRoomId:"chat_ziraat",          name:"Ziraat Fakültesi",    icon:"🌾", lat:36.3250892, lng:36.1959193, r:40,  xpReward:60, xpCooldown:600000,  isXpZone:true  },
  { id:"rektorluk",      chatRoomId:"chat_central",         name:"Rektörlük",           icon:"🏛️",lat:36.3334261, lng:36.1984989, r:38,  xpReward:20, xpCooldown:120000,  isXpZone:true  },
  { id:"ogrenci_isleri", chatRoomId:"chat_student_affairs", name:"Öğrenci İşleri",      icon:"📋", lat:36.3334261, lng:36.1975000, r:22,  xpReward:100,xpCooldown:900000,  isXpZone:true  },
  { id:"egitim",         chatRoomId:"chat_egitim",          name:"Eğitim Fakültesi",    icon:"🎓", lat:36.3311481, lng:36.1950196, r:35,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"fen_edebiyat",   chatRoomId:"chat_fen_edebiyat",    name:"Fen-Edebiyat Fak.",   icon:"🔬", lat:36.3274557, lng:36.1970875, r:35,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"veteriner",      chatRoomId:"chat_veteriner",       name:"Veteriner Fakültesi", icon:"🐾", lat:36.3295837, lng:36.1979366, r:35,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"tip",            chatRoomId:"chat_tip",             name:"Tıp Fakültesi",       icon:"🏥", lat:36.3350053, lng:36.1981479, r:35,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"dis_hekimligi",  chatRoomId:"chat_dis",             name:"Diş Hekimliği",       icon:"🦷", lat:36.3347636, lng:36.1980086, r:30,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"saglik_yo",      chatRoomId:"chat_saglik",          name:"Sağlık YO",           icon:"⚕️", lat:36.3277828, lng:36.1942733, r:30,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"kyk_yurt",       chatRoomId:"chat_kyk",             name:"KYK Kız Yurdu",       icon:"🏠", lat:36.3279630, lng:36.1922430, r:35,  xpReward:10, xpCooldown:300000,  isXpZone:false },
  { id:"spor",           chatRoomId:"chat_spor",            name:"Spor Salonu",         icon:"⚽", lat:36.3342677, lng:36.1954726, r:35,  xpReward:20, xpCooldown:300000,  isXpZone:false },
  { id:"guzel_sanatlar", chatRoomId:"chat_sanatlar",        name:"Güzel Sanatlar",      icon:"🎨", lat:36.3307000, lng:36.1950000, r:30,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"iibf",           chatRoomId:"chat_iibf",            name:"İİBF",                icon:"📊", lat:36.3298000, lng:36.1945000, r:35,  xpReward:15, xpCooldown:300000,  isXpZone:false },
  { id:"fen_ens",        chatRoomId:"chat_fen_ens",         name:"Fen Bil. Enstitüsü",  icon:"🧪", lat:36.3271728, lng:36.1940286, r:30,  xpReward:15, xpCooldown:300000,  isXpZone:false },
];

// 15 GİZLİ NOKTA — rektörlük alanında kaşif notu ipuçları
const HIDDEN_SPOTS = [
  { id:"h1",  lat:36.3289, lng:36.1930, name:"Çınar Ağacı",           icon:"🌳", xp:80,  clue:"Kütüphanenin batısında, sessiz köşede yaşlı bir ağaç durur.", order:1  },
  { id:"h2",  lat:36.3318, lng:36.1972, name:"Taş Çeşme",             icon:"⛲", xp:80,  clue:"Rektörlük ile Eğitim arasındaki yolda su sesi duyulur.", order:2  },
  { id:"h3",  lat:36.3262, lng:36.1948, name:"Eski Duvar",             icon:"🧱", xp:90,  clue:"Ziraat yolunun doğusunda yıllara meydan okuyan taşlar var.", order:3  },
  { id:"h4",  lat:36.3340, lng:36.1965, name:"Açık Hava Tiyatrosu",   icon:"🎭", xp:75,  clue:"Spor salonunun güneyinde, basamaklı bir sır gizlidir.", order:4  },
  { id:"h5",  lat:36.3278, lng:36.1958, name:"Güneş Saati",           icon:"🕰️", xp:100, clue:"Veteriner ile Fen-Edebiyat arasında zaman durmuş gibidir.", order:5  },
  { id:"h6",  lat:36.3305, lng:36.1978, name:"Mozaik Duvar",          icon:"🎨", xp:75,  clue:"Yemekhanenin doğusunda renkler konuşur.", order:6  },
  { id:"h7",  lat:36.3326, lng:36.1947, name:"Çan Kulesi",            icon:"🔔", xp:90,  clue:"Güzel Sanatlar'ın kuzeyinde bir ses kaynağı gizlidir.", order:7  },
  { id:"h8",  lat:36.3293, lng:36.1994, name:"Gölet Kenarı",          icon:"🦆", xp:85,  clue:"Veteriner yakınında, doğa bir sır fısıldar.", order:8  },
  { id:"h9",  lat:36.3358, lng:36.1970, name:"Heykeltıraş Atölyesi",  icon:"🗿", xp:100, clue:"Tıp binasının batısında sanatın ağır kokusu vardır.", order:9  },
  { id:"h10", lat:36.3247, lng:36.1970, name:"Sondaj Kulesi Kalıntı", icon:"⛏️", xp:90,  clue:"Ziraatın daha da güneyinde toprak bir sır saklar.", order:10 },
  { id:"h11", lat:36.3315, lng:36.1990, name:"Mermer Kaldırım",       icon:"🪨", xp:75,  clue:"Rektörlük doğusunda taşların altında tarih yatar.", order:11 },
  { id:"h12", lat:36.3270, lng:36.1925, name:"Bisiklet Bahçesi",      icon:"🚲", xp:80,  clue:"KYK'nın doğusunda tekerlekler paslanmış bekler.", order:12 },
  { id:"h13", lat:36.3348, lng:36.1995, name:"Panorama Noktası",      icon:"🌄", xp:120, clue:"Diş Hekimliği'nin en kuzeydoğu köşesinde şehir görünür.", order:13 },
  { id:"h14", lat:36.3282, lng:36.1965, name:"Kayıp Bahçe",           icon:"🌿", xp:90,  clue:"Fen-Edebiyat'ın kuzeyinde yeşil bir sır büyür.", order:14 },
  { id:"h15", lat:36.3322, lng:36.1930, name:"Eski Amfi",             icon:"🏟️", xp:110, clue:"Kuzey kapısının yakınında, zamanın izleri taştadır.", order:15 },
];

// NPC'ler
const NPCS = [
  { id:"librarian",  name:"Kütüphaneci Ayşe",  icon:"👩‍💼", lat:36.3287, lng:36.1942, greeting:"Merhaba! Bugün ne öğrenmek istersin?",
    quests:[{text:"Yemekhaneden bir su getir",target:"cafeteria",xp:40},{text:"Rektörlüğe git ve geri dön",target:"rektorluk",xp:50}] },
  { id:"guard",      name:"Güvenlik Amca",      icon:"👮",    lat:36.3334, lng:36.1986, greeting:"Dur bakalım, kimlik! Şaka şaka 😄 Nereye böyle?",
    quests:[{text:"Kampüsü bir tur at (3 farklı alan)",target:null,xp:60}] },
  { id:"chef",       name:"Aşçı Mehmet Usta",   icon:"👨‍🍳",   lat:36.3304, lng:36.1964, greeting:"Bugün menü: mercimek çorba, tavuk döner. Afiyet!",
    quests:[{text:"5 arkadaşınla yemekhanede buluş",target:"cafeteria",xp:80}] },
  { id:"professor",  name:"Prof. Karamollaoğlu", icon:"🧑‍🏫",  lat:36.3275, lng:36.1971, greeting:"Epistemoloji nedir biliyor musun? Haydi düşün...",
    quests:[{text:"Kütüphane ve Fen-Edebiyat'ı ziyaret et",target:null,xp:55}] },
  { id:"janitor",    name:"Temizlikçi Fatma Hanım",icon:"🧹",  lat:36.3311, lng:36.1951, greeting:"Çöpünüzü çöpe atın gençler! Kampüs hepimizin.",
    quests:[{text:"Spor salonu ve Yemekhane'yi ziyaret et",target:null,xp:45}] },
];

// Mini oyun soruları
// Mini oyun: her alanda soru havuzu, her oturumda 5 rasgele soru seçilir
function _shufflePick(arr, n){ const s=[...arr]; for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];} return s.slice(0,n); }

const MINI_GAME_BANKS = {
  library: [
    { q:"MKÜ kaç yılında kuruldu?",                          opts:["1992","1996","2000","1988"],  ans:0 },
    { q:"Türkiye'deki üniversite sayısı (yaklaşık)?",        opts:["100","150","208","250"],       ans:2 },
    { q:"ISBN ne anlama gelir?",                             opts:["Uluslararası Standart Kitap Numarası","İç Standart Basın Numarası","Uluslararası Seri Basım Numarası","İstanbul Standart Basın Numarası"], ans:0 },
    { q:"Kütüphanelerde kullanılan evrensel sınıflama sistemi?", opts:["Dewey Sistemi","ISBN Sistemi","MARC Sistemi","ISBD Sistemi"], ans:0 },
    { q:"MKÜ'nün bulunduğu şehir?",                         opts:["Adana","Gaziantep","Hatay","Mersin"], ans:2 },
    { q:"Türkiye'nin ilk üniversitesi hangisidir?",          opts:["İstanbul Üniversitesi","Hacettepe Üniversitesi","ODTÜ","Boğaziçi Üniversitesi"], ans:0 },
    { q:"Akademik dergiler için kullanılan özgün kimlik numarası?", opts:["ISBN","ISSN","DOI","ORCID"], ans:1 },
    { q:"YÖK'ün açılımı nedir?",                            opts:["Yüksek Öğrenim Kurumu","Yükseköğretim Kurulu","Yükseköğretim Komisyonu","Yüksek Öğrenim Komitesi"], ans:1 },
    { q:"Osmanlı'da ilk modern üniversite hangisidir?",      opts:["Galatasaray Lisesi","Darülfünun","Mekteb-i Harbiye","Tıbbiye"], ans:1 },
    { q:"Dünya'nın en eski üniversitesi hangi ülkededir?",   opts:["İtalya","İngiltere","Fas","Fransa"], ans:2 },
    { q:"Hatay'da kaç ilçe vardır?",                         opts:["12","15","17","21"], ans:2 },
    { q:"MKÜ Tayfur Ata Sökmen Tıp Fakültesi hangi hastanede eğitim verir?", opts:["Antakya Devlet","Hatay Eğitim Araştırma","İskenderun Devlet","Samandağ Devlet"], ans:1 },
  ],
  cafeteria: [
    { q:"Türk mutfağında 'meze' ne demektir?",               opts:["Ana yemek","Tatlı","Başlangıç yemeği","İçecek"], ans:2 },
    { q:"Antakya mutfağının ünlü yemeği hangisidir?",        opts:["Adana kebabı","Künefe","Lahmacun","Döner"], ans:1 },
    { q:"Türk kahvesi nereden ithal edilir?",                opts:["Brezilya","Etiyopya","Kolombiya","Yemen"], ans:3 },
    { q:"Ayran hangi ülkeye özgüdür?",                      opts:["Azerbaycan","Kazakistan","Türkiye","Özbekistan"], ans:2 },
    { q:"Hatay'ın meşhur peyniri hangisidir?",               opts:["Kaşar","Tulum","Sürk (Sürke)","Mihaliç"], ans:2 },
    { q:"Ramazan pidesi en çok hangi unla yapılır?",         opts:["Mısır unu","Buğday unu","Çavdar unu","Pirinç unu"], ans:1 },
    { q:"Türkiye'de en çok tüketilen bakliyat hangisidir?",  opts:["Fasulye","Nohut","Mercimek","Bezelye"], ans:2 },
    { q:"Borek hangi pişirme yöntemiyle yapılır?",           opts:["Kızartma","Buharda","Fırında","Izgara"], ans:2 },
    { q:"İçeceği 'duble' istemek ne anlama gelir?",          opts:["Büyük bardak","Çift shot","Şekersiz","Sütlü"], ans:1 },
    { q:"Hatay mutfağında 'zahter' nedir?",                  opts:["Bir tür turşu","Bir tür baharat karışımı","Bir tür ekmek","Bir tür tatlı"], ans:1 },
    { q:"Türkiye'de çay en çok hangi şehirde üretilir?",     opts:["Trabzon","Rize","Artvin","Giresun"], ans:1 },
    { q:"Türk mutfağında 'kavurma' nasıl pişirilir?",        opts:["Fırında","Buharda","Kendi yağında kızartılarak","Izgara"], ans:2 },
  ],
  spor: [
    { q:"Futbolda bir maç kaç dakikadır?",                   opts:["80","90","100","120"], ans:1 },
    { q:"Olimpiyatlarda altın madalya hangi metaldendir?",   opts:["Saf altın","Gümüş üzeri altın kaplama","Bronz","Platin"], ans:1 },
    { q:"Voleybolda bir takımda kaç oyuncu sahadadır?",      opts:["5","6","7","8"], ans:1 },
    { q:"Basketbolda 3 sayılık çizginin mesafesi (NBA)?",    opts:["6.7m","7.24m","5.8m","8m"], ans:1 },
    { q:"Türkiye ilk Olimpiyat madalyasını kaç yılında aldı?", opts:["1936","1948","1952","1960"], ans:2 },
    { q:"Judo'da en yüksek kuşak rengi hangisidir?",         opts:["Kırmızı","Siyah","Beyaz","Kırmızı-beyaz"], ans:3 },
    { q:"Tenis'te bir set kazanmak için kaç oyun kazanılmalıdır?", opts:["4","5","6","7"], ans:2 },
    { q:"Halterde 'temiz yükleme' hareketi için İngilizce terim?", opts:["Snatch","Clean and Jerk","Press","Deadlift"], ans:1 },
    { q:"Dünya Kupası'nda en fazla gol atan oyuncu (tüm zamanlar)?", opts:["Pelé","Ronaldo (Brezilyalı)","Miroslav Klose","Gerd Müller"], ans:2 },
    { q:"Tae Kwon Do hangi ülke kökenlidir?",                opts:["Japonya","Çin","Kore","Tayland"], ans:2 },
    { q:"Profesyonel boks maçı kaç raunddur (şampiyonluk)?", opts:["10","12","15","8"], ans:1 },
    { q:"Türkiye'nin dünya şampiyonluğu olan branşı?",       opts:["Güreş","Atletizm","Judo","Hentbol"], ans:0 },
  ],
  rektorluk: [
    { q:"Hatay'ın il merkezi nedir?",                        opts:["İskenderun","Antakya","Kırıkhan","Samandağ"], ans:1 },
    { q:"MKÜ'nün açılımı nedir?",                           opts:["Marmara Kocaeli Üniversitesi","Mustafa Kemal Üniversitesi","Mersin Kocaeli Üniversitesi","Muğla Kıyı Üniversitesi"], ans:1 },
    { q:"Hatay kaç ilçeye sahiptir?",                        opts:["12","15","17","21"], ans:2 },
    { q:"Türkiye Cumhuriyeti'nin kuruluş yılı?",             opts:["1919","1920","1923","1925"], ans:2 },
    { q:"Türkiye'nin en büyük gölü?",                        opts:["Tuz Gölü","Van Gölü","Beyşehir Gölü","Eğirdir Gölü"], ans:1 },
    { q:"Hatay hangi yılda Türkiye'ye katıldı?",             opts:["1923","1936","1939","1945"], ans:2 },
    { q:"MKÜ Rektörlüğü hangi kampüste bulunur?",           opts:["İskenderun","Reyhanlı","Tayfur Sökmen","Dörtyol"], ans:2 },
    { q:"Türkiye'nin nüfusu yaklaşık kaçtır?",               opts:["70 milyon","80 milyon","85 milyon","90 milyon"], ans:2 },
    { q:"Hatay'ın komşu illeri arasında hangisi yoktur?",    opts:["Adana","Osmaniye","Gaziantep","Kahramanmaraş"], ans:3 },
    { q:"Türkiye kaç yılında NATO'ya üye olmuştur?",         opts:["1945","1952","1960","1963"], ans:1 },
    { q:"Antakya'nın antik çağdaki adı nedir?",              opts:["Alexandreia","Antiokheia","Seleukeia","Laodikeia"], ans:1 },
    { q:"MKÜ'nün kaç fakültesi bulunmaktadır (yaklaşık)?",   opts:["5","8","12","15"], ans:2 },
  ],
};

// Her oturumda havuzdan 5 soru seç
const MINI_GAMES = Object.fromEntries(
  Object.entries(MINI_GAME_BANKS).map(([k,v]) => [k, _shufflePick(v,5)])
);

function haversine(lat1,lng1,lat2,lng2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function detectLocation(lat,lng){ for(const l of ALL_LOCATIONS) if(haversine(lat,lng,l.lat,l.lng)<=l.r) return l; return null; }
function detectHidden(lat,lng){ for(const h of HIDDEN_SPOTS) if(haversine(lat,lng,h.lat,h.lng)<=18) return h; return null; }
function detectNPC(lat,lng){ for(const n of NPCS) if(haversine(lat,lng,n.lat,n.lng)<=20) return n; return null; }

const connectedPlayers = new Map();

async function updateQuestProgress(userId, event, meta={}) {
  try {
    const user=await User.findById(userId); if(!user) return [];
    const quests=await Quest.find({isActive:true,trackEvent:event});
    const now=new Date(), notifications=[];
    for(const quest of quests){
      if(quest.locationId && meta.locationId!==quest.locationId) continue;
      let qp=user.questProgress.find(p=>p.questId===quest.questId);
      if(qp?.status==="claimed" && !quest.isRepeatable) continue;
      if(qp && quest.period!=="permanent"){
        const resetH=quest.period==="daily"?24:168;
        if((now-new Date(qp.startedAt))/3600000>resetH && qp.status!=="active"){ qp.status="active"; qp.progress=0; qp.startedAt=now; }
      }
      if(!qp){ user.questProgress.push({questId:quest.questId,status:"active",progress:0,target:quest.target,startedAt:now}); qp=user.questProgress[user.questProgress.length-1]; }
      if(qp.status!=="active") continue;
      qp.progress=Math.min((qp.progress||0)+1,quest.target);
      if(qp.progress>=quest.target){ qp.status="completed"; qp.completedAt=now; notifications.push({questId:quest.questId,title:quest.title,xpReward:quest.xpReward,icon:quest.icon,badgeReward:quest.badgeReward}); }
    }
    await user.save(); return notifications;
  } catch(e){ console.error("Quest progress error:",e.message); return []; }
}

/* ════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   🏟️  ARENA SİSTEMİ — Modül seviyesi (connection dışı)
   activeBattles ve pendingChallenges burada tanımlanır ki tüm
   socket bağlantıları aynı Map'i paylaşsın.
══════════════════════════════════════════════════════════════════ */

// Bekleyen meydan okumalar: targetSocketId -> challenge obj
const arenaInvites = new Map();

// Aktif arena maçları: arenaId -> arenaObj
const arenaMatches = new Map();

/* ── Soru bankaları ── */
const TRIVIA_BANK = [
  { q:"MKÜ hangi yılda kuruldu?",                       opts:["1992","1996","2000","2005"], ans:0, cat:"MKÜ" },
  { q:"Hatay'ın tarihi adı nedir?",                     opts:["Antiokheia","Alexandreia","Seleukeia","Laodikeia"], ans:0, cat:"Tarih" },
  { q:"Hatay'ın il merkezi hangisidir?",                 opts:["İskenderun","Antakya","Kırıkhan","Samandağ"], ans:1, cat:"Coğrafya" },
  { q:"MKÜ YBS bölümü hangi fakültededir?",             opts:["İİBF","Mühendislik","İletişim","Eğitim"], ans:0, cat:"MKÜ" },
  { q:"Hatay kaç ilçeden oluşur?",                      opts:["12","15","17","21"], ans:2, cat:"Coğrafya" },
  { q:"Hatay hangi yılda Türkiye'ye katıldı?",          opts:["1923","1936","1939","1945"], ans:2, cat:"Tarih" },
  { q:"HTTP 404 ne anlama gelir?",                      opts:["Sunucu Hatası","Bulunamadı","Yetkisiz","Yönlendirme"], ans:1, cat:"Web" },
  { q:"RAM açılımı nedir?",                             opts:["Random Access Memory","Read Access Module","Rapid Array Memory","Remote Access Module"], ans:0, cat:"Teknoloji" },
  { q:"Hangi dil print() fonksiyonunu kullanır?",       opts:["JavaScript","Python","C#","Java"], ans:1, cat:"Kodlama" },
  { q:"Git'te commit ne yapar?",                        opts:["Uzak sunucuya iter","Değişiklikleri kaydeder","Dalları birleştirir","Depo oluşturur"], ans:1, cat:"Kodlama" },
  { q:"SQL'de SELECT * FROM ne anlama gelir?",          opts:["Belirli sütunları seç","Tüm satırları seç","Tablo oluştur","Satır sil"], ans:1, cat:"Veritabanı" },
  { q:"Hangi veri yapısı LIFO prensibiyle çalışır?",   opts:["Kuyruk","Yığın (Stack)","Bağlı Liste","Ağaç"], ans:1, cat:"Veri Yapıları" },
  { q:"IPv4 adresi kaç bitten oluşur?",                 opts:["16","32","64","128"], ans:1, cat:"Ağ" },
  { q:"CSS display flex ne için kullanılır?",           opts:["Renk","Yazı Tipi","Yerleşim Düzeni","Animasyon"], ans:2, cat:"Web" },
  { q:"typeof null sonucu nedir? (JavaScript)",         opts:["null","undefined","object","boolean"], ans:2, cat:"Kodlama" },
  { q:"MongoDB hangi tür veritabanıdır?",               opts:["İlişkisel","NoSQL","NewSQL","Graf"], ans:1, cat:"Veritabanı" },
  { q:"REST API'de PUT metodu ne işe yarar?",           opts:["Kayıt oluştur","Kaydı güncelle","Kaydı sil","Kayıt oku"], ans:1, cat:"API" },
  { q:"Binary'de 1010 kaçtır?",                        opts:["8","10","12","14"], ans:1, cat:"Matematik" },
  { q:"OSI modelinde kaç katman vardır?",               opts:["4","5","7","9"], ans:2, cat:"Ağ" },
  { q:"Dünyanın en büyük okyanusu?",                   opts:["Atlantik","Hint","Arktik","Pasifik"], ans:3, cat:"Coğrafya" },
  { q:"Periyodik tabloda Fe hangi elementtir?",         opts:["Fosfor","Flor","Demir","Bakır"], ans:2, cat:"Kimya" },
  { q:"DNA'nın açılımı nedir?",                         opts:["Deoxyribonucleic Acid","Diribonucleic Acid","Deoxyribosome Acid","Dynamic Nucleic Acid"], ans:0, cat:"Biyoloji" },
  { q:"Işığın boşluktaki hızı yaklaşık?",              opts:["200.000 km/s","300.000 km/s","150.000 km/s","400.000 km/s"], ans:1, cat:"Fizik" },
  { q:"Türkiye'nin başkenti?",                          opts:["İstanbul","Ankara","İzmir","Bursa"], ans:1, cat:"Coğrafya" },
  { q:"Python hangi yılda oluşturuldu?",                opts:["1985","1991","1995","2000"], ans:1, cat:"Teknoloji" },
];

const FOOTBALL_BANK = [
  { q:"Bir futbol maçı kaç dakikadır?",                 opts:["80","90","100","120"], ans:1, cat:"Futbol" },
  { q:"Futbolda ofsayt kuralını ilk kim getirdi?",      opts:["FIFA","İngiltere FA","Fransa FA","Almanya FA"], ans:1, cat:"Futbol" },
  { q:"FIFA Dünya Kupası kaç yılda bir yapılır?",       opts:["2","4","6","8"], ans:1, cat:"Futbol" },
  { q:"Türkiye'nin en çok şampiyonluk kazanan takımı?", opts:["Beşiktaş","Fenerbahçe","Galatasaray","Trabzonspor"], ans:2, cat:"Türk Futbolu" },
  { q:"Galatasaray kaç kez UEFA Kupası kazandı?",       opts:["0","1","2","3"], ans:1, cat:"Türk Futbolu" },
  { q:"İlk FIFA Dünya Kupası hangi ülkede yapıldı?",    opts:["Brezilya","Uruguay","Fransa","İtalya"], ans:1, cat:"Futbol" },
  { q:"En fazla Dünya Kupası kazanan ülke?",            opts:["Almanya","Arjantin","Brezilya","İtalya"], ans:2, cat:"Futbol" },
  { q:"Bir futbol takımında kaç oyuncu olur?",          opts:["9","10","11","12"], ans:2, cat:"Futbol" },
  { q:"Penaltı noktası kale çizgisine kaç metre uzaktır?", opts:["9","10","11","12"], ans:2, cat:"Futbol" },
  { q:"Sarı kart kaç tane olunca kırmızıya döner?",     opts:["1","2","3","4"], ans:1, cat:"Futbol" },
  { q:"Süper Lig'de en fazla gol atan yabancı oyuncu?", opts:["Hakan Şükür","Alex","Roberto Carlos","Meghni"], ans:1, cat:"Türk Futbolu" },
  { q:"UEFA Şampiyonlar Ligi finali kaç yılında Türkiye'de yapıldı?", opts:["2003","2005","2007","2009"], ans:2, cat:"Futbol" },
  { q:"Futbolda 'Hat-trick' ne demektir?",              opts:["3 pas","3 gol","3 kart","3 faul"], ans:1, cat:"Futbol" },
  { q:"Türkiye Milli Takımı 2002 Dünya Kupası'nda kaçıncı oldu?", opts:["2.","3.","4.","5."], ans:1, cat:"Türk Futbolu" },
  { q:"Bir futbol sahasının uzunluğu en fazla kaç metredir?", opts:["90","100","110","120"], ans:2, cat:"Futbol" },
];

function shufflePick(arr, n) {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s.slice(0, n);
}

function createArena(mode, challengerSid, challengerData, defenderSid, defenderData) {
  const arenaId = `arena_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  let questions = [];

  if (mode === 'trivia')     questions = shufflePick(TRIVIA_BANK,   7);
  if (mode === 'football')   questions = shufflePick(FOOTBALL_BANK, 7);
  if (mode === 'speed_math') questions = generateMathQuestions(7);
  if (mode === 'flag')       questions = Array.from({length:7},(_,i)=>({q:`Bayrak #${i+1}`,opts:[],ans:0,cat:'Bayrak'}));

  return {
    arenaId, mode,
    players: {
      [challengerSid]: { ...challengerData, score: 0, ready: false },
      [defenderSid]:   { ...defenderData,   score: 0, ready: false },
    },
    questions, round: -1, phase: 'countdown',
    answers: {}, questionSentAt: 0,
    startedAt: Date.now(),
  };
}

function generateMathQuestions(n) {
  const qs = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '×'];
    const op  = ops[Math.floor(Math.random() * ops.length)];
    let ans;
    if (op === '+') ans = a + b;
    if (op === '-') ans = a - b;
    if (op === '×') ans = a * b;
    // üret 4 şık
    const wrong = new Set();
    while (wrong.size < 3) wrong.add(ans + Math.floor(Math.random()*20) - 10);
    const shuffled = shufflePick([ans, ...[...wrong]], 4);
    qs.push({ q: `${a} ${op} ${b} = ?`, opts: shuffled.map(String), ans: shuffled.indexOf(ans), cat: 'Matematik' });
  }
  return qs;
}

function sendArenaQuestion(io, arenaId, roundIndex) {
  const arena = arenaMatches.get(arenaId);
  if (!arena) return;
  const q = arena.questions[roundIndex];
  arena.round = roundIndex;
  arena.answers = {};
  arena.phase   = 'question';
  arena.questionSentAt = Date.now();

  const payload = {
    arenaId, roundIndex, totalRounds: arena.questions.length,
    question: q.q, options: q.opts, category: q.cat, timeLimit: 15,
    scores: Object.fromEntries(Object.values(arena.players).map(p => [p.name, p.score])),
  };
  for (const sid of Object.keys(arena.players)) io.to(sid).emit('arena:question', payload);

  // 15.5 saniye sonra çöz
  setTimeout(() => resolveArenaRound(io, arenaId, roundIndex), 15500);
}

function resolveArenaRound(io, arenaId, roundIndex) {
  const arena = arenaMatches.get(arenaId);
  if (!arena || arena.round !== roundIndex) return;

  const q = arena.questions[roundIndex];
  const results = {};

  // Bayrak modunda en hızlı tıklayan kazanır
  if (arena.mode === 'flag') {
    const answerers = Object.entries(arena.answers).sort((a,b) => a[1].time - b[1].time);
    for (const [sid, player] of Object.entries(arena.players)) {
      const ans   = arena.answers[sid];
      const first = answerers[0]?.[0] === sid;
      const pts   = (ans && first) ? 1 : 0;
      player.score += pts;
      results[sid] = { correct: first && !!ans, pts, correctIndex: 0, yourAnswer: ans ? 0 : -1, speed: ans?.time ?? 16000 };
    }
  } else {
    for (const [sid, player] of Object.entries(arena.players)) {
      const ans     = arena.answers[sid];
      const correct = ans !== undefined && ans.index === q.ans;
      const speed   = ans ? ans.time : 16000;
      const pts     = correct ? (speed < 5000 ? 3 : speed < 10000 ? 2 : 1) : 0;
      player.score += pts;
      results[sid]  = { correct, pts, correctIndex: q.ans, yourAnswer: ans?.index ?? -1, speed };
    }
  }

  for (const sid of Object.keys(arena.players)) {
    io.to(sid).emit('arena:round_result', {
      arenaId, roundIndex,
      result: results[sid],
      scores: Object.fromEntries(Object.values(arena.players).map(p => [p.name, p.score])),
      correctIndex: q.ans, category: q.cat,
    });
  }

  const nextRound = roundIndex + 1;
  if (nextRound < arena.questions.length) {
    setTimeout(() => sendArenaQuestion(io, arenaId, nextRound), 3200);
  } else {
    setTimeout(() => endArena(io, arenaId), 2500);
  }
}

async function endArena(io, arenaId) {
  const arena = arenaMatches.get(arenaId);
  if (!arena) return;
  arenaMatches.delete(arenaId);

  const players = Object.values(arena.players).sort((a, b) => b.score - a.score);
  const isDraw  = players[0].score === players[1].score;

  const XP = {
    trivia:     { win: 90,  lose: 30,  draw: 50 },
    football:   { win: 80,  lose: 25,  draw: 45 },
    speed_math: { win: 100, lose: 35,  draw: 55 },
    flag:       { win: 70,  lose: 20,  draw: 40 },
  };
  const xpTable = XP[arena.mode] || XP.trivia;

  for (const player of players) {
    const isWinner = !isDraw && player.userId === players[0].userId;
    const xpGain   = isDraw ? xpTable.draw : isWinner ? xpTable.win : xpTable.lose;
    try {
      const u = await User.findById(player.userId);
      if (!u) continue;
      const xr = await u.addXP(xpGain, `arena:${arena.mode}`);
      io.to(player.socketId).emit('arena:end', {
        arenaId, mode: arena.mode, isDraw,
        winner:    isDraw ? null : players[0].name,
        isWinner:  isWinner,
        finalScores: Object.fromEntries(players.map(p => [p.name, p.score])),
        xpGained: xpGain, ...xr,
      });
      io.to(player.socketId).emit('xp:gained', {
        amount: xpGain,
        source: isDraw ? '⚔️ Arena Beraberlik' : isWinner ? '⚔️ Arena Zafer!' : '⚔️ Arena Mağlubiyet',
        ...xr,
      });
      if (xr.leveledUp) io.to(player.socketId).emit('level:up', { level: xr.level, title: xr.title });
      io.emit('player:xp_update', { userId: player.userId, xp: xr.newXP, level: xr.level });
    } catch (e) { console.error('endArena XP error:', e.message); }
  }
}

/* ── Socket event'lerini bağla (her connection için) ── */
function attachArenaEvents(socket, io, connectedPlayers) {
  // ── Davet gönder ──────────────────────────────────
  socket.on('arena:invite', ({ targetUserId, mode }) => {
    const challenger = connectedPlayers.get(socket.id);
    if (!challenger) return;

    let targetSid = null;
    for (const [sid, p] of connectedPlayers) {
      if (p.userId === targetUserId) { targetSid = sid; break; }
    }
    if (!targetSid) { socket.emit('error', { message: 'Oyuncu çevrimiçi değil' }); return; }
    if (targetSid === socket.id) { socket.emit('error', { message: 'Kendinize davet gönderemezsiniz' }); return; }

    const inviteId = `inv_${Date.now()}`;
    arenaInvites.set(targetSid, {
      inviteId, mode,
      challengerSid:    socket.id,
      challengerUserId: challenger.userId,
      challengerName:   challenger.username,
      challengerLevel:  challenger.level,
      challengerAvatar: challenger.avatar,
      expires: Date.now() + 30000,
    });

    io.to(targetSid).emit('arena:invited', {
      inviteId, mode,
      challengerName:  challenger.username,
      challengerLevel: challenger.level,
      challengerAvatar: challenger.avatar,
    });
    socket.emit('arena:invite_sent', { targetUserId, mode });

    // 30s timeout
    setTimeout(() => {
      const inv = arenaInvites.get(targetSid);
      if (inv?.inviteId === inviteId) {
        arenaInvites.delete(targetSid);
        socket.emit('arena:invite_expired');
        io.to(targetSid).emit('arena:invite_cancelled');
      }
    }, 30000);
  });

  // ── Daveti kabul / reddet ──────────────────────────
  socket.on('arena:respond', ({ accept }) => {
    const inv = arenaInvites.get(socket.id);
    if (!inv) { socket.emit('error', { message: 'Geçerli davet yok' }); return; }
    arenaInvites.delete(socket.id);

    if (!accept) {
      io.to(inv.challengerSid).emit('arena:invite_declined', { reason: 'rejected' });
      return;
    }

    const defender = connectedPlayers.get(socket.id);
    if (!defender) return;

    const arena = createArena(
      inv.mode,
      inv.challengerSid, { userId: inv.challengerUserId, name: inv.challengerName, socketId: inv.challengerSid, avatar: inv.challengerAvatar },
      socket.id,         { userId: defender.userId,       name: defender.username,  socketId: socket.id, avatar: defender.avatar },
    );
    arenaMatches.set(arena.arenaId, arena);

    const modeLabels = { trivia: 'Bilgi Yarışması', football: 'Futbol Bilgi', speed_math: 'Hız Matematiği' };

    // Her ikisine arena:enter göndererek "boyuta geçiş" yaptır
    for (const [sid, player] of Object.entries(arena.players)) {
      const opponent = Object.values(arena.players).find(p => p.socketId !== sid);
      io.to(sid).emit('arena:enter', {
        arenaId:      arena.arenaId,
        mode:         arena.mode,
        modeLabel:    modeLabels[arena.mode] || arena.mode,
        totalRounds:  arena.questions.length,
        opponentName:  opponent.name,
        opponentLevel: opponent.level,
        opponentAvatar: opponent.avatar,
        myName:       player.name,
      });
    }

    // 3 saniyelik geri sayım, sonra ilk soru
    let countdown = 3;
    const tick = setInterval(() => {
      for (const sid of Object.keys(arena.players)) {
        io.to(sid).emit('arena:countdown', { count: countdown });
      }
      countdown--;
      if (countdown < 0) {
        clearInterval(tick);
        sendArenaQuestion(io, arena.arenaId, 0);
      }
    }, 1000);
  });

  // ── Cevap ─────────────────────────────────────────
  socket.on('arena:answer', ({ arenaId, answerIndex }) => {
    const arena = arenaMatches.get(arenaId);
    if (!arena || arena.phase !== 'question') return;
    if (arena.answers[socket.id]) return;

    arena.answers[socket.id] = { index: answerIndex, time: Date.now() - arena.questionSentAt };

    // Rakibe bildir
    for (const sid of Object.keys(arena.players)) {
      if (sid !== socket.id) io.to(sid).emit('arena:opponent_answered', { arenaId });
    }

    // Her iki oyuncu da cevapladıysa hemen çöz
    if (Object.keys(arena.answers).length >= Object.keys(arena.players).length) {
      resolveArenaRound(io, arenaId, arena.round);
    }
  });

  // ── Bayrak Kapmaca ────────────────────────────────
  socket.on('arena:flag_grab', ({ arenaId }) => {
    const arena = arenaMatches.get(arenaId);
    if (!arena || arena.mode !== 'flag' || arena.phase !== 'question') return;
    if (arena.answers[socket.id]) return; // zaten bastı

    const speed = Date.now() - arena.questionSentAt;
    arena.answers[socket.id] = { index: 0, time: speed };

    // Rakibe bildir
    for (const sid of Object.keys(arena.players)) {
      if (sid !== socket.id) io.to(sid).emit('arena:opponent_answered', { arenaId });
    }

    // Bayrak modunda ilk basan kazanır, hemen çöz
    resolveArenaRound(io, arenaId, arena.round);
  });

  // ── Teslim ol ─────────────────────────────────────
  socket.on('arena:forfeit', ({ arenaId }) => {
    const arena = arenaMatches.get(arenaId);
    if (!arena) return;
    for (const sid of Object.keys(arena.players)) {
      if (sid !== socket.id) io.to(sid).emit('arena:opponent_forfeited');
    }
    endArena(io, arenaId);
  });
}

module.exports = (io) => {

  io.use(async (socket,next)=>{
    try{
      const token=socket.handshake.auth?.token||socket.handshake.query?.token;
      if(!token) return next(new Error("Token gerekli"));
      const secret=process.env.JWT_SECRET||"mku_campus_game_fallback_secret";
      const decoded=jwt.verify(token,secret);
      const user=await User.findById(decoded.id).select("-password");
      if(!user) return next(new Error("Kullanıcı bulunamadı"));
      if(user.isBanned) return next(new Error("Hesabınız askıya alınmıştır"));
      socket.userId=user._id.toString(); socket.username=user.username; socket.role=user.role;
      next();
    } catch(e){ next(new Error("Geçersiz token")); }
  });

  io.on("connection", async (socket)=>{
    console.log(`🟢 ${socket.username} bağlandı`);
    let user;
    try{ user=await User.findById(socket.userId); if(!user){socket.disconnect();return;} user.isOnline=true; user.socketId=socket.id; await user.save(); }
    catch(e){ socket.disconnect(); return; }

    // Günlük bonus
    try{ const d=await user.claimDailyBonus(); if(d.claimed) socket.emit("daily:bonus",d); } catch(e){}

    const playerData={ userId:user._id.toString(), username:user.username, avatar:user.avatar, level:user.level, xp:user.xp, title:user.title, role:user.role, position:user.lastPosition||{lat:36.3303718,lng:36.1963282}, currentRoom:null, socketId:socket.id, teamId:user.teamId };
    connectedPlayers.set(socket.id,playerData);

    const activeQuests=await Quest.find({isActive:true}).sort({orderIndex:1});

    socket.emit("init",{
      self:user.toPublicJSON(),
      players:Array.from(connectedPlayers.values()).filter(p=>p.socketId!==socket.id),
      gameLocations:ALL_LOCATIONS,
      hiddenSpots:HIDDEN_SPOTS.map(h=>({ id:h.id, name:h.name, icon:h.icon, clue:h.clue, lat:h.lat, lng:h.lng, found:user.hiddenFound?.includes(h.id) })),
      npcs:NPCS,
      quests:activeQuests,
      myQuestProgress:user.questProgress||[],
      discoveredLocs:(user.locationVisits||[]).map(v=>v.locationId),
    });

    socket.broadcast.emit("player:joined",playerData);

    /* ── Hareket ── */
    let saveTimer=null, lastNPC=null;
    const scheduleSave=(lat,lng,x,y)=>{ if(saveTimer) clearTimeout(saveTimer); saveTimer=setTimeout(()=>User.findByIdAndUpdate(socket.userId,{lastPosition:{lat,lng,x,y,updatedAt:new Date()}}).catch(()=>{}),2000); };

    socket.on("player:move", async (data)=>{
      try{
        const{lat,lng,x,y}=data; if(typeof lat!=="number"||typeof lng!=="number") return;
        const player=connectedPlayers.get(socket.id); if(!player) return;
        player.position={lat,lng,x,y}; connectedPlayers.set(socket.id,player); scheduleSave(lat,lng,x,y);

        // Lokasyon
        const loc=detectLocation(lat,lng), newRoom=loc?loc.chatRoomId:null;
        if(player.currentRoom!==newRoom){
          if(player.currentRoom){ socket.leave(player.currentRoom); socket.to(player.currentRoom).emit("player:left_room",{userId:socket.userId,username:socket.username}); }
          if(newRoom){
            socket.join(newRoom);
            socket.to(newRoom).emit("player:entered_room",{userId:socket.userId,username:socket.username,roomId:newRoom});
            socket.emit("location:entered",{location:loc});
            try{ const vr=await user.recordVisit(loc.id); if(vr.isFirst){ const xr=await user.addXP(25,`discovery:${loc.id}`); socket.emit("xp:gained",{amount:25,source:`🔭 ${loc.name} keşfedildi!`,...xr}); const ns=await updateQuestProgress(socket.userId,"new_location",{locationId:loc.id}); for(const n of ns) socket.emit("quest:completed",n); } } catch(e){}
            // Takım destek bonusu
            try{
              if(player.teamId){
                const team=await Team.findById(player.teamId);
                if(team){
                  const teamMemberSockets=Array.from(connectedPlayers.values()).filter(p=>p.socketId!==socket.id&&p.currentRoom===newRoom&&String(p.teamId)===String(player.teamId));
                  if(teamMemberSockets.length>0){
                    const xr=await user.addXP(15,"team_support");
                    socket.emit("xp:gained",{amount:15,source:"🤝 Takım destek bonusu!",...xr});
                    await Team.findByIdAndUpdate(player.teamId,{$inc:{weeklyXP:15,totalXP:15}});
                  }
                }
              }
            } catch(e){}
          }
          player.currentRoom=newRoom; connectedPlayers.set(socket.id,player);
        }

        // Lokasyon XP — DB tabanlı cooldown (oturum bağımsız)
        if(loc){
          try{
            const fresh=await User.findById(socket.userId);
            if(fresh){
              const lastClaim = fresh.locationXpClaims?.get(loc.id);
              const now = Date.now();
              const elapsed = lastClaim ? now - new Date(lastClaim).getTime() : Infinity;
              if(elapsed > loc.xpCooldown){
                // Cooldown zamanını DB'ye kaydet
                fresh.locationXpClaims = fresh.locationXpClaims || new Map();
                fresh.locationXpClaims.set(loc.id, new Date());
                fresh.markModified('locationXpClaims'); // Map değişikliklerini Mongoose'a bildir
                const xr=await fresh.addXP(loc.xpReward,`location:${loc.id}`);
                player.xp=xr.newXP; player.level=xr.level; connectedPlayers.set(socket.id,player);
                socket.emit("xp:gained",{amount:loc.xpReward,source:loc.name,...xr});
                if(xr.leveledUp) socket.emit("level:up",{level:xr.level,title:xr.title});
                io.emit("player:xp_update",{userId:socket.userId,xp:xr.newXP,level:xr.level});
                const ns=await updateQuestProgress(socket.userId,"location_visit",{locationId:loc.id});
                for(const n of ns) socket.emit("quest:completed",n);
                if(player.teamId) await Team.findByIdAndUpdate(player.teamId,{$inc:{weeklyXP:loc.xpReward,totalXP:loc.xpReward}});
              } else {
                // Cooldown bilgisini gönder (UI'de göstermek için)
                const remaining = Math.ceil((loc.xpCooldown - elapsed) / 60000);
                socket.emit("xp:cooldown",{locationId:loc.id, remainingMinutes:remaining});
              }
            }
          } catch(e){ console.error("XP cooldown error:", e.message); }
        }

        // Gizli nokta kontrolü
        const hidden=detectHidden(lat,lng);
        if(hidden && !user.hiddenFound?.includes(hidden.id)){
          user.hiddenFound=user.hiddenFound||[]; user.hiddenFound.push(hidden.id); user.stats.hiddenFound=(user.stats.hiddenFound||0)+1;
          const xr=await user.addXP(hidden.xp,`hidden:${hidden.id}`);
          socket.emit("hidden:found",{spot:hidden,...xr});
          io.emit("player:xp_update",{userId:socket.userId,xp:xr.newXP,level:xr.level});
          if(user.stats.hiddenFound>=5 && !user.badges.find(b=>b.id==="hidden_5")) { user.badges.push({id:"hidden_5",name:"Gizem Avcısı",icon:"🕵️",rarity:"rare"}); await user.save(); }
          if(user.stats.hiddenFound>=15 && !user.badges.find(b=>b.id==="hidden_all")) { user.badges.push({id:"hidden_all",name:"Efsane Kaşif",icon:"🗝️",rarity:"legendary"}); await user.save(); }
        }

        // NPC yakınlık
        const npc=detectNPC(lat,lng);
        if(npc && npc.id!==lastNPC){ lastNPC=npc.id; socket.emit("npc:nearby",{npc}); }
        else if(!npc && lastNPC){ lastNPC=null; socket.emit("npc:away"); }

        socket.broadcast.emit("player:moved",{userId:socket.userId,socketId:socket.id,position:{lat,lng,x,y},currentRoom:newRoom});
      } catch(e){ console.error("player:move:",e.message); }
    });

    /* ── Sohbet ── */
    socket.on("chat:send", async (data)=>{
      try{
        let{roomId,content}=data; if(!content?.trim()||!roomId) return;
        if(content.length>500){socket.emit("error",{message:"Max 500 karakter"});return;}
        const validRoom=ALL_LOCATIONS.find(l=>l.chatRoomId===roomId||l.id===roomId);
        if(!validRoom){socket.emit("error",{message:"Geçersiz oda"});return;}
        roomId=validRoom.chatRoomId;
        const player=connectedPlayers.get(socket.id);
        if(!player||player.currentRoom!==roomId){ socket.join(roomId); if(player){player.currentRoom=roomId;connectedPlayers.set(socket.id,player);} }
        const userDoc=await User.findById(socket.userId);
        if(!userDoc) return;
        if(userDoc.mutedUntil&&userDoc.mutedUntil>new Date()){const m=Math.ceil((userDoc.mutedUntil-new Date())/60000);socket.emit("error",{message:`${m} dakika susturuldunuz`});return;}
        const message=new Message({roomId,sender:{userId:socket.userId,username:userDoc.username,avatar:userDoc.avatar,level:userDoc.level,role:userDoc.role},content:content.trim(),type:"text"});
        await message.save();
        const chatXp=await userDoc.addChatXP();
        if(chatXp){socket.emit("xp:gained",{amount:5,source:"💬 Sohbet XP",...chatXp});const ns=await updateQuestProgress(socket.userId,"chat_message");for(const n of ns) socket.emit("quest:completed",n);}
        io.to(roomId).emit("chat:message",{id:message._id,_id:message._id,roomId,sender:message.sender,content:message.content,type:message.type,createdAt:message.createdAt});
      } catch(e){ console.error("chat:send:",e.message); socket.emit("error",{message:"Mesaj gönderilemedi"}); }
    });

    /* ── Anı Defteri ── */
    socket.on("memory:post", async ({locationId,content,mood})=>{
      try{
        if(!content?.trim()||!locationId) return;
        if(content.length>280){socket.emit("error",{message:"Max 280 karakter"});return;}
        const userDoc=await User.findById(socket.userId);
        const post=new MemoryPost({locationId,author:{userId:socket.userId,username:userDoc.username,avatar:userDoc.avatar,faculty:userDoc.faculty},content:content.trim(),mood:mood||"😊"});
        await post.save();
        await User.findByIdAndUpdate(socket.userId,{$inc:{"stats.memoryPosts":1}});
        const xr=await userDoc.addXP(10,"memory_post");
        socket.emit("xp:gained",{amount:10,source:"📝 Anı yazıldı",...xr});
        io.emit("memory:new_post",{post});
      } catch(e){ socket.emit("error",{message:"Anı paylaşılamadı"}); }
    });

    socket.on("memory:like", async ({postId})=>{
      try{
        const post=await MemoryPost.findById(postId);
        if(!post) return;
        const idx=post.likes.findIndex(id=>id.toString()===socket.userId);
        if(idx>-1) post.likes.splice(idx,1); else post.likes.push(socket.userId);
        await post.save();
        io.emit("memory:like_update",{postId,likes:post.likes.length,likedBy:socket.userId});
      } catch(e){}
    });

    /* ── Mini Oyun ── */
    socket.on("minigame:start", ({locationId})=>{
      // Her oyunda bankadan 5 yeni soru seç
      const qs=MINI_GAME_BANKS[locationId] ? _shufflePick(MINI_GAME_BANKS[locationId],5) : MINI_GAMES[locationId];
      if(!qs){socket.emit("error",{message:"Bu alanda mini oyun yok"});return;}
      const q=qs[Math.floor(Math.random()*qs.length)];
      socket.emit("minigame:question",{locationId,question:q.q,options:q.opts,questionIndex:qs.indexOf(q)});
      socket._mgQuestion={locationId,answerIndex:q.ans,startedAt:Date.now()};
    });

    socket.on("minigame:answer", async ({locationId,answerIndex})=>{
      try{
        const mg=socket._mgQuestion;
        if(!mg||mg.locationId!==locationId){socket.emit("minigame:result",{correct:false,message:"Süre doldu!"});return;}
        const timeTaken=(Date.now()-mg.startedAt)/1000;
        const correct=answerIndex===mg.answerIndex;
        socket._mgQuestion=null;
        let xpGain=0, message="";
        if(correct){
          xpGain=timeTaken<5?50:timeTaken<10?35:20;
          message=`✅ Doğru! +${xpGain} XP`;
          const userDoc=await User.findById(socket.userId);
          if(userDoc){ const xr=await userDoc.addXP(xpGain,"minigame"); socket.emit("xp:gained",{amount:xpGain,source:"🎮 Mini Oyun",...xr}); }
        } else { message="❌ Yanlış!"; }
        socket.emit("minigame:result",{correct,message,xpGain,correctIndex:mg.answerIndex});
      } catch(e){}
    });

    /* ── NPC Görev ── */
    socket.on("npc:accept_quest", async ({npcId,questIndex})=>{
      try{
        const npc=NPCS.find(n=>n.id===npcId); if(!npc) return;
        const quest=npc.quests[questIndex]; if(!quest) return;
        socket.emit("npc:quest_started",{npc,quest,message:`"${quest.text}" — Başarılar!`});
        // Basit: görev tamamlandığında location visit ile tetiklenir veya timeout
        setTimeout(async()=>{
          const userDoc=await User.findById(socket.userId);
          if(userDoc){ const xr=await userDoc.addXP(quest.xp,`npc:${npcId}`); socket.emit("npc:quest_complete",{npc,quest,xpGain:quest.xp,...xr}); socket.emit("xp:gained",{amount:quest.xp,source:`🧑 ${npc.name}: ${quest.text}`,...xr}); }
        },5000); // gerçekte lokasyon check ile tamamlanır, şimdilik 5s delay
      } catch(e){}
    });

    /* ── Arkadaş Sistemi ── */
    socket.on("friend:request", async ({targetUsername})=>{
      try{
        const target=await User.findOne({username:targetUsername});
        if(!target){socket.emit("error",{message:"Kullanıcı bulunamadı"});return;}
        if(String(target._id)===socket.userId){socket.emit("error",{message:"Kendinize istek gönderemezsiniz"});return;}
        const me=await User.findById(socket.userId);
        if(me.friends.map(String).includes(String(target._id))){socket.emit("error",{message:"Zaten arkadaşsınız"});return;}
        if(target.friendRequests.find(r=>String(r.from)===socket.userId)){socket.emit("error",{message:"İstek zaten gönderildi"});return;}
        await User.findByIdAndUpdate(target._id,{$push:{friendRequests:{from:socket.userId,username:me.username,avatar:me.avatar}}});
        socket.emit("friend:request_sent",{to:targetUsername});
        const tSocket=Array.from(connectedPlayers.values()).find(p=>p.userId===String(target._id));
        if(tSocket) io.to(tSocket.socketId).emit("friend:incoming_request",{from:{userId:socket.userId,username:me.username,avatar:me.avatar}});
      } catch(e){ socket.emit("error",{message:"İstek gönderilemedi"}); }
    });

    socket.on("friend:respond", async ({fromUserId,accept})=>{
      try{
        await User.findByIdAndUpdate(socket.userId,{$pull:{friendRequests:{from:fromUserId}}});
        if(accept){
          await User.findByIdAndUpdate(socket.userId,{$addToSet:{friends:fromUserId}});
          await User.findByIdAndUpdate(fromUserId,{$addToSet:{friends:socket.userId}});
          socket.emit("friend:accepted",{userId:fromUserId});
          const fSocket=Array.from(connectedPlayers.values()).find(p=>p.userId===fromUserId);
          if(fSocket){ const me=await User.findById(socket.userId); io.to(fSocket.socketId).emit("friend:accepted",{userId:socket.userId,username:me.username,avatar:me.avatar}); }
          // Arkadaş konumları gönder
          const freshMe=await User.findById(socket.userId).populate("friends","username avatar lastPosition isOnline currentRoom level");
          socket.emit("friend:list",{friends:freshMe.friends});
        }
      } catch(e){}
    });

    socket.on("friend:get_list", async ()=>{
      try{
        const me=await User.findById(socket.userId).populate("friends","username avatar lastPosition isOnline currentRoom level");
        socket.emit("friend:list",{friends:me.friends,requests:me.friendRequests});
      } catch(e){}
    });

    /* ── Takım Sistemi ── */
    socket.on("team:create", async ({name,tag,color,emoji})=>{
      try{
        if(!name||!tag){socket.emit("error",{message:"İsim ve tag gerekli"});return;}
        const me=await User.findById(socket.userId);
        if(me.teamId){socket.emit("error",{message:"Zaten bir takımdadasınız"});return;}
        const team=new Team({name,tag:tag.toUpperCase(),color:color||"#00f5ff",emoji:emoji||"⚡",leaderId:socket.userId,members:[socket.userId]});
        await team.save();
        await User.findByIdAndUpdate(socket.userId,{teamId:team._id});
        const player=connectedPlayers.get(socket.id); if(player){player.teamId=team._id;connectedPlayers.set(socket.id,player);}
        socket.emit("team:created",{team});
        socket.emit("team:joined",{team});
      } catch(e){ socket.emit("error",{message:"Takım oluşturulamadı: "+(e.message.includes("duplicate")?"Bu isim/tag kullanılıyor":e.message)}); }
    });

    socket.on("team:join", async ({teamId})=>{
      try{
        const me=await User.findById(socket.userId);
        if(me.teamId){socket.emit("error",{message:"Zaten bir takımdadasınız"});return;}
        const team=await Team.findById(teamId);
        if(!team){socket.emit("error",{message:"Takım bulunamadı"});return;}
        if(team.members.length>=team.maxMembers){socket.emit("error",{message:"Takım dolu"});return;}
        await Team.findByIdAndUpdate(teamId,{$addToSet:{members:socket.userId}});
        await User.findByIdAndUpdate(socket.userId,{teamId});
        const player=connectedPlayers.get(socket.id); if(player){player.teamId=teamId;connectedPlayers.set(socket.id,player);}
        socket.emit("team:joined",{team});
        const teamSockets=Array.from(connectedPlayers.values()).filter(p=>String(p.teamId)===String(teamId)&&p.socketId!==socket.id);
        const me2=await User.findById(socket.userId);
        for(const ts of teamSockets) io.to(ts.socketId).emit("team:member_joined",{userId:socket.userId,username:me2.username,avatar:me2.avatar});
      } catch(e){ socket.emit("error",{message:"Takıma katılınamadı"}); }
    });

    socket.on("team:leave", async ()=>{
      try{
        const me=await User.findById(socket.userId);
        if(!me.teamId) return;
        const team=await Team.findById(me.teamId);
        if(team){
          await Team.findByIdAndUpdate(me.teamId,{$pull:{members:socket.userId}});
          if(String(team.leaderId)===socket.userId && team.members.length>1){
            const newLeader=team.members.find(m=>String(m)!==socket.userId);
            await Team.findByIdAndUpdate(me.teamId,{leaderId:newLeader});
          }
          if(team.members.length<=1) await Team.findByIdAndDelete(me.teamId);
        }
        await User.findByIdAndUpdate(socket.userId,{teamId:null});
        const player=connectedPlayers.get(socket.id); if(player){player.teamId=null;connectedPlayers.set(socket.id,player);}
        socket.emit("team:left");
      } catch(e){}
    });

    socket.on("team:list", async ()=>{
      try{
        const teams=await Team.find({}).sort({weeklyXP:-1}).limit(20).populate("members","username avatar level");
        socket.emit("team:list_result",{teams});
      } catch(e){}
    });

    /* ── Görev Talep ── */
    socket.on("quest:claim", async ({questId})=>{
      try{
        const user2=await User.findById(socket.userId);
        const qp=user2.questProgress.find(p=>p.questId===questId);
        if(!qp||qp.status!=="completed"){socket.emit("error",{message:"Görev tamamlanmamış"});return;}
        const quest=await Quest.findOne({questId});
        if(!quest){socket.emit("error",{message:"Görev bulunamadı"});return;}
        qp.status="claimed"; qp.claimedAt=new Date(); user2.stats.questsCompleted+=1;
        if(quest.badgeReward?.id && !user2.badges.find(b=>b.id===quest.badgeReward.id)) user2.badges.push({...quest.badgeReward,earnedAt:new Date()});
        const xr=await user2.addXP(quest.xpReward,`quest:${questId}`);
        socket.emit("quest:claimed",{questId,quest:quest.title,...xr,badge:quest.badgeReward});
        socket.emit("xp:gained",{amount:quest.xpReward,source:`🎯 ${quest.title}`,...xr});
        if(xr.leveledUp) socket.emit("level:up",{level:xr.level,title:xr.title});
        io.emit("player:xp_update",{userId:socket.userId,xp:xr.newXP,level:xr.level});
        socket.emit("quest:progress_update",{progress:user2.questProgress});
        if(user2.teamId) await Team.findByIdAndUpdate(user2.teamId,{$inc:{weeklyXP:quest.xpReward,totalXP:quest.xpReward}});
      } catch(e){ socket.emit("error",{message:"Ödül alınamadı"}); }
    });

    /* ── Admin / Mod ── */
    socket.on("admin:give_xp", async ({targetUserId,amount,reason})=>{ const me=await User.findById(socket.userId); if(!me?.permissions?.canGiveXP){socket.emit("error",{message:"Yetkisiz"});return;} const t=await User.findById(targetUserId); if(!t) return; const xr=await t.addXP(parseInt(amount),`admin:${me.username}`); socket.emit("admin:success",{message:`✅ ${t.username}'e ${amount} XP verildi`}); const ts=Array.from(connectedPlayers.values()).find(p=>p.userId===targetUserId); if(ts) io.to(ts.socketId).emit("xp:gained",{amount,source:`🎁 Admin:${reason||""}`,...xr}); io.emit("player:xp_update",{userId:targetUserId,xp:xr.newXP,level:xr.level}); });
    socket.on("admin:set_role", async ({targetUserId,role})=>{ const me=await User.findById(socket.userId); if(me?.role!=="admin"){socket.emit("error",{message:"Sadece adminler rol atayabilir"});return;} await User.findByIdAndUpdate(targetUserId,{role}); socket.emit("admin:success",{message:`✅ Rol güncellendi: ${role}`}); });
    socket.on("mod:warn_user", async ({targetUserId,reason})=>{ const me=await User.findById(socket.userId); if(!me?.permissions?.canWarnUsers){socket.emit("error",{message:"Yetkisiz"});return;} await User.findByIdAndUpdate(targetUserId,{$push:{warnings:{reason,by:me.username,at:new Date()}}}); socket.emit("admin:success",{message:"⚠️ Kullanıcı uyarıldı"}); });
    socket.on("mod:mute_user", async ({targetUserId,minutes})=>{ const me=await User.findById(socket.userId); if(!me?.permissions?.canWarnUsers){socket.emit("error",{message:"Yetkisiz"});return;} await User.findByIdAndUpdate(targetUserId,{mutedUntil:new Date(Date.now()+(minutes||10)*60000)}); socket.emit("admin:success",{message:`🔇 ${minutes} dk susturuldu`}); });
    socket.on("mod:delete_message", async ({messageId,roomId})=>{ const me=await User.findById(socket.userId); if(!me?.permissions?.canDeleteMessages){socket.emit("error",{message:"Yetkisiz"});return;} await Message.findByIdAndDelete(messageId); io.to(roomId).emit("chat:message_deleted",{messageId}); socket.emit("admin:success",{message:"🗑️ Mesaj silindi"}); });
    socket.on("admin:ban_user", async ({targetUserId,reason})=>{ const me=await User.findById(socket.userId); if(!me?.permissions?.canBanUsers){socket.emit("error",{message:"Yetkisiz"});return;} await User.findByIdAndUpdate(targetUserId,{isBanned:true,banReason:reason}); const ts=Array.from(connectedPlayers.values()).find(p=>p.userId===targetUserId); if(ts) io.to(ts.socketId).emit("banned",{reason}); socket.emit("admin:success",{message:"🚫 Banlandı"}); });


    /* ───────────────────────────────────────────── */
    /* ── Disconnect ── */
    socket.on("disconnect", async ()=>{
      if(saveTimer) clearTimeout(saveTimer);
      const player=connectedPlayers.get(socket.id);
      if(player?.currentRoom) socket.to(player.currentRoom).emit("player:left_room",{userId:socket.userId,username:socket.username});
      connectedPlayers.delete(socket.id);
      User.findByIdAndUpdate(socket.userId,{isOnline:false,socketId:null,currentRoom:null,lastSeen:new Date()}).catch(()=>{});
      io.emit("player:disconnected",{userId:socket.userId,socketId:socket.id});
      io.emit("server:stats",{onlineCount:connectedPlayers.size,timestamp:Date.now()});
      console.log(`🔴 ${socket.username} ayrıldı`);
    });

    socket.on("ping",()=>socket.emit("pong",{timestamp:Date.now()}));

    /* ── Arena event'leri bağla ── */
    attachArenaEvents(socket, io, connectedPlayers);
  });

  setInterval(()=>io.emit("server:stats",{onlineCount:connectedPlayers.size,timestamp:Date.now()}),10000);
  return { connectedPlayers, ALL_LOCATIONS, HIDDEN_SPOTS, NPCS };
};
