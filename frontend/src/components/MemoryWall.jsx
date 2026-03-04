import React, { useState, useEffect } from 'react';
import { gameAPI } from '../utils/api';

const MOODS = ['😊','😂','🥺','🔥','💯','🎓','💪','❤️'];

export default function MemoryWall({ locationId, locationName, socket, currentUser, onClose }) {
  const [posts, setPosts]   = useState([]);
  const [text, setText]     = useState('');
  const [mood, setMood]     = useState('😊');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if(!locationId) return;
    gameAPI.memories(locationId).then(res=>{ setPosts(res.data.posts||[]); setLoading(false); }).catch(()=>setLoading(false));
  },[locationId]);

  useEffect(()=>{
    if(!socket) return;
    const onNew  = d => { if(d.post.locationId===locationId) setPosts(p=>[d.post,...p].slice(0,50)); };
    const onLike = d => setPosts(p=>p.map(post=>(String(post._id)===String(d.postId))?{...post,likes:Array(d.likes).fill(null)}:post));
    socket.on('memory:new_post',onNew); socket.on('memory:like_update',onLike);
    return()=>{ socket.off('memory:new_post',onNew); socket.off('memory:like_update',onLike); };
  },[socket,locationId]);

  const submit = () => {
    if(!text.trim()) return;
    socket?.emit('memory:post',{locationId,content:text.trim(),mood});
    setText(''); 
  };
  const like = (postId) => socket?.emit('memory:like',{postId});

  const myId = currentUser?.id||currentUser?._id;
  const color = '#a78bfa';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.title}>📖 ANI DEFTERİ</div>
            <div style={S.sub}>{locationName}</div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Yazma alanı */}
        <div style={S.writeBox}>
          <div style={S.moodRow}>
            {MOODS.map(m=>(
              <button key={m} onClick={()=>setMood(m)} style={{...S.moodBtn,...(mood===m?S.moodOn:{})}}>{m}</button>
            ))}
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} maxLength={280}
            placeholder="Bu yerde bir anın var mı? Paylaş... ✍️"
            style={S.textarea}/>
          <div style={S.writeFooter}>
            <span style={S.charCount}>{text.length}/280</span>
            <button onClick={submit} disabled={!text.trim()} style={{...S.postBtn,opacity:text.trim()?1:.4}}>
              {mood} Paylaş
            </button>
          </div>
        </div>

        {/* Anılar */}
        <div style={S.posts}>
          {loading && <div style={S.empty}>⏳ Yükleniyor...</div>}
          {!loading && posts.length===0 && <div style={S.empty}>Bu alanda henüz anı yok.<br/>İlk anıyı sen yaz! ✍️</div>}
          {posts.map(post=>{
            const isLiked = post.likes?.some(id=>String(id)===String(myId));
            const av = post.author?.avatar||{};
            const ac = av.color||'#94a3b8';
            return (
              <div key={post._id} style={S.postCard}>
                <div style={S.postTop}>
                  <div style={{...S.avDot,borderColor:`${ac}60`,background:`radial-gradient(circle, ${ac}18, #ffffff)`}}>
                    {av.emoji||'👤'}
                  </div>
                  <div style={S.postMeta}>
                    <div style={{...S.authorName,color:ac}}>{post.author?.username||'?'}</div>
                    <div style={S.postDate}>{new Date(post.createdAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</div>
                    {post.author?.faculty && <div style={S.faculty}>{post.author.faculty}</div>}
                  </div>
                  <div style={S.moodDisplay}>{post.mood}</div>
                </div>
                <div style={S.postContent}>{post.content}</div>
                <div style={S.postBottom}>
                  <button onClick={()=>like(post._id)} style={{...S.likeBtn,...(isLiked?S.likedBtn:{})}}>
                    {isLiked?'❤️':'🤍'} {post.likes?.length||0}
                  </button>
                  {post.isPinned && <span style={S.pinBadge}>📌 Sabitlenmiş</span>}
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
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9997,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(5px)'},
  panel:{width:'min(440px,95vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(167,139,250,.2)',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(167,139,250,.1)',flexShrink:0},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#a78bfa',fontFamily:'monospace'},
  sub:{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:2},
  closeBtn:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  writeBox:{padding:'12px 14px',borderBottom:'1px solid rgba(241,245,249,0.8)',flexShrink:0},
  moodRow:{display:'flex',gap:4,marginBottom:8},
  moodBtn:{width:28,height:28,borderRadius:7,border:'1px solid rgba(241,245,249,0.8)',background:'#f1f5f9',cursor:'pointer',fontSize:14,transition:'all .15s'},
  moodOn:{background:'rgba(167,139,250,.2)',border:'1px solid rgba(167,139,250,.4)'},
  textarea:{width:'100%',minHeight:70,padding:'9px 11px',background:'rgba(167,139,250,.04)',border:'1px solid rgba(167,139,250,.15)',borderRadius:9,color:'#1e293b',fontFamily:'monospace',fontSize:12,resize:'vertical',outline:'none',lineHeight:1.5,boxSizing:'border-box'},
  writeFooter:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6},
  charCount:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'},
  postBtn:{padding:'6px 16px',background:'rgba(167,139,250,.12)',border:'1px solid rgba(167,139,250,.4)',borderRadius:8,color:'#a78bfa',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:700,transition:'all .2s'},
  posts:{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:10},
  empty:{textAlign:'center',color:'rgba(100,116,139,0.6)',padding:30,fontFamily:'monospace',fontSize:12,lineHeight:1.8},
  postCard:{background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:12,padding:'12px',transition:'all .2s'},
  postTop:{display:'flex',alignItems:'flex-start',gap:9,marginBottom:9},
  avDot:{width:32,height:32,borderRadius:'50%',border:'1.5px solid',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0},
  postMeta:{flex:1},
  authorName:{fontSize:12,fontWeight:700,fontFamily:'monospace'},
  postDate:{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:1},
  faculty:{fontSize:8,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'},
  moodDisplay:{fontSize:18},
  postContent:{fontSize:12,color:'#334155',lineHeight:1.55,wordBreak:'break-word',marginBottom:8},
  postBottom:{display:'flex',alignItems:'center',gap:8},
  likeBtn:{background:'transparent',border:'none',cursor:'pointer',fontSize:12,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',padding:'2px 6px',borderRadius:5,transition:'all .2s'},
  likedBtn:{color:'#ff6b81'},
  pinBadge:{fontSize:9,color:'rgba(255,215,0,.5)',fontFamily:'monospace'},
};
