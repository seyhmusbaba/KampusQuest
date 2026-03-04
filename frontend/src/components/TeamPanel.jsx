import React, { useState, useEffect } from 'react';

const TEAM_COLORS=['#0e7490','#ff6b35','#16a34a','#ffd700','#7c3aed','#dc2626','#059669','#ff9f43'];
const TEAM_EMOJIS=['⚡','🔥','🌊','🌪️','⚔️','🛡️','🎯','👑','🚀','🦅','🐉','💎'];

export default function TeamPanel({ socket, currentUser, onClose }) {
  const [teams, setTeams]   = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]     = useState({name:'',tag:'',color:'#0e7490',emoji:'⚡'});
  const [msg, setMsg]       = useState('');

  useEffect(()=>{ socket?.emit('team:list'); },[socket]);

  useEffect(()=>{
    if(!socket) return;
    const onList  = d => setTeams(d.teams||[]);
    const onCreate= d => { setMyTeam(d.team); setMsg('✅ Takım oluşturuldu!'); setCreating(false); setTimeout(()=>setMsg(''),3000); };
    const onJoin  = d => { setMyTeam(d.team); setMsg('✅ Takıma katıldın!'); setTimeout(()=>setMsg(''),3000); };
    const onLeft  = () => { setMyTeam(null); setMsg('👋 Takımdan ayrıldın'); socket.emit('team:list'); setTimeout(()=>setMsg(''),3000); };
    const onMemberJoined = () => { socket.emit('team:list'); };
    socket.on('team:list_result', onList); socket.on('team:created', onCreate); socket.on('team:joined', onJoin); socket.on('team:left', onLeft); socket.on('team:member_joined', onMemberJoined);
    return()=>{ socket.off('team:list_result',onList); socket.off('team:created',onCreate); socket.off('team:joined',onJoin); socket.off('team:left',onLeft); socket.off('team:member_joined',onMemberJoined); };
  },[socket]);

  const create = () => {
    if(!form.name.trim()||!form.tag.trim()) return;
    socket?.emit('team:create',{name:form.name.trim(),tag:form.tag.trim().toUpperCase().slice(0,5),color:form.color,emoji:form.emoji});
  };
  const join  = (teamId) => socket?.emit('team:join',{teamId});
  const leave = () => { if(window.confirm('Takımdan ayrılmak istiyor musun?')) socket?.emit('team:leave'); };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <span style={S.title}>⚔️ TAKIMLAR</span>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
        {msg && <div style={S.msgBar}>{msg}</div>}

        {/* Mevcut takım */}
        {myTeam && (
          <div style={{...S.myTeamCard,borderColor:`${myTeam.color}40`}}>
            <div style={{fontSize:28}}>{myTeam.emoji}</div>
            <div style={S.myTeamInfo}>
              <div style={{...S.myTeamName,color:myTeam.color}}>[{myTeam.tag}] {myTeam.name}</div>
              <div style={S.myTeamSub}>{myTeam.members?.length||0}/{myTeam.maxMembers||5} üye · 📊 {(myTeam.weeklyXP||0).toLocaleString()} haftalık XP</div>
            </div>
            <button onClick={leave} style={S.leaveBtn}>Ayrıl</button>
          </div>
        )}

        {/* Takım oluştur */}
        {!myTeam && (
          <div style={S.createSection}>
            <button onClick={()=>setCreating(v=>!v)} style={{...S.createToggle,borderColor:creating?'#ff6b35':'rgba(255,107,53,.3)',color:creating?'#ff6b35':'rgba(255,107,53,.5)'}}>
              {creating?'✕ Vazgeç':'+ Yeni Takım Kur'}
            </button>
            {creating && (
              <div style={S.createForm}>
                <div style={S.row}>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Takım adı" style={{...S.input,flex:2}}/>
                  <input value={form.tag} onChange={e=>setForm(p=>({...p,tag:e.target.value.toUpperCase()}))} placeholder="TAG" maxLength={5} style={{...S.input,flex:1,textTransform:'uppercase'}}/>
                </div>
                <div style={S.row}>
                  {TEAM_COLORS.map(c=>(
                    <div key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:22,height:22,borderRadius:'50%',background:c,cursor:'pointer',border:form.color===c?`2px solid #fff`:'2px solid transparent'}}/>
                  ))}
                </div>
                <div style={{...S.row,flexWrap:'wrap',gap:6}}>
                  {TEAM_EMOJIS.map(e=>(
                    <div key={e} onClick={()=>setForm(p=>({...p,emoji:e}))} style={{width:28,height:28,borderRadius:7,background:form.emoji===e?'rgba(255,255,255,.15)':'rgba(241,245,249,0.8)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                      {e}
                    </div>
                  ))}
                </div>
                <div style={S.previewRow}>
                  <span style={{fontSize:20}}>{form.emoji}</span>
                  <span style={{...S.previewTag,color:form.color,borderColor:`${form.color}40`}}>[{form.tag||'TAG'}]</span>
                  <span style={{fontSize:13,color:'#1e293b',fontFamily:'monospace'}}>{form.name||'Takım Adı'}</span>
                </div>
                <button onClick={create} style={{...S.createBtn,background:`${form.color}18`,borderColor:`${form.color}50`,color:form.color}}>
                  ⚔️ Takımı Kur
                </button>
              </div>
            )}
          </div>
        )}

        {/* Takım listesi */}
        <div style={S.listHeader}>📊 Haftalık Sıralama</div>
        <div style={S.list}>
          {teams.length===0 && <div style={S.empty}>Henüz takım yok</div>}
          {teams.map((team,i)=>(
            <div key={team._id} style={{...S.teamRow,borderColor:`${team.color}25`}}>
              <div style={S.rank}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
              <div style={{fontSize:20}}>{team.emoji}</div>
              <div style={S.teamInfo}>
                <div style={{...S.teamName,color:team.color}}>[{team.tag}] {team.name}</div>
                <div style={S.teamSub}>{team.members?.length||0}/{team.maxMembers||5} üye · 🏆 {(team.totalXP||0).toLocaleString()} XP</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{...S.weeklyXP,color:team.color}}>+{(team.weeklyXP||0).toLocaleString()}</div>
                <div style={S.xpLabel}>bu hafta</div>
                {!myTeam && team.members?.length<(team.maxMembers||5) && (
                  <button onClick={()=>join(team._id)} style={{...S.joinBtn,borderColor:`${team.color}50`,color:team.color}}>Katıl</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'},
  panel:{width:'min(420px,95vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(255,107,53,.15)',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header:{display:'flex',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid rgba(255,107,53,.1)',flexShrink:0},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#ff6b35',fontFamily:'monospace',flex:1},
  closeBtn:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'},
  msgBar:{padding:'7px 16px',background:'rgba(57,211,83,.08)',borderBottom:'1px solid rgba(57,211,83,.2)',fontSize:11,color:'#16a34a',fontFamily:'monospace',flexShrink:0},
  myTeamCard:{margin:'10px',padding:'12px',background:'#f1f5f9',border:'1px solid',borderRadius:12,display:'flex',alignItems:'center',gap:10,flexShrink:0},
  myTeamInfo:{flex:1},
  myTeamName:{fontSize:14,fontWeight:700,fontFamily:'monospace'},
  myTeamSub:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:2},
  leaveBtn:{padding:'5px 10px',background:'transparent',border:'1px solid rgba(255,68,68,.3)',borderRadius:7,color:'rgba(255,68,68,.6)',cursor:'pointer',fontFamily:'monospace',fontSize:9,fontWeight:700},
  createSection:{padding:'8px 12px',flexShrink:0,borderBottom:'1px solid rgba(241,245,249,0.8)'},
  createToggle:{width:'100%',padding:'8px',background:'transparent',border:'1px solid',borderRadius:9,cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:700,transition:'all .2s'},
  createForm:{display:'flex',flexDirection:'column',gap:8,marginTop:10},
  row:{display:'flex',alignItems:'center',gap:6},
  input:{padding:'7px 10px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:8,color:'#1e293b',fontFamily:'monospace',fontSize:12,outline:'none'},
  previewRow:{display:'flex',alignItems:'center',gap:8,padding:'8px',background:'#f1f5f9',borderRadius:8},
  previewTag:{fontSize:12,fontWeight:700,fontFamily:'monospace',border:'1px solid',borderRadius:4,padding:'1px 6px'},
  createBtn:{padding:'9px',border:'1px solid',borderRadius:9,cursor:'pointer',fontFamily:'monospace',fontSize:12,fontWeight:700,transition:'all .2s'},
  listHeader:{padding:'8px 14px 4px',fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'rgba(100,116,139,0.6)',fontFamily:'monospace',flexShrink:0},
  list:{flex:1,overflowY:'auto',padding:'4px 10px 10px',display:'flex',flexDirection:'column',gap:6},
  empty:{textAlign:'center',color:'rgba(100,116,139,0.6)',padding:30,fontFamily:'monospace'},
  teamRow:{display:'flex',alignItems:'center',gap:10,padding:'10px',background:'#f1f5f9',border:'1px solid',borderRadius:10},
  rank:{fontSize:14,width:28,textAlign:'center',flexShrink:0,fontFamily:'monospace',color:'rgba(100,116,139,0.6)'},
  teamInfo:{flex:1,minWidth:0},
  teamName:{fontSize:12,fontWeight:700,fontFamily:'monospace'},
  teamSub:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1},
  weeklyXP:{fontSize:13,fontWeight:700,fontFamily:'monospace'},
  xpLabel:{fontSize:8,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'},
  joinBtn:{marginTop:4,padding:'3px 8px',background:'transparent',border:'1px solid',borderRadius:6,cursor:'pointer',fontFamily:'monospace',fontSize:9,fontWeight:700},
};
