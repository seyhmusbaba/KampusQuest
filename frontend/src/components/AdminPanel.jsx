import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const ROLE_COLOR  = { student:'#94a3b8', moderator:'#16a34a', admin:'#ffd700' };
const ROLE_LABEL  = { student:'🎓 Öğrenci', moderator:'🛡️ Moderatör', admin:'⚡ Admin' };

export default function AdminPanel({ currentUser, socket, onClose }) {
  const [tab, setTab]     = useState('users');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]     = useState('');

  const token = localStorage.getItem('campusgame_token');
  const headers = { Authorization:`Bearer ${token}` };

  const loadUsers = async (q='') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/game/admin/users?search=${q}&limit=30`, { headers });
      setUsers(res.data.users || []);
    } catch(e) { setMsg('❌ ' + (e.response?.data?.error||e.message)); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('admin:success', d => { setMsg('✅ ' + d.message); setTimeout(()=>setMsg(''),3000); });
    return () => socket.off('admin:success');
  }, [socket]);

  const setRole = (userId, role) => { socket?.emit('admin:set_role',{targetUserId:userId,role}); setTimeout(()=>loadUsers(search),500); };
  const giveXP  = (userId, name) => {
    const amt = prompt(`${name}'e kaç XP ver?`);
    const reason = prompt('Sebep?');
    if (amt) socket?.emit('admin:give_xp',{targetUserId:userId, amount:parseInt(amt), reason});
  };
  const warn  = (userId) => { const r=prompt('Uyarı sebebi?'); if(r) socket?.emit('mod:warn_user',{targetUserId:userId,reason:r}); };
  const mute  = (userId) => { const m=prompt('Kaç dakika sustur?'); if(m) socket?.emit('mod:mute_user',{targetUserId:userId,minutes:parseInt(m)}); };
  const ban   = (userId) => { const r=prompt('Ban sebebi?'); if(r) socket?.emit('admin:ban_user',{targetUserId:userId,reason:r}); setTimeout(()=>loadUsers(search),500); };
  const unban = async (userId) => {
    try { await axios.patch(`${API}/game/admin/users/${userId}/unban`,{},{headers}); loadUsers(search); }
    catch(e) { setMsg('❌ '+e.message); }
  };

  const canAdmin = currentUser?.role==='admin';
  const canMod   = currentUser?.role==='admin'||currentUser?.role==='moderator';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>

        <div style={S.header}>
          <div style={S.title}>⚡ YÖNETİM PANELİ</div>
          <div style={{...S.roleChip, color:ROLE_COLOR[currentUser?.role]}}>{ROLE_LABEL[currentUser?.role]}</div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {msg && <div style={S.msgBar}>{msg}</div>}

        <div style={S.tabs}>
          <Tab label="👥 Kullanıcılar" active={tab==='users'} onClick={()=>setTab('users')} />
        </div>

        {tab==='users' && (
          <div style={S.body}>
            <div style={S.searchRow}>
              <input value={search} onChange={e=>{setSearch(e.target.value);loadUsers(e.target.value);}}
                placeholder="İsim veya e-posta ara..." style={S.searchInput} />
              <button onClick={()=>loadUsers(search)} style={S.refreshBtn}>🔄</button>
            </div>

            <div style={S.userList}>
              {loading && <div style={S.loading}>⏳ Yükleniyor...</div>}
              {users.map(u => (
                <div key={u._id} style={{...S.userRow, ...(u.isBanned?S.bannedRow:{})}}>
                  <div style={{...S.userAv, borderColor:(ROLE_COLOR[u.role]||'#94a3b8')+'60', background:`radial-gradient(circle, ${(u.avatar?.color||'#94a3b8')}18, #ffffff)`}}>
                    {u.avatar?.emoji||'🎓'}
                  </div>
                  <div style={S.userInfo}>
                    <div style={S.userName}>
                      {u.username}
                      {u.isBanned && <span style={S.banBadge}>BANLI</span>}
                      <span style={{...S.rolePill, color:ROLE_COLOR[u.role]}}>{ROLE_LABEL[u.role]}</span>
                    </div>
                    <div style={S.userSub}>Lv.{u.level} · {(u.xp||0).toLocaleString()} XP · {u.faculty||'—'}</div>
                    {u.warnings?.length>0 && <div style={S.warnBadge}>⚠️ {u.warnings.length} uyarı</div>}
                  </div>
                  <div style={S.actions}>
                    {canMod && !u.isBanned && <>
                      <ABtn onClick={()=>warn(u._id)} color="#ffd700" title="Uyar">⚠️</ABtn>
                      <ABtn onClick={()=>mute(u._id)} color="#ff9f43" title="Sustur">🔇</ABtn>
                    </>}
                    {canAdmin && <>
                      <ABtn onClick={()=>giveXP(u._id, u.username)} color="#39d353" title="XP Ver">✨</ABtn>
                      {['student','moderator','admin'].filter(r=>r!==u.role).map(r => (
                        <ABtn key={r} onClick={()=>setRole(u._id,r)} color={ROLE_COLOR[r]} title={`${r} yap`}>
                          {r==='admin'?'⚡':r==='moderator'?'🛡️':'🎓'}
                        </ABtn>
                      ))}
                      {u.isBanned
                        ? <ABtn onClick={()=>unban(u._id)} color="#39d353" title="Ban Kaldır">✅</ABtn>
                        : <ABtn onClick={()=>ban(u._id)} color="#ff4444" title="Banla">🚫</ABtn>
                      }
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({label,active,onClick}){ return <button onClick={onClick} style={{...tabS.btn,...(active?tabS.on:{})}}>{label}</button>; }
function ABtn({onClick,color,title,children}){
  return <button onClick={onClick} title={title} style={{...aS.btn,borderColor:`${color}40`,color}}>{children}</button>;
}
const tabS={
  btn:{padding:'7px 14px',borderRadius:8,border:'1px solid rgba(241,245,249,0.8)',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:700,background:'transparent',color:'#64748b',transition:'all .2s'},
  on:{background:'#f1f5f9',color:'#fff',borderColor:'rgba(255,255,255,.2)'},
};
const aS={btn:{width:28,height:28,borderRadius:7,border:'1px solid',background:'#f1f5f9',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}};

const S = {
  overlay:{ position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)' },
  panel:{ width:'min(680px,96vw)',maxHeight:'90vh',display:'flex',flexDirection:'column',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(255,215,0,.2)',borderRadius:20,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)' },
  header:{ display:'flex',alignItems:'center',gap:10,padding:'16px 20px',borderBottom:'1px solid rgba(255,215,0,.1)',flexShrink:0 },
  title:{ fontSize:14,fontWeight:900,letterSpacing:'.1em',color:'#ffd700',fontFamily:'monospace',flex:1 },
  roleChip:{ fontSize:11,fontFamily:'monospace',fontWeight:700,padding:'3px 10px',background:'rgba(255,215,0,.08)',border:'1px solid rgba(255,215,0,.2)',borderRadius:6 },
  closeBtn:{ background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center' },
  msgBar:{ padding:'8px 20px',background:'rgba(57,211,83,.08)',borderBottom:'1px solid rgba(57,211,83,.2)',fontSize:12,color:'#16a34a',fontFamily:'monospace',flexShrink:0 },
  tabs:{ display:'flex',gap:6,padding:'10px 14px',borderBottom:'1px solid rgba(241,245,249,0.8)',flexShrink:0 },
  body:{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column',padding:'10px 12px',gap:10 },
  searchRow:{ display:'flex',gap:8 },
  searchInput:{ flex:1,padding:'8px 12px',background:'#f1f5f9',border:'1px solid rgba(255,215,0,.15)',borderRadius:9,color:'#1e293b',fontFamily:'monospace',fontSize:12,outline:'none' },
  refreshBtn:{ width:36,height:36,borderRadius:9,border:'1px solid rgba(255,215,0,.2)',background:'transparent',color:'#ffd700',cursor:'pointer',fontSize:16 },
  userList:{ flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:6 },
  loading:{ textAlign:'center',color:'rgba(100,116,139,0.6)',padding:30,fontFamily:'monospace' },
  userRow:{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:10 },
  bannedRow:{ background:'rgba(255,68,68,.05)',borderColor:'rgba(255,68,68,.15)' },
  userAv:{ width:36,height:36,borderRadius:'50%',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 },
  userInfo:{ flex:1,minWidth:0 },
  userName:{ fontSize:13,fontWeight:700,color:'#1e293b',fontFamily:'monospace',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' },
  userSub:{ fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1 },
  actions:{ display:'flex',gap:4,flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end',maxWidth:160 },
  rolePill:{ fontSize:9,fontFamily:'monospace',fontWeight:700 },
  banBadge:{ fontSize:9,background:'rgba(255,68,68,.2)',border:'1px solid rgba(255,68,68,.3)',borderRadius:4,padding:'1px 5px',color:'#ff4444' },
  warnBadge:{ fontSize:9,color:'#ffd700',fontFamily:'monospace',marginTop:2 },
};
