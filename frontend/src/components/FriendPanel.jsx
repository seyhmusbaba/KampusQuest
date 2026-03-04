import React, { useState, useEffect } from 'react';

export default function FriendPanel({ socket, currentUser, onClose }) {
  const [tab, setTab]     = useState('friends');
  const [friends, setFriends]   = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg]     = useState('');

  useEffect(()=>{ socket?.emit('friend:get_list'); },[socket]);

  useEffect(()=>{
    if(!socket) return;
    const onList = d => { setFriends(d.friends||[]); setRequests(d.requests||[]); };
    const onSent = d => { setMsg(`✅ İstek gönderildi: ${d.to}`); setSearch(''); setTimeout(()=>setMsg(''),3000); };
    const onIncoming = d => { setRequests(p=>[...p,d.from]); setMsg(`👥 Arkadaşlık isteği: ${d.from.username}`); };
    const onAccepted = d => { setMsg(`🎉 Arkadaş olundu!`); socket.emit('friend:get_list'); setTimeout(()=>setMsg(''),3000); };
    socket.on('friend:list', onList);
    socket.on('friend:request_sent', onSent);
    socket.on('friend:incoming_request', onIncoming);
    socket.on('friend:accepted', onAccepted);
    return()=>{ socket.off('friend:list',onList); socket.off('friend:request_sent',onSent); socket.off('friend:incoming_request',onIncoming); socket.off('friend:accepted',onAccepted); };
  },[socket]);

  const sendRequest = () => { if(!search.trim()) return; socket?.emit('friend:request',{targetUsername:search.trim()}); };
  const respond = (fromUserId, accept) => { socket?.emit('friend:respond',{fromUserId,accept}); };

  const ROOM_NAMES = { chat_library:'📚 Kütüphane', chat_cafeteria:'🍽️ Yemekhane', chat_ziraat:'🌾 Ziraat', chat_central:'🏛️ Rektörlük', chat_student_affairs:'📋 Öğrenci İşleri', chat_egitim:'🎓 Eğitim', chat_fen_edebiyat:'🔬 Fen-Edebiyat', chat_veteriner:'🐾 Veteriner', chat_tip:'🏥 Tıp', chat_dis:'🦷 Diş Hekimliği', chat_saglik:'⚕️ Sağlık YO', chat_kyk:'🏠 KYK Yurdu', chat_spor:'⚽ Spor', chat_sanatlar:'🎨 Güzel Sanatlar', chat_iibf:'📊 İİBF', chat_fen_ens:'🧪 Fen Ens.' };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <span style={S.title}>👥 ARKADAŞLAR</span>
          {requests.length>0 && <span style={S.badge}>{requests.length}</span>}
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
        {msg && <div style={S.msgBar}>{msg}</div>}
        <div style={S.tabs}>
          {[['friends',`Arkadaşlar (${friends.length})`],['requests',`İstekler (${requests.length})`],['add','Ekle']].map(([k,l])=>(
            <button key={k} style={{...S.tab,...(tab===k?S.tabOn:{})}} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={S.body}>
          {tab==='add' && (
            <div style={S.addSection}>
              <p style={S.hint}>Kullanıcı adını girerek arkadaş isteği gönder</p>
              <div style={S.addRow}>
                <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendRequest()}
                  placeholder="Kullanıcı adı..." style={S.input}/>
                <button onClick={sendRequest} style={S.addBtn}>Gönder</button>
              </div>
            </div>
          )}

          {tab==='requests' && (
            <div style={S.list}>
              {requests.length===0 && <div style={S.empty}>Bekleyen istek yok</div>}
              {requests.map((r,i)=>(
                <div key={r.userId||i} style={S.reqRow}>
                  <div style={{...S.av,borderColor:(r.avatar?.color||'#94a3b8')+'60'}}>{r.avatar?.emoji||'👤'}</div>
                  <div style={S.reqName}>{r.username}</div>
                  <button onClick={()=>respond(r.userId||r.from,true)} style={{...S.btn,borderColor:'#16a34a',color:'#16a34a'}}>✓ Kabul</button>
                  <button onClick={()=>respond(r.userId||r.from,false)} style={{...S.btn,borderColor:'#ff4444',color:'#ff4444'}}>✕ Reddet</button>
                </div>
              ))}
            </div>
          )}

          {tab==='friends' && (
            <div style={S.list}>
              {friends.length===0 && <div style={S.empty}>Henüz arkadaşın yok 😢<br/>Birini ekle!</div>}
              {friends.map(f=>{
                const isOnline=f.isOnline;
                const room=f.currentRoom?ROOM_NAMES[f.currentRoom]||f.currentRoom:'Kampüste değil';
                const c=f.avatar?.color||'#94a3b8';
                return (
                  <div key={f._id||f.id} style={S.friendRow}>
                    <div style={{...S.av,borderColor:`${c}60`,boxShadow:isOnline?`0 0 8px ${c}40`:'none'}}>
                      {f.avatar?.emoji||'👤'}
                      <div style={{...S.onlineDot,background:isOnline?'#16a34a':'#666'}}/>
                    </div>
                    <div style={S.fInfo}>
                      <div style={{...S.fName,color:isOnline?'#1e293b':'rgba(255,255,255,.4)'}}>{f.username}</div>
                      <div style={S.fSub}>{isOnline?`📍 ${room}`:'Çevrimiçi değil'} · Lv.{f.level}</div>
                    </div>
                    {isOnline && <div style={{...S.onlineBadge,background:`${c}20`,borderColor:`${c}40`,color:c}}>● Çevrimiçi</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'},
  panel:{width:'min(400px,94vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(57,211,83,.2)',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header:{display:'flex',alignItems:'center',gap:8,padding:'14px 18px',borderBottom:'1px solid rgba(57,211,83,.1)',flexShrink:0},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#16a34a',fontFamily:'monospace',flex:1},
  badge:{background:'#dc2626',color:'#fff',fontSize:10,fontWeight:700,fontFamily:'monospace',minWidth:18,height:18,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'},
  closeBtn:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'},
  msgBar:{padding:'7px 16px',background:'rgba(57,211,83,.08)',borderBottom:'1px solid rgba(57,211,83,.2)',fontSize:11,color:'#16a34a',fontFamily:'monospace',flexShrink:0},
  tabs:{display:'flex',gap:4,padding:'8px 10px',borderBottom:'1px solid rgba(241,245,249,0.8)',flexShrink:0},
  tab:{flex:1,padding:'6px 0',borderRadius:7,border:'1px solid rgba(241,245,249,0.8)',cursor:'pointer',fontFamily:'monospace',fontSize:10,fontWeight:700,background:'transparent',color:'rgba(255,255,255,.25)',transition:'all .2s'},
  tabOn:{background:'rgba(57,211,83,.1)',color:'#16a34a',borderColor:'rgba(57,211,83,.3)'},
  body:{flex:1,overflowY:'auto',padding:'10px'},
  addSection:{display:'flex',flexDirection:'column',gap:10,padding:'8px 4px'},
  hint:{fontSize:11,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',margin:0},
  addRow:{display:'flex',gap:8},
  input:{flex:1,padding:'8px 12px',background:'rgba(57,211,83,.05)',border:'1px solid rgba(57,211,83,.2)',borderRadius:9,color:'#1e293b',fontFamily:'monospace',fontSize:12,outline:'none'},
  addBtn:{padding:'8px 16px',background:'rgba(57,211,83,.12)',border:'1px solid rgba(57,211,83,.35)',borderRadius:9,color:'#16a34a',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:700},
  list:{display:'flex',flexDirection:'column',gap:8},
  empty:{textAlign:'center',color:'rgba(100,116,139,0.6)',padding:30,fontFamily:'monospace',fontSize:12,lineHeight:1.7},
  reqRow:{display:'flex',alignItems:'center',gap:8,padding:'8px',background:'#f1f5f9',borderRadius:10,border:'1px solid rgba(241,245,249,0.8)'},
  friendRow:{display:'flex',alignItems:'center',gap:10,padding:'9px',background:'#f1f5f9',borderRadius:10,border:'1px solid rgba(241,245,249,0.8)'},
  av:{width:36,height:36,borderRadius:'50%',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,position:'relative',background:'rgba(255,255,255,0.96)'},
  onlineDot:{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',border:'1.5px solid #080e1e'},
  reqName:{flex:1,fontSize:13,fontWeight:700,color:'#1e293b',fontFamily:'monospace'},
  btn:{padding:'5px 10px',borderRadius:7,border:'1px solid',background:'transparent',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'monospace'},
  fInfo:{flex:1,minWidth:0},
  fName:{fontSize:13,fontWeight:700,fontFamily:'monospace'},
  fSub:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:2},
  onlineBadge:{fontSize:8,fontFamily:'monospace',fontWeight:700,padding:'2px 7px',border:'1px solid',borderRadius:5},
};
