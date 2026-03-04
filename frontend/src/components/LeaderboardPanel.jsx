import React, { useEffect, useState } from 'react';
import { gameAPI } from '../utils/api';

const TITLES = ['Çaylak','Keşifçi','Gezgin','Bilge','Veteran','Uzman','Usta','Efsane','Mitos','Kampüs Tanrısı'];
const MEDALS = ['🥇','🥈','🥉'];
const PODIUM_COLORS = ['#f59e0b','#94a3b8','#b45309'];
const ROW_COLORS = ['#8b1a1a','#6d28d9','#047857','#b45309','#1d4ed8','#be185d','#0e7490','#7c3aed'];

export default function LeaderboardPanel({ currentUserId, onClose }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameAPI.leaderboard().then(r=>setData(r.data?.leaderboard||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>🏆 KAMPÜS SIRALAMASI</div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {!loading && data.length>=3 && (
          <div style={S.podium}>
            {[1,0,2].map(idx=>{
              const p=data[idx]; if(!p) return null;
              const color=PODIUM_COLORS[idx];
              const heights=[60,80,50];
              return (
                <div key={idx} style={{...S.podCell,alignSelf:idx===1?'flex-end':'flex-start'}}>
                  <div style={{...S.podAvatar,borderColor:color,background:`radial-gradient(circle at 38% 32%, ${color}20, #f8fafc)`}}>
                    <span style={{fontSize:22}}>{p.avatar?.emoji||'🎓'}</span>
                  </div>
                  <div style={{...S.podName,color}}>{p.username}</div>
                  <div style={S.podXP}>{(p.xp||0).toLocaleString()} XP</div>
                  <div style={{...S.podBase,height:heights[idx],background:`linear-gradient(180deg,${color}18,${color}06)`,borderTop:`2px solid ${color}`,borderColor:color}}>
                    <span style={{fontSize:24}}>{MEDALS[idx]}</span>
                    <span style={{...S.podRank,color}}>#{idx===1?1:idx===0?2:3}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={S.list}>
          {loading && <div style={S.loading}>⏳ Yükleniyor...</div>}
          {!loading && data.slice(3).map((p,i)=>{
            const rank=i+4;
            const isMine=p._id===currentUserId||p.id===currentUserId;
            const color=ROW_COLORS[i%ROW_COLORS.length];
            return (
              <div key={p._id||i} style={{...S.row,...(isMine?S.rowMine:{})}}>
                <span style={S.rankNum}>#{rank}</span>
                <div style={{...S.rowAv,borderColor:`${color}50`,background:`radial-gradient(circle at 38% 32%,${color}14,#f8fafc)`}}>
                  <span style={{fontSize:14}}>{p.avatar?.emoji||'🎓'}</span>
                </div>
                <div style={S.rowInfo}>
                  <div style={{...S.rowName,color:isMine?'#1d4ed8':'#0f172a'}}>
                    {p.username}
                    {isMine&&<span style={S.youBadge}>BEN</span>}
                    {p.isOnline&&<span style={S.onBadge}>●</span>}
                  </div>
                  <div style={S.rowSub}>{p.faculty||TITLES[(p.level||1)-1]||'Çaylak'}</div>
                </div>
                <div style={S.rowRight}>
                  <div style={{...S.rowXP,color}}>{(p.xp||0).toLocaleString()}</div>
                  <div style={S.rowLvl}>Lv.{p.level||1}</div>
                </div>
              </div>
            );
          })}
          {!loading&&data.length===0&&<div style={S.loading}>📭 Henüz kayıt yok</div>}
        </div>
      </div>
    </div>
  );
}

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',animation:'cg-slide-in .2s ease'},
  panel:{width:'min(460px,95vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',background:'#ffffff',border:'1px solid rgba(148,163,184,.18)',borderRadius:20,overflow:'hidden',boxShadow:'0 24px 64px rgba(15,23,42,.14)'},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:'#f8fafc',borderBottom:'1px solid rgba(148,163,184,.14)',flexShrink:0},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#0f172a',fontFamily:'monospace'},
  closeBtn:{background:'#f1f5f9',border:'1px solid rgba(148,163,184,.2)',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:13,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'},
  podium:{display:'flex',justifyContent:'center',alignItems:'flex-end',gap:12,padding:'20px 16px 0',flexShrink:0,background:'#fafafa'},
  podCell:{display:'flex',flexDirection:'column',alignItems:'center',gap:4,width:100},
  podAvatar:{width:50,height:50,borderRadius:'50%',border:'2.5px solid',display:'flex',alignItems:'center',justifyContent:'center'},
  podName:{fontSize:11,fontWeight:700,fontFamily:'monospace',textAlign:'center',color:'#0f172a',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  podXP:{fontSize:9,color:'#94a3b8',fontFamily:'monospace'},
  podBase:{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,borderRadius:'6px 6px 0 0',border:'1px solid',borderBottom:'none'},
  podRank:{fontSize:11,fontWeight:700,fontFamily:'monospace'},
  list:{flex:1,overflowY:'auto',padding:'10px 12px 14px',display:'flex',flexDirection:'column',gap:4},
  loading:{textAlign:'center',color:'#94a3b8',padding:40,fontFamily:'monospace',fontSize:13},
  row:{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,background:'#f8fafc',border:'1px solid #f1f5f9',transition:'background .15s'},
  rowMine:{background:'#eff6ff',border:'1px solid #bfdbfe'},
  rankNum:{width:28,fontSize:11,fontWeight:700,color:'#94a3b8',fontFamily:'monospace',textAlign:'center',flexShrink:0},
  rowAv:{width:32,height:32,borderRadius:'50%',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  rowInfo:{flex:1,minWidth:0},
  rowName:{fontSize:12,fontWeight:700,fontFamily:'monospace',display:'flex',alignItems:'center',gap:5},
  rowSub:{fontSize:9,color:'#94a3b8',fontFamily:'monospace',marginTop:1},
  rowRight:{textAlign:'right',flexShrink:0},
  rowXP:{fontSize:12,fontWeight:700,fontFamily:'monospace'},
  rowLvl:{fontSize:9,color:'#94a3b8',fontFamily:'monospace'},
  youBadge:{background:'#dbeafe',border:'1px solid #93c5fd',borderRadius:4,padding:'1px 5px',fontSize:8,color:'#1d4ed8',letterSpacing:'.06em'},
  onBadge:{color:'#16a34a',fontSize:8},
};
