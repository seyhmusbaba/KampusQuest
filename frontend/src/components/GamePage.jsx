import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { gameAPI } from '../utils/api';
import GameMap from './GameMap';
import './GameMap.css';
import ChatPanel from './ChatPanel';
import GameHUD from './GameHUD';
import LeaderboardPanel from './LeaderboardPanel';
import QuestPanel from './QuestPanel';
import AdminPanel from './AdminPanel';
import SocialPanel from './SocialPanel';
import MemoryWall from './MemoryWall';
import MiniGame from './MiniGame';
import NPCDialog from './NPCDialog';
import CluePanel from './CluePanel';
import ArenaPortal from './ArenaPortal';

let nid = 0;
const SESSION_START = Date.now();

export default function GamePage() {
  const { user, token, logout, updateUser } = useAuth();

  // Temel state
  const [others, setOthers]               = useState([]);
  const [messages, setMessages]           = useState([]);
  const [room, setRoom]                   = useState(null);
  const [curLoc, setCurLoc]               = useState(null);
  const [notifs, setNotifs]               = useState([]);
  const [online, setOnline]               = useState(1);
  const [chatFocused, setChatFocused]     = useState(false);

  // Panel gösterim
  const [showLB, setShowLB]               = useState(false);
  const [chatOpen, setChatOpen]           = useState(false);
  const [showQuests, setShowQuests]       = useState(false);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [showSocial, setShowSocial]       = useState(false);
  const [showMemory, setShowMemory]       = useState(false);
  const [showMiniGame, setShowMiniGame]   = useState(false);
  const [showClues, setShowClues]         = useState(false);
  const [showArena, setShowArena]         = useState(false);

  // Özellik state
  const [npcDialog, setNpcDialog]         = useState(null);
  const [friendLocations, setFriendLocations] = useState([]);
  const [hiddenSpots, setHiddenSpots]     = useState([]);
  const [npcs, setNpcs]                   = useState([]);
  const [nearbyNPC, setNearbyNPC]         = useState(null);
  const [discoveredLocs, setDiscoveredLocs] = useState([]);
  const [pendingArena, setPendingArena]   = useState(null); // gelen meydan okuma bildirimi
  const [quickInvite, setQuickInvite]     = useState(null);  // haritadan tıklanan oyuncu

  // Görevler
  const [quests, setQuests]               = useState([]);
  const [myProgress, setMyProgress]       = useState([]);
  const [pendingQuests, setPendingQuests] = useState(0);

  const socketRef = useRef(null);

  const addNotif = useCallback((text, type='info', icon='ℹ️') => {
    const id = ++nid;
    setNotifs(p => [...p.slice(-4), { id, text, type, icon }]);
    setTimeout(() => setNotifs(p => p.filter(n => n.id !== id)), 3800);
  }, []);

  const { connected, sendMove, sendChat, claimQuest, socket } = useGameSocket(token, {
    onInit: d => {
      setOthers(d.players || []);
      setOnline((d.players?.length || 0) + 1);
      if (d.quests)          setQuests(d.quests);
      if (d.myQuestProgress) setMyProgress(d.myQuestProgress);
      if (d.hiddenSpots)     setHiddenSpots(d.hiddenSpots);
      if (d.npcs)            setNpcs(d.npcs);
      if (d.discoveredLocs)  setDiscoveredLocs(d.discoveredLocs);
    },
    onPlayerMoved:       d => setOthers(p => p.map(x => x.userId === d.userId ? {...x, position:d.position, currentRoom:d.currentRoom} : x)),
    onPlayerJoined:      d => { setOthers(p => [...p.filter(x => x.userId !== d.userId), d]); setOnline(c => c+1); addNotif(`${d.username} kampüse katıldı`,'info','🎓'); },
    onPlayerDisconnected:d => { setOthers(p => p.filter(x => x.userId !== d.userId && x.socketId !== d.socketId)); setOnline(c => Math.max(1, c-1)); },
    onChatMessage:       d => setMessages(p => [...p.slice(-200), d]),
    onMessageDeleted:    d => setMessages(p => p.filter(m => (m._id||m.id) !== d.messageId)),
    onXPGained:          d => { updateUser({xp:d.newXP, level:d.level, title:d.title}); addNotif(`+${d.amount} XP — ${d.source}`,'xp','✨'); },
    onLevelUp:           d => addNotif(`🏆 Seviye ${d.level} — ${d.title}!`,'level','🏆'),
    onDailyBonus:        d => { updateUser({xp:d.newXP, level:d.level}); addNotif(`🎁 Günlük: +${d.bonus} XP · ${d.streak} gün seri!`,'xp','🔥'); },
    onQuestCompleted:    d => { addNotif(`🎯 Görev tamam: ${d.title}`,'quest','🎯'); setMyProgress(p => { const np=[...p]; const q=np.find(x=>x.questId===d.questId); if(q) q.status='completed'; return np; }); setPendingQuests(c=>c+1); },
    onQuestClaimed:      d => { setMyProgress(p => { const np=[...p]; const q=np.find(x=>x.questId===d.questId); if(q) q.status='claimed'; return np; }); setPendingQuests(c=>Math.max(0,c-1)); if(d.badge) addNotif(`${d.badge.icon} Rozet: ${d.badge.name}`,'level',d.badge.icon); },
    onQuestProgressUpdate: d => setMyProgress(d.progress),
    onAdminSuccess:      d => addNotif(d.message,'info','⚙️'),
    onError:             e => addNotif(e.message,'error','⚠️'),
    onServerStats:       d => setOnline(d.onlineCount || 1),
    onHiddenFound:       d => { addNotif(`🗝️ Gizli nokta: ${d.spot?.name} +${d.spot?.xp} XP`,'level','🗝️'); setHiddenSpots(p => p.map(h => h.id===d.spot?.id ? {...h,found:true} : h)); },
  });

  // Ek socket event'leri
  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const onFriendList = d => setFriendLocations(d.friends || []);
    const onBattleChallenge = d => {
      setPendingArena(d);
      addNotif(`⚔️ ${d.challengerName} sizi Arenaya davet etti!`,'level','⚔️');
    };

    socket.on('friend:list', onFriendList);
    socket.on('arena:invited', onBattleChallenge);
    socket.emit('friend:get_list');

    return () => {
      socket.off('friend:list', onFriendList);
      socket.off('arena:invited', onBattleChallenge);
    };
  }, [socket, addNotif]);

  // Keşfedilen lokasyonları takip et
  const handleEnter = useCallback(loc => {
    setCurLoc(loc);
    setRoom(loc.chatRoomId || loc.id);
    setChatOpen(true);
    addNotif(`${loc.icon} ${loc.name}`, 'info', loc.icon);
    // Yeni keşif — ekle
    setDiscoveredLocs(prev => prev.includes(loc.id) ? prev : [...prev, loc.id]);
  }, [addNotif]);

  // Chat — oturum başından itibaren
  useEffect(() => {
    if (!room) return;
    gameAPI.messages(room, { since: SESSION_START }).then(res => {
      setMessages(prev => {
        const ids = new Set(prev.map(m => m._id || m.id));
        return [...(res.data.messages||[]).filter(m => !ids.has(m._id)), ...prev].slice(-200);
      });
    }).catch(() => {});
  }, [room]);

  const handleMove  = useCallback((lat,lng,x,y) => sendMove(lat,lng,x,y), [sendMove]);
  const handleLeave = useCallback(() => { setCurLoc(null); setRoom(null); }, []);
  const handlePlayerClick = useCallback(player => { setQuickInvite(player); }, []);
  const handleNPC   = useCallback(npc => { setNearbyNPC(npc); if (npc) addNotif(`${npc.icon} ${npc.name} yakında!`,'info',npc.icon); }, [addNotif]);

  const canAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const hasMiniGame = curLoc && ['library','cafeteria','spor','rektorluk'].includes(curLoc.id);
  const isRektorluk = curLoc?.id === 'rektorluk';

  // Aynı lokasyondaki oyuncular (savaş için)
  const nearbyPlayers = curLoc
    ? others.filter(p => p.currentRoom === curLoc.chatRoomId || p.currentRoom === curLoc.id)
    : [];

  return (
    <div style={S.root}>
      <div style={S.mapWrap}>
        <GameMap
          selfPlayer={user}
          otherPlayers={others}
          friendLocations={friendLocations}
          hiddenSpots={hiddenSpots}
          npcs={npcs}
          discoveredLocs={discoveredLocs}
          onPlayerMove={handleMove}
          onLocationEnter={handleEnter}
          onLocationLeave={handleLeave}
          onNPCNearby={handleNPC}
          onPlayerClick={handlePlayerClick}
          chatFocused={chatFocused}
        />
        <GameHUD
          user={user} onlineCount={online} connected={connected}
          currentLocation={curLoc} notifications={notifs}
          hiddenFoundCount={hiddenSpots.filter(h=>h.found).length}
          totalHidden={15}
        />

        {/* NPC Bildirim */}
        {nearbyNPC && (
          <div style={S.npcAlert} onClick={() => setNpcDialog(nearbyNPC)}>
            <span style={S.npcAlertIcon}>{nearbyNPC.icon}</span>
            <span style={S.npcAlertText}>{nearbyNPC.name} yakında — <b>konuş</b></span>
            <button onClick={e=>{e.stopPropagation();setNearbyNPC(null);}} style={S.npcAlertClose}>✕</button>
          </div>
        )}

        {/* Gelen savaş meydan okuma bildirimi */}
        {pendingArena && !showArena && (
          <div style={S.battleAlert} onClick={() => { setShowArena(true); setPendingArena(null); }}>
            <span style={{fontSize:20}}>⚔️</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'#dc2626',fontFamily:'monospace'}}>{pendingArena.challengerName} meydan okudu!</div>
              <div style={{fontSize:10,color:'rgba(100,116,139,0.6)'}}>Kabul etmek için tıkla</div>
            </div>
            <button onClick={e=>{e.stopPropagation();setPendingArena(null);}} style={S.npcAlertClose}>✕</button>
          </div>
        )}

        {/* Hızlı Arena Daveti — haritadan oyuncuya tıklanınca */}
        {quickInvite && (
          <QuickInvitePopup
            player={quickInvite}
            onInvite={(mode) => {
              socket?.emit('arena:invite', { targetUserId: quickInvite.userId, mode });
              addNotif(`⚔️ ${quickInvite.username}'e ${mode} daveti gönderildi!`,'level','⚔️');
              setQuickInvite(null);
            }}
            onClose={() => setQuickInvite(null)}
          />
        )}

        {/* Lokasyon Aksiyon Paneli */}
        {curLoc && (
          <LocationPanel
            loc={curLoc}
            hasMiniGame={hasMiniGame}
            isRektorluk={isRektorluk}
            hasBattle={nearbyPlayers.length > 0}
            onMemory={()=>setShowMemory(true)}
            onMiniGame={()=>setShowMiniGame(true)}
            onClues={()=>setShowClues(true)}
            onChat={()=>setChatOpen(true)}
            onBattle={()=>setShowArena(true)}
          />
        )}

        {/* Sol nav */}
        <nav style={S.nav}>
          <Btn icon="🏆" on={showLB}     onClick={()=>setShowLB(v=>!v)}          tip="Sıralama"/>
          <Btn icon="🎯" on={showQuests} onClick={()=>{setShowQuests(v=>!v);setPendingQuests(0);}} tip="Görevler" badge={pendingQuests>0?pendingQuests:null}/>
          <Btn icon="💬" on={chatOpen}   onClick={()=>setChatOpen(v=>!v)}         tip="Sohbet" dot={!!room}/>
          <Btn icon="🌐" on={showSocial} onClick={()=>setShowSocial(v=>!v)}       tip="Sosyal"/>
          <Btn icon="⚔️" on={showArena} onClick={()=>setShowArena(v=>!v)}       tip="Savaş Meydanı" badge={pendingArena?'!':null}/>
          {canAdmin && <Btn icon="⚙️" on={showAdmin} onClick={()=>setShowAdmin(v=>!v)} tip="Yönetim" gold/>}
          <div style={S.sep}/>
          <Btn icon="🚪" onClick={logout} tip="Çıkış"/>
        </nav>
      </div>

      {/* Sohbet paneli */}
      {chatOpen && (
        <aside style={S.chat}>
          <ChatPanel currentRoom={room} messages={messages} onSendMessage={sendChat}
            user={user} socket={socket}
            onFocus={()=>setChatFocused(true)} onBlur={()=>setChatFocused(false)}/>
        </aside>
      )}

      {/* Modaller */}
      {showLB      && <LeaderboardPanel currentUserId={user?.id} onClose={()=>setShowLB(false)}/>}
      {showQuests  && <QuestPanel quests={quests} myProgress={myProgress} onClaim={claimQuest} onClose={()=>setShowQuests(false)}/>}
      {showAdmin   && <AdminPanel currentUser={user} socket={socket} onClose={()=>setShowAdmin(false)}/>}
      {showSocial  && <SocialPanel socket={socket} currentUser={user} onClose={()=>setShowSocial(false)}/>}
      {showMemory  && curLoc && <MemoryWall locationId={curLoc.id} locationName={curLoc.name} socket={socket} currentUser={user} onClose={()=>setShowMemory(false)}/>}
      {showMiniGame&& curLoc && <MiniGame locationId={curLoc.id} locationName={curLoc.name} socket={socket} onClose={()=>setShowMiniGame(false)}/>}
      {npcDialog   && <NPCDialog npc={npcDialog} socket={socket} onClose={()=>setNpcDialog(null)}/>}
      {showClues   && <CluePanel hiddenSpots={hiddenSpots} totalSpots={15} onClose={()=>setShowClues(false)}/>}
      {showArena  && (
        <ArenaPortal
          socket={socket}
          currentUser={user}
          nearbyPlayers={others}
          onClose={()=>setShowArena(false)}
        />
      )}
    </div>
  );
}

