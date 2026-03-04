import React, { useState } from 'react';
import FriendPanel from './FriendPanel';
import TeamPanel from './TeamPanel';

export default function SocialPanel({ socket, currentUser, onClose }) {
  const [view, setView] = useState('menu');
  if(view==='friends') return <FriendPanel socket={socket} currentUser={currentUser} onClose={onClose}/>;
  if(view==='team')    return <TeamPanel    socket={socket} currentUser={currentUser} onClose={onClose}/>;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <span style={S.title}>🌐 SOSYAL</span>
          <button onClick={onClose} style={S.close}>✕</button>
        </div>
        <div style={S.grid}>
          <Card icon="👥" title="Arkadaşlar" desc="Arkadaş ekle, konumlarını gör" color="#39d353" onClick={()=>setView('friends')}/>
          <Card icon="⚔️" title="Takımlar" desc="Takım kur, haftalık yarış" color="#ff6b35" onClick={()=>setView('team')}/>
        </div>
      </div>
    </div>
  );
}

function Card({icon,title,desc,color,onClick}){
  return (
    <button onClick={onClick} style={{...cardS,borderColor:`${color}25`,background:`radial-gradient(circle at 30% 30%, ${color}08, rgba(255,255,255,0.96))`}}>
      <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:700,color:'#1e293b',fontFamily:'monospace',marginBottom:5}}>{title}</div>
      <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',lineHeight:1.4}}>{desc}</div>
    </button>
  );
}
const cardS={flex:1,padding:'24px 16px',background:'#f1f5f9',border:'1px solid',borderRadius:14,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',transition:'all .2s',minWidth:130};
const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'},
  panel:{width:'min(360px,92vw)',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(241,245,249,0.8)',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header:{display:'flex',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid rgba(241,245,249,0.8)'},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#0e7490',fontFamily:'monospace',flex:1},
  close:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'},
  grid:{display:'flex',gap:10,padding:'16px'},
};
