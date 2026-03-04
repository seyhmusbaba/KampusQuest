import React, { useState } from 'react';

export default function NPCDialog({ npc, socket, onClose }) {
  const [phase, setPhase]   = useState('greet'); // greet, quests, accepted
  const [accepted, setAccepted] = useState(null);

  if(!npc) return null;

  const acceptQuest = (i) => {
    socket?.emit('npc:accept_quest',{npcId:npc.id,questIndex:i});
    setAccepted(npc.quests[i]);
    setPhase('accepted');
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        {/* NPC üst kısım */}
        <div style={S.npcTop}>
          <div style={S.npcAvatar}>{npc.icon}</div>
          <div style={S.npcInfo}>
            <div style={S.npcName}>{npc.name}</div>
            <div style={S.npcRole}>Kampüs Sakinleri</div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Diyalog balonu */}
        <div style={S.bubble}>
          <div style={S.bubbleTail}/>
          {phase==='greet' && <p style={S.bubbleText}>"{npc.greeting}"</p>}
          {phase==='quests' && <p style={S.bubbleText}>Senden bir ricam var. Kabul eder misin?</p>}
          {phase==='accepted' && <p style={S.bubbleText}>Teşekkürler! Başarılar dilerim. 🎯</p>}
        </div>

        {/* Seçenekler */}
        <div style={S.options}>
          {phase==='greet' && <>
            {npc.quests?.length>0 && (
              <Opt icon="📋" text="Görev var mı?" onClick={()=>setPhase('quests')}/>
            )}
            <Opt icon="👋" text="Görüşürüz!" onClick={onClose} dim/>
          </>}

          {phase==='quests' && <>
            {npc.quests?.map((q,i)=>(
              <div key={i} style={S.questOpt} onClick={()=>acceptQuest(i)}>
                <div style={S.questIcon}>📋</div>
                <div style={S.questBody}>
                  <div style={S.questText}>{q.text}</div>
                  <div style={S.questXp}>+{q.xp} XP</div>
                </div>
                <div style={S.questArrow}>→</div>
              </div>
            ))}
            <Opt icon="←" text="Geri" onClick={()=>setPhase('greet')} dim/>
          </>}

          {phase==='accepted' && <>
            <div style={S.acceptedCard}>
              <div style={S.acceptedIcon}>🎯</div>
              <div>
                <div style={S.acceptedTitle}>{accepted?.text}</div>
                <div style={S.acceptedXp}>Ödül: +{accepted?.xp} XP</div>
              </div>
            </div>
            <Opt icon="✓" text="Tamam, gidiyorum!" onClick={onClose}/>
          </>}
        </div>
      </div>
    </div>
  );
}

function Opt({icon,text,onClick,dim}){
  return (
    <button onClick={onClick} style={{...optS.btn,...(dim?{opacity:.5}:{})}}>
      <span style={optS.icon}>{icon}</span>{text}
    </button>
  );
}
const optS={
  btn:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'rgba(255,215,0,.05)',border:'1px solid rgba(255,215,0,.15)',borderRadius:9,cursor:'pointer',color:'rgba(51,65,85,0.8)',fontFamily:'monospace',fontSize:12,textAlign:'left',width:'100%',transition:'all .2s'},
  icon:{fontSize:14,width:20,textAlign:'center',flexShrink:0},
};

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9998,display:'flex',alignItems:'flex-end',justifyContent:'center',backdropFilter:'blur(4px)',paddingBottom:20},
  panel:{width:'min(420px,95vw)',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(255,215,0,.2)',borderRadius:18,overflow:'hidden',boxShadow:'0 -20px 60px rgba(0,0,0,0.12)'},
  npcTop:{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:'1px solid rgba(255,215,0,.1)'},
  npcAvatar:{width:46,height:46,borderRadius:'50%',background:'rgba(255,215,0,.12)',border:'2px solid rgba(255,215,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0},
  npcInfo:{flex:1},
  npcName:{fontSize:14,fontWeight:700,color:'#ffd700',fontFamily:'monospace'},
  npcRole:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1},
  closeBtn:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'},
  bubble:{margin:'12px 16px 4px',background:'rgba(255,215,0,.06)',border:'1px solid rgba(255,215,0,.15)',borderRadius:'4px 14px 14px 14px',padding:'12px 14px',position:'relative'},
  bubbleTail:{position:'absolute',top:-6,left:20,width:10,height:10,background:'rgba(255,215,0,.06)',border:'1px solid rgba(255,215,0,.15)',clipPath:'polygon(0 100%,100% 100%,100% 0)'},
  bubbleText:{margin:0,fontSize:12,color:'rgba(51,65,85,0.8)',fontFamily:'monospace',lineHeight:1.55,fontStyle:'italic'},
  options:{display:'flex',flexDirection:'column',gap:6,padding:'10px 14px 14px'},
  questOpt:{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(255,215,0,.06)',border:'1px solid rgba(255,215,0,.18)',borderRadius:10,cursor:'pointer',transition:'all .2s'},
  questIcon:{fontSize:16,flexShrink:0},
  questBody:{flex:1},
  questText:{fontSize:12,color:'#1e293b',fontFamily:'monospace'},
  questXp:{fontSize:10,color:'#ffd700',fontFamily:'monospace',marginTop:2},
  questArrow:{fontSize:14,color:'rgba(255,215,0,.5)'},
  acceptedCard:{display:'flex',alignItems:'center',gap:10,padding:'12px',background:'rgba(57,211,83,.06)',border:'1px solid rgba(57,211,83,.2)',borderRadius:10},
  acceptedIcon:{fontSize:22},
  acceptedTitle:{fontSize:12,fontWeight:700,color:'#1e293b',fontFamily:'monospace'},
  acceptedXp:{fontSize:10,color:'#16a34a',fontFamily:'monospace',marginTop:2},
};