/* ─── Yardımcı bileşenler ─────────────────────────── */
function Btn({ icon, on, onClick, tip, dot, badge, gold }) {
  return (
    <button onClick={onClick} title={tip}
      style={{...S.btn,...(on?S.btnOn:{}),...(gold?S.btnGold:{})}}>
      {icon}
      {dot   && <span style={S.dotBadge}/>}
      {badge && <span style={{...S.countBadge,...(badge==='!'?{background:'#dc2626'}:{})}}>{badge}</span>}
    </button>
  );
}

function LocationPanel({ loc, hasMiniGame, isRektorluk, hasBattle, onMemory, onMiniGame, onClues, onChat, onBattle }) {
  const c = loc.color;
  return (
    <div style={{...LP.panel, borderColor:`${c}30`}}>
      <div style={{...LP.header, borderColor:`${c}22`}}>
        <div style={{...LP.dot, background:c, boxShadow:`0 0 8px ${c}`}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:c,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {loc.icon} {loc.name}
          </div>
          <div style={{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1}}>
            {loc.isXpZone ? `⚡ +${loc.xp} XP bölgesi` : '💬 Sohbet alanı'}
          </div>
        </div>
      </div>
      <div>
        <LPBtn icon="💬" label="Sohbet"       sub="Bu alanda konuş"         color="#0e7490" onClick={onChat}/>
        <LPBtn icon="📖" label="Anı Defteri"  sub="Anı bırak, oku"          color="#a78bfa" onClick={onMemory}/>
        {hasMiniGame && <LPBtn icon="🎮" label="Mini Oyun"   sub="Trivia → XP kazan"  color="#ffd700" onClick={onMiniGame}/>}
        {isRektorluk && <LPBtn icon="🗝️" label="Kaşif Defteri" sub="Gizli nokta ipuçları" color="#bf5fff" onClick={onClues}/>}
        <LPBtn icon="⚔️" label="Arena" sub={hasBattle?"Rakip var — davet et":"Tüm oyuncuları gör"} color="#ff3860" onClick={onBattle}/>
      </div>
    </div>
  );
}

function LPBtn({ icon, label, sub, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',
        border:'none',borderBottom:'1px solid #f1f5f9',cursor:'pointer',
        textAlign:'left',width:'100%',transition:'background .15s',
        background:'transparent'}}>
      <div style={{fontSize:17,width:22,textAlign:'center',flexShrink:0,color,textShadow:`0 0 10px ${color}70`}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:700,fontFamily:'monospace',color}}>{label}</div>
        <div style={{fontSize:8,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1}}>{sub}</div>
      </div>
      <div style={{fontSize:14,color:`${color}50`,fontFamily:'monospace',fontWeight:700}}>›</div>
    </button>
  );
}

