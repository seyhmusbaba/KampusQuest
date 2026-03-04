import React from 'react';

const XP_STEPS = [0,100,250,500,900,1500,2300,3300,4500,6000];

function xpPct(lvl,xp) {
  const cur  = XP_STEPS[Math.max(0,(lvl||1)-1)] ?? 0;
  const next = XP_STEPS[lvl||1];
  return next ? Math.min(100, ((xp-cur)/(next-cur))*100) : 100;
}

// Light tema renkleri
const NOTIF = {
  xp:    { border:'#16a34a', glow:'rgba(22,163,74,.18)',  bg:'rgba(240,253,244,.97)' },
  level: { border:'#d97706', glow:'rgba(217,119,6,.18)',  bg:'rgba(255,251,235,.97)' },
  info:  { border:'#2563eb', glow:'rgba(37,99,235,.12)',  bg:'rgba(239,246,255,.97)' },
  error: { border:'#dc2626', glow:'rgba(220,38,38,.15)',  bg:'rgba(254,242,242,.97)' },
  quest: { border:'#7c3aed', glow:'rgba(124,58,237,.15)', bg:'rgba(245,243,255,.97)' },
};

export default function GameHUD({ user, onlineCount, connected, currentLocation, notifications, hiddenFoundCount=0, totalHidden=15 }) {
  const color  = user?.avatar?.color || '#8b1a1a';
  const emoji  = user?.avatar?.emoji || '🎓';
  const pct    = xpPct(user?.level, user?.xp ?? 0);
  const locClr = currentLocation?.color || '#8b1a1a';

  return <>
    {/* Oyuncu Kartı */}
    <div style={{...S.card, borderColor:`${color}30`}}>
      <div style={{...S.avRing, borderColor:color, boxShadow:`0 0 0 3px ${color}15`}}>
        <div style={{...S.avInner, background:`radial-gradient(circle at 38% 32%, ${color}18, ${color}06)`}}>
          <span style={S.avEmoji}>{emoji}</span>
        </div>
      </div>
      <div style={S.info}>
        <div style={S.username}>{user?.username ?? '—'}</div>
        <div style={S.subtitle}>{user?.title ?? 'Çaylak'} · Seviye {user?.level ?? 1}</div>
        <div style={S.track}>
          <div style={{...S.fill, width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}aa)`}} />
        </div>
        <div style={{...S.xpNum, color}}>{(user?.xp??0).toLocaleString()} <span style={{opacity:.4}}>XP</span></div>
      </div>
    </div>

    {/* Gizli nokta sayacı */}
    {hiddenFoundCount > 0 && (
      <div style={{...S.online, top:12, right:160, borderColor:'rgba(124,58,237,.2)'}}>
        <span style={{fontSize:14}}>🗝️</span>
        <span style={{fontSize:11,fontFamily:'monospace',color:'#7c3aed',fontWeight:700}}>
          {hiddenFoundCount}<span style={{color:'#94a3b8',fontWeight:400}}>/{totalHidden}</span>
        </span>
      </div>
    )}

    {/* Online sayacı */}
    <div style={S.online}>
      <div style={{...S.dot, background:connected?'#16a34a':'#dc2626',
        boxShadow:`0 0 6px ${connected?'#16a34a':'#dc2626'}`,animation:'cg-blink 2.5s ease-in-out infinite'}} />
      <span style={{color:connected?'#15803d':'#dc2626',fontSize:13,fontWeight:700}}>{onlineCount}</span>
      <span style={{fontSize:10,color:'#94a3b8'}}>online</span>
    </div>

    {/* Lokasyon banner */}
    {currentLocation && (
      <div style={{...S.locBanner, borderColor:`${locClr}40`, boxShadow:`0 4px 24px ${locClr}15`}}>
        <span style={S.locIcon}>{currentLocation.icon}</span>
        <div style={S.locText}>
          <div style={{...S.locName, color:locClr}}>{currentLocation.name}</div>
          <div style={S.locSub}>{currentLocation.description || 'Bu alana giriş yaptınız'}</div>
        </div>
        <div style={{...S.xpPill, borderColor:`${locClr}40`, color:locClr, background:`${locClr}0e`}}>
          +{currentLocation.xp || currentLocation.xpReward} XP
        </div>
      </div>
    )}

    {/* Bildirimler */}
    <div style={S.notifStack}>
      {(notifications||[]).map(n => {
        const th = NOTIF[n.type] || NOTIF.info;
        return (
          <div key={n.id} style={{...S.notif, borderColor:th.border, background:th.bg, boxShadow:`0 2px 16px ${th.glow}`}}>
            <span style={{fontSize:15}}>{n.icon}</span>
            <span style={{fontSize:12,color:'#1e293b',fontFamily:'monospace'}}>{n.text}</span>
          </div>
        );
      })}
    </div>

    {/* Kontrol ipuçları */}
    <div style={S.controls}>
      <Hint k="WASD" v="Hareket" />
      <Sep/>
      <Hint k="Scroll" v="Zoom" />
      <Sep/>
      <Hint k="Tıkla" v="Git" />
      <Sep/>
      <Hint k="Zone'a gir" v="XP kazan" />
    </div>
  </>;
}

function Hint({k,v}) {
  return <span style={{display:'flex',gap:4,alignItems:'center'}}>
    <span style={{background:'rgba(30,41,59,.1)',borderRadius:4,padding:'1px 6px',fontSize:9,fontWeight:700,letterSpacing:'.04em',color:'#1e293b'}}>{k}</span>
    <span style={{opacity:.5,fontSize:9,color:'#475569'}}>{v}</span>
  </span>;
}
function Sep() { return <span style={{opacity:.2,fontSize:10,color:'#475569'}}>·</span>; }

const S = {
  card:{
    position:'absolute',top:12,left:64,zIndex:900,
    display:'flex',alignItems:'center',gap:13,
    background:'rgba(255,255,255,0.95)',border:'1px solid',
    borderRadius:16,padding:'11px 18px',minWidth:240,
    backdropFilter:'blur(12px)',boxShadow:'0 4px 20px rgba(0,0,0,.1)',
  },
  avRing:{width:50,height:50,borderRadius:'50%',border:'2.5px solid',
    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  avInner:{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'},
  avEmoji:{fontSize:24},
  info:{flex:1,minWidth:0},
  username:{fontSize:14,fontWeight:700,color:'#1e293b',fontFamily:'monospace',letterSpacing:'.02em'},
  subtitle:{fontSize:10,color:'#64748b',marginBottom:7,letterSpacing:'.03em'},
  track:{height:3,background:'rgba(0,0,0,.08)',borderRadius:2,overflow:'hidden',marginBottom:3},
  fill:{height:'100%',borderRadius:2,transition:'width .7s ease'},
  xpNum:{fontSize:9,fontFamily:'monospace',fontWeight:700},

  online:{
    position:'absolute',top:12,right:12,zIndex:900,
    display:'flex',alignItems:'center',gap:6,
    background:'rgba(255,255,255,0.95)',border:'1px solid rgba(0,0,0,.1)',
    borderRadius:10,padding:'7px 14px',backdropFilter:'blur(8px)',
    fontFamily:'monospace',boxShadow:'0 2px 12px rgba(0,0,0,.08)',
  },
  dot:{width:8,height:8,borderRadius:'50%'},

  locBanner:{
    position:'absolute',bottom:46,left:'50%',transform:'translateX(-50%)',
    display:'flex',alignItems:'center',gap:14,
    background:'rgba(255,255,255,0.97)',border:'1px solid',
    borderRadius:16,padding:'13px 22px',zIndex:900,
    backdropFilter:'blur(14px)',minWidth:300,maxWidth:460,
    boxShadow:'0 4px 24px rgba(0,0,0,.12)',
    animation:'cg-slide-in .3s ease',
  },
  locIcon:{fontSize:32,flexShrink:0},
  locText:{flex:1,minWidth:0},
  locName:{fontSize:14,fontWeight:700,fontFamily:'monospace',letterSpacing:'.03em'},
  locSub:{fontSize:11,color:'#64748b',marginTop:2},
  xpPill:{border:'1px solid',borderRadius:9,padding:'5px 13px',
    fontSize:12,fontWeight:700,fontFamily:'monospace',whiteSpace:'nowrap',flexShrink:0},

  notifStack:{
    position:'absolute',top:78,right:12,zIndex:900,
    display:'flex',flexDirection:'column',gap:6,width:260,
  },
  notif:{
    display:'flex',alignItems:'center',gap:9,
    border:'1px solid',borderRadius:10,padding:'8px 12px',
    animation:'cg-slide-in .25s ease',backdropFilter:'blur(10px)',
  },

  controls:{
    position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',
    display:'flex',gap:10,alignItems:'center',
    background:'rgba(255,255,255,.90)',border:'1px solid rgba(0,0,0,.08)',
    borderRadius:8,padding:'5px 16px',color:'#475569',
    fontFamily:'monospace',zIndex:900,whiteSpace:'nowrap',
    boxShadow:'0 2px 10px rgba(0,0,0,.08)',
  },
};
