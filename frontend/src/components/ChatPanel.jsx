import React, { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ currentRoom, messages, onSendMessage, user, socket, onFocus, onBlur }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = e => {
    e.preventDefault();
    const t=text.trim(); if(!t||!currentRoom) return;
    onSendMessage(currentRoom,t); setText('');
  };

  const color  = user?.avatar?.color||'#8b1a1a';
  const myId   = user?.id||user?._id;
  const canMod = user?.role==='admin'||user?.role==='moderator';
  const roomMsgs = (messages||[]).filter(m=>!currentRoom||m.roomId===currentRoom||!m.roomId);

  const deleteMsg = msgId => {
    if(!socket||!currentRoom) return;
    socket.emit('mod:delete_message',{messageId:msgId,roomId:currentRoom});
  };

  const roomLabel = currentRoom
    ? currentRoom.replace('chat_','').replace(/_/g,' ').toUpperCase()
    : null;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div style={{...S.headerDot, background:currentRoom?'#16a34a':'#94a3b8',
          boxShadow:currentRoom?'0 0 6px #16a34a80':'none'}}/>
        <div style={S.headerLeft}>
          <span style={S.headerTitle}>ALAN SOHBETİ</span>
          {roomLabel
            ? <span style={S.roomBadge}>{roomLabel}</span>
            : <span style={S.noRoom}>— bir lokasyona girin</span>
          }
        </div>
      </div>

      {/* Mesajlar */}
      <div style={S.msgs}>
        {roomMsgs.length===0&&(
          <div style={S.empty}>
            {currentRoom?'📭 Henüz mesaj yok':'🗺️ Bir alana yaklaşın'}
          </div>
        )}
        {roomMsgs.map((m,i)=>{
          const isMine=(m.sender?.userId===myId||m.sender?.id===myId);
          const av=m.sender?.avatar||{};
          const mc=av.color||'#94a3b8';
          const role=m.sender?.role;
          const roleTag=role==='admin'?'⚡':role==='moderator'?'🛡️':'';
          return (
            <div key={m._id||m.id||i} style={{...S.msg,...(isMine?S.msgMine:{})}}>
              {!isMine&&(
                <div style={{...S.avDot,borderColor:mc,background:`radial-gradient(circle at 35% 30%,${mc}18,#f8fafc)`}}>
                  <span style={{fontSize:13}}>{av.emoji||'👤'}</span>
                </div>
              )}
              <div style={{maxWidth:'80%'}}>
                {!isMine&&(
                  <div style={{...S.senderName,color:mc}}>
                    {roleTag&&<span style={{marginRight:3}}>{roleTag}</span>}
                    {m.sender?.username||'?'}
                  </div>
                )}
                <div style={{
                  ...S.bubble,
                  ...(isMine?{
                    background:`linear-gradient(135deg,${color}15,${color}08)`,
                    border:`1px solid ${color}28`,
                    borderRadius:'12px 12px 2px 12px',
                    color:'#0f172a',
                  }:{})
                }}>
                  {m.content||m.message||''}
                </div>
                <div style={{...S.tsRow,...(isMine?{justifyContent:'flex-end'}:{})}}>
                  <span style={S.ts}>{m.createdAt?new Date(m.createdAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}):''}</span>
                  {canMod&&!isMine&&(
                    <button onClick={()=>deleteMsg(m._id||m.id)} style={S.delBtn} title="Sil">🗑️</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <form onSubmit={send} style={S.inputRow}>
        <input
          ref={inputRef} value={text}
          onChange={e=>setText(e.target.value)}
          onFocus={()=>onFocus?.()}
          onBlur={()=>onBlur?.()}
          placeholder={currentRoom?'Mesaj yaz...':'Önce bir alana girin'}
          disabled={!currentRoom} maxLength={400}
          style={{...S.input,...(!currentRoom?{opacity:.45}:{})}}
        />
        <button type="submit" disabled={!currentRoom||!text.trim()}
          style={{...S.sendBtn,...(text.trim()&&currentRoom?{background:color,color:'#fff',border:`1px solid ${color}`}:{})}}>
          ▶
        </button>
      </form>
    </div>
  );
}

const S={
  wrap:{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'#ffffff'},
  header:{display:'flex',alignItems:'center',gap:8,padding:'12px 14px 10px',borderBottom:'1px solid #f1f5f9',flexShrink:0,background:'#f8fafc'},
  headerDot:{width:7,height:7,borderRadius:'50%',flexShrink:0,transition:'all .3s'},
  headerLeft:{display:'flex',flexDirection:'column',gap:1},
  headerTitle:{fontSize:9,fontWeight:700,letterSpacing:'.12em',color:'#94a3b8',fontFamily:'monospace'},
  roomBadge:{fontSize:10,fontWeight:700,color:'#0f172a',fontFamily:'monospace',letterSpacing:'.04em'},
  noRoom:{fontSize:9,color:'#cbd5e1',fontFamily:'monospace'},
  msgs:{flex:1,overflowY:'auto',padding:'12px 10px 8px',display:'flex',flexDirection:'column',gap:10},
  empty:{textAlign:'center',color:'#cbd5e1',fontSize:12,marginTop:48,fontFamily:'monospace'},
  msg:{display:'flex',alignItems:'flex-end',gap:8},
  msgMine:{flexDirection:'row-reverse'},
  avDot:{width:30,height:30,borderRadius:'50%',border:'1.5px solid',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18},
  senderName:{fontSize:9,fontWeight:700,letterSpacing:'.04em',marginBottom:3,fontFamily:'monospace',display:'flex',alignItems:'center'},
  bubble:{padding:'8px 12px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'12px 12px 12px 2px',fontSize:12,color:'#1e293b',lineHeight:1.5,wordBreak:'break-word'},
  tsRow:{display:'flex',alignItems:'center',gap:5,marginTop:3},
  ts:{fontSize:8,color:'#cbd5e1',fontFamily:'monospace'},
  delBtn:{background:'none',border:'none',cursor:'pointer',fontSize:9,opacity:0,transition:'opacity .2s',padding:'0 2px'},
  inputRow:{display:'flex',gap:7,padding:'9px 10px 11px',borderTop:'1px solid #f1f5f9',flexShrink:0,background:'#fafafa'},
  input:{flex:1,padding:'9px 13px',background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:10,color:'#0f172a',fontFamily:'monospace',fontSize:12,outline:'none',transition:'border-color .2s',boxShadow:'inset 0 1px 2px rgba(0,0,0,.04)'},
  sendBtn:{width:38,height:38,borderRadius:10,border:'1px solid #e2e8f0',background:'#f1f5f9',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .18s',color:'#94a3b8'},
};