/* ─── Stiller ─────────────────────────────────────── */
const LP = {
  panel: {position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',width:198,zIndex:850,border:'1px solid',borderRadius:16,overflow:'hidden',backdropFilter:'blur(18px)',boxShadow:'0 24px 64px rgba(0,0,0,0.12)',background:'rgba(255,255,255,.96)'},
  header: {display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderBottom:'1px solid'},
  dot: {width:7,height:7,borderRadius:'50%',flexShrink:0},
};

const S = {
  root: {display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:'#f1f5f9'},
  mapWrap: {flex:1,position:'relative',overflow:'hidden'},
  chat: {width:300,flexShrink:0,borderLeft:'1px solid #e2e8f0',background:'#ffffff'},
  nav: {position:'absolute',top:'50%',left:10,transform:'translateY(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:7,zIndex:900},
  btn: {width:44,height:44,borderRadius:11,background:'#ffffff',border:'1px solid #e2e8f0',color:'#475569',cursor:'pointer',fontSize:19,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',transition:'all .18s',boxShadow:'0 2px 8px rgba(15,23,42,.08)'},
  btnOn: {background:'#fff1f2',borderColor:'#fca5a5',color:'#be123c',boxShadow:'0 2px 8px rgba(190,18,60,.1)'},
  btnGold: {borderColor:'#fde68a',color:'#b45309',background:'#fffbeb'},
  dotBadge: {position:'absolute',top:5,right:5,width:6,height:6,borderRadius:'50%',background:'#16a34a',boxShadow:'0 0 4px #16a34a88'},
  countBadge: {position:'absolute',top:-5,right:-5,minWidth:18,height:18,borderRadius:9,background:'#dc2626',color:'#fff',fontSize:9,fontWeight:900,fontFamily:'monospace',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',boxShadow:'0 2px 4px rgba(220,38,38,.4)'},
  sep: {width:'75%',height:1,background:'#f1f5f9',margin:'3px 0'},
  npcAlert: {position:'absolute',bottom:80,left:'50%',transform:'translateX(-50%)',background:'rgba(255,251,235,.96)',border:'1px solid rgba(217,119,6,.25)',borderRadius:12,padding:'9px 16px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',zIndex:800,backdropFilter:'blur(8px)',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'},
  npcAlertIcon: {fontSize:18},
  npcAlertText: {fontSize:11,color:'#475569',fontFamily:'monospace'},
  npcAlertClose: {background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'0 2px',marginLeft:4},
  battleAlert: {position:'absolute',bottom:140,left:'50%',transform:'translateX(-50%)',background:'rgba(254,242,242,.97)',border:'1px solid rgba(220,38,38,.25)',borderRadius:12,padding:'10px 16px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',zIndex:800,backdropFilter:'blur(8px)',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',animation:'cg-slide-in .3s ease'},
};

/* ── Harita üzeri hızlı arena daveti ──────────────── */
function QuickInvitePopup({ player, onInvite, onClose }) {
  const c = player.avatar?.color || '#00f5ff';
  const modes = [
    { key:'trivia',     icon:'🧠', label:'Bilgi Yarışması', xp:90  },
    { key:'football',   icon:'⚽', label:'Futbol Bilgi',   xp:80  },
    { key:'speed_math', icon:'⚡', label:'Hız Matematiği', xp:100 },
  ];
  return (
    <div style={{
      position:'absolute', bottom:90, left:'50%', transform:'translateX(-50%)',
      background:'rgba(255,255,255,.97)', border:`1px solid ${c}30`,
      borderRadius:16, padding:'14px 16px', zIndex:850,
      backdropFilter:'blur(16px)', boxShadow:`0 20px 60px rgba(0,0,0,0.12), 0 0 30px ${c}15`,
      minWidth:260, animation:'cg-slide-in .2s ease',
    }}>
      {/* Oyuncu başlığı */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <div style={{width:38,height:38,borderRadius:'50%',border:`2.5px solid ${c}`,
          background:`${c}12`,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:18,boxShadow:`0 0 12px ${c}40`}}>
          {player.avatar?.emoji||'🎓'}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:900,color:c,fontFamily:'monospace'}}>{player.username}</div>
          <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Lv.{player.level||1} · Arena Daveti</div>
        </div>
        <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',
          color:'rgba(100,116,139,0.6)',cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
      </div>

      {/* Mod butonları */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {modes.map(m => (
          <button key={m.key} onClick={()=>onInvite(m.key)}
            style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
              background:`${c}08`,border:`1px solid ${c}20`,borderRadius:9,
              cursor:'pointer',transition:'all .15s',width:'100%',textAlign:'left'}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'monospace',color:c,flex:1}}>{m.label}</span>
            <span style={{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>+{m.xp} XP</span>
            <span style={{color:`${c}50`,fontFamily:'monospace',fontWeight:700}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
