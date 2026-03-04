import React, { useState } from 'react';

const PERIOD_LABEL = { daily:'📅 Günlük', weekly:'📆 Haftalık', permanent:'♾️ Kalıcı' };
const PERIOD_COLOR = { daily:'#0e7490', weekly:'#7c3aed', permanent:'#b45309' };
const RARITY_COLOR = { common:'#64748b', rare:'#16a34a', epic:'#7c3aed', legendary:'#b45309' };
const RARITY_LABEL = { common:'Sıradan', rare:'Nadir', epic:'Epik', legendary:'Efsanevi' };

export default function QuestPanel({ quests=[], myProgress=[], onClaim, onClose }) {
  const [tab, setTab] = useState('daily');
  const getProgress = questId => myProgress.find(p=>p.questId===questId);
  const filtered = quests.filter(q=>q.period===tab);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>🎯 GÖREVLER</div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={S.tabs}>
          {['daily','weekly','permanent'].map(t=>(
            <button key={t}
              style={{...S.tab,...(tab===t?{...S.tabOn,borderColor:PERIOD_COLOR[t],color:PERIOD_COLOR[t]}:{})}}
              onClick={()=>setTab(t)}>
              {PERIOD_LABEL[t]}
            </button>
          ))}
        </div>

        <div style={S.list}>
          {filtered.length===0&&<div style={S.empty}>Bu kategoride görev yok</div>}
          {filtered.map(quest=>{
            const qp=getProgress(quest.questId);
            const progress=qp?.progress||0;
            const status=qp?.status||'active';
            const pct=Math.min(100,(progress/quest.target)*100);
            const isDone=status==='completed';
            const isClaimed=status==='claimed';
            const color=PERIOD_COLOR[quest.period];
            return (
              <div key={quest.questId} style={{...S.quest,...(isDone?{...S.questDone,borderColor:`${color}40`}:{}),...(isClaimed?S.questClaimed:{})}}>
                <div style={{...S.questIcon,background:`${color}12`,border:`1px solid ${color}22`}}>
                  {quest.icon}
                </div>
                <div style={S.questBody}>
                  <div style={S.questTitle}>
                    {quest.title}
                    {isClaimed&&<span style={S.claimedBadge}>✅ ALINDI</span>}
                    {quest.badgeReward&&(
                      <span style={{...S.rarityBadge,color:RARITY_COLOR[quest.badgeReward.rarity]}}>
                        {quest.badgeReward.icon} {RARITY_LABEL[quest.badgeReward.rarity]}
                      </span>
                    )}
                  </div>
                  <div style={S.questDesc}>{quest.description}</div>
                  <div style={S.progressWrap}>
                    <div style={S.progressTrack}>
                      <div style={{...S.progressFill,width:`${pct}%`,background:isDone?color:`${color}70`}}/>
                    </div>
                    <span style={{...S.progressText,color:isDone?color:'#94a3b8'}}>{progress}/{quest.target}</span>
                  </div>
                </div>
                <div style={S.questRight}>
                  <div style={{...S.xpReward,color}}>{quest.xpReward} XP</div>
                  {isDone&&(
                    <button onClick={()=>onClaim(quest.questId)}
                      style={{...S.claimBtn,borderColor:color,color:'#fff',background:color}}>
                      AL →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'},
  panel:{width:'min(520px,95vw)',maxHeight:'85vh',display:'flex',flexDirection:'column',background:'#ffffff',border:'1px solid rgba(148,163,184,.18)',borderRadius:20,overflow:'hidden',boxShadow:'0 24px 64px rgba(15,23,42,.14)'},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:'#f8fafc',borderBottom:'1px solid rgba(148,163,184,.14)',flexShrink:0},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#0f172a',fontFamily:'monospace'},
  closeBtn:{background:'#f1f5f9',border:'1px solid rgba(148,163,184,.2)',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:13,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center'},
  tabs:{display:'flex',gap:6,padding:'10px 14px',borderBottom:'1px solid #f1f5f9',flexShrink:0,background:'#fafafa'},
  tab:{flex:1,padding:'7px 0',borderRadius:9,border:'1px solid #e2e8f0',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:700,letterSpacing:'.04em',background:'transparent',color:'#94a3b8',transition:'all .18s'},
  tabOn:{background:'#ffffff',boxShadow:'0 1px 4px rgba(0,0,0,.06)'},
  list:{flex:1,overflowY:'auto',padding:'10px 12px 14px',display:'flex',flexDirection:'column',gap:8},
  empty:{textAlign:'center',color:'#94a3b8',padding:40,fontFamily:'monospace'},
  quest:{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,transition:'all .18s'},
  questDone:{background:'#f0fdf4',border:'1px solid'},
  questClaimed:{opacity:.5},
  questIcon:{width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0},
  questBody:{flex:1,minWidth:0},
  questTitle:{fontSize:13,fontWeight:700,color:'#0f172a',fontFamily:'monospace',marginBottom:3,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'},
  questDesc:{fontSize:10,color:'#64748b',marginBottom:7},
  progressWrap:{display:'flex',alignItems:'center',gap:8},
  progressTrack:{flex:1,height:4,background:'#e2e8f0',borderRadius:2,overflow:'hidden'},
  progressFill:{height:'100%',borderRadius:2,transition:'width .5s ease'},
  progressText:{fontSize:9,fontFamily:'monospace',whiteSpace:'nowrap'},
  questRight:{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0},
  xpReward:{fontSize:12,fontWeight:700,fontFamily:'monospace',whiteSpace:'nowrap'},
  claimBtn:{padding:'5px 10px',borderRadius:7,border:'1px solid',background:'transparent',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'monospace',transition:'all .2s'},
  claimedBadge:{fontSize:9,background:'#dcfce7',border:'1px solid #86efac',borderRadius:4,padding:'1px 6px',color:'#16a34a'},
  rarityBadge:{fontSize:9,fontFamily:'monospace',opacity:.85},
};
