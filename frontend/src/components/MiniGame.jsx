import React, { useState, useEffect, useRef } from 'react';

export default function MiniGame({ locationId, locationName, socket, onClose }) {
  const [phase, setPhase] = useState('idle'); // idle, question, result
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult]     = useState(null);
  const [timer, setTimer]       = useState(15);
  const timerRef = useRef(null);

  useEffect(()=>{
    if(!socket) return;
    const onQ = d => { setQuestion(d); setPhase('question'); setSelected(null); setResult(null); setTimer(15); };
    const onR = d => { setResult(d); setPhase('result'); if(timerRef.current) clearInterval(timerRef.current); };
    socket.on('minigame:question',onQ); socket.on('minigame:result',onR);
    return()=>{ socket.off('minigame:question',onQ); socket.off('minigame:result',onR); clearInterval(timerRef.current); };
  },[socket]);

  useEffect(()=>{
    if(phase!=='question') return;
    timerRef.current=setInterval(()=>{
      setTimer(t=>{
        if(t<=1){ clearInterval(timerRef.current); socket?.emit('minigame:answer',{locationId,answerIndex:-1}); setPhase('result'); setResult({correct:false,message:'⏰ Süre doldu!',correctIndex:-1}); return 0; }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[phase,socket,locationId]);

  const start   = () => socket?.emit('minigame:start',{locationId});
  const answer  = (i) => { if(selected!==null) return; setSelected(i); socket?.emit('minigame:answer',{locationId,answerIndex:i}); };

  const optColors = (i) => {
    if(selected===null) return {};
    if(result && result.correctIndex===i) return {background:'rgba(57,211,83,.2)',borderColor:'#16a34a',color:'#16a34a'};
    if(selected===i && !result?.correct) return {background:'rgba(255,68,68,.15)',borderColor:'#ff4444',color:'#ff4444'};
    return {opacity:.4};
  };

  const timerPct = (timer/15)*100;
  const timerColor = timer>8?'#16a34a':timer>4?'#ffd700':'#ff4444';

  return (
    <div style={S.overlay} onClick={phase==='idle'?onClose:undefined}>
      <div style={S.panel} onClick={e=>e.stopPropagation()}>

        <div style={S.header}>
          <div style={S.title}>🎮 MİNİ OYUN</div>
          <div style={S.sub}>{locationName}</div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {phase==='idle' && (
          <div style={S.idleBody}>
            <div style={S.idleIcon}>🎯</div>
            <div style={S.idleTitle}>Hazır mısın?</div>
            <div style={S.idleDesc}>Bu alana özel trivia sorusu. Hızlı cevaplarsan daha fazla XP kazanırsın!</div>
            <div style={S.xpHint}>⚡ Hızlı: 50 XP &nbsp; Normal: 35 XP &nbsp; Yavaş: 20 XP</div>
            <button onClick={start} style={S.startBtn}>▶ Başla</button>
          </div>
        )}

        {phase==='question' && question && (
          <div style={S.qBody}>
            {/* Timer */}
            <div style={S.timerBar}>
              <div style={{...S.timerFill,width:`${timerPct}%`,background:timerColor,boxShadow:`0 0 8px ${timerColor}60`}}/>
            </div>
            <div style={{...S.timerText,color:timerColor}}>{timer}s</div>
            <div style={S.qText}>{question.question}</div>
            <div style={S.opts}>
              {question.options.map((opt,i)=>(
                <button key={i} onClick={()=>answer(i)}
                  style={{...S.opt,...(selected===i?S.optSelected:{}),...optColors(i)}}>
                  <span style={S.optLetter}>{String.fromCharCode(65+i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase==='result' && result && (
          <div style={S.resultBody}>
            <div style={{fontSize:48,marginBottom:10}}>{result.correct?'🎉':'😢'}</div>
            <div style={{...S.resultTitle,color:result.correct?'#16a34a':'#ff4444'}}>{result.message}</div>
            {result.correct && <div style={S.xpGain}>+{result.xpGain} XP kazandın!</div>}
            {!result.correct && result.correctIndex>=0 && (
              <div style={S.correctAns}>Doğru cevap: {question?.options?.[result.correctIndex]}</div>
            )}
            <div style={S.resultBtns}>
              <button onClick={start} style={S.retryBtn}>🔄 Tekrar</button>
              <button onClick={onClose} style={S.closeResultBtn}>✓ Tamam</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S={
  overlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(5px)'},
  panel:{width:'min(400px,92vw)',background:'rgba(255,255,255,0.96)',border:'1px solid rgba(100,116,139,0.15)',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header:{display:'flex',alignItems:'center',gap:6,padding:'14px 18px',borderBottom:'1px solid rgba(100,116,139,0.15)'},
  title:{fontSize:13,fontWeight:900,letterSpacing:'.1em',color:'#0e7490',fontFamily:'monospace'},
  sub:{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',flex:1},
  closeBtn:{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,color:'#64748b',cursor:'pointer',fontSize:14,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center'},
  idleBody:{display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 20px',gap:10},
  idleIcon:{fontSize:44},
  idleTitle:{fontSize:18,fontWeight:700,color:'#1e293b',fontFamily:'monospace'},
  idleDesc:{fontSize:11,color:'rgba(100,116,139,0.6)',textAlign:'center',fontFamily:'monospace',lineHeight:1.6},
  xpHint:{fontSize:10,color:'rgba(100,116,139,0.15)',fontFamily:'monospace',background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.15)',borderRadius:8,padding:'6px 12px'},
  startBtn:{marginTop:6,padding:'11px 32px',background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.15)',borderRadius:10,color:'#0e7490',cursor:'pointer',fontFamily:'monospace',fontSize:14,fontWeight:700,transition:'all .2s'},
  qBody:{padding:'14px 16px',display:'flex',flexDirection:'column',gap:12},
  timerBar:{height:4,background:'#f1f5f9',borderRadius:2,overflow:'hidden'},
  timerFill:{height:'100%',borderRadius:2,transition:'width 1s linear, background .3s'},
  timerText:{fontSize:11,fontFamily:'monospace',fontWeight:700,textAlign:'right'},
  qText:{fontSize:14,color:'#1e293b',lineHeight:1.5,fontFamily:'monospace',fontWeight:600,padding:'4px 0'},
  opts:{display:'flex',flexDirection:'column',gap:7},
  opt:{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:10,cursor:'pointer',color:'rgba(51,65,85,0.8)',fontFamily:'monospace',fontSize:12,textAlign:'left',transition:'all .15s'},
  optSelected:{background:'rgba(100,116,139,0.15)',borderColor:'rgba(100,116,139,0.15)'},
  optLetter:{width:20,height:20,borderRadius:'50%',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0},
  resultBody:{display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 20px',gap:10},
  resultTitle:{fontSize:16,fontWeight:700,fontFamily:'monospace'},
  xpGain:{fontSize:20,fontWeight:700,color:'#ffd700',fontFamily:'monospace'},
  correctAns:{fontSize:11,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',textAlign:'center'},
  resultBtns:{display:'flex',gap:10,marginTop:6},
  retryBtn:{padding:'9px 20px',background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.15)',borderRadius:9,color:'#0e7490',cursor:'pointer',fontFamily:'monospace',fontSize:12,fontWeight:700},
  closeResultBtn:{padding:'9px 20px',background:'rgba(57,211,83,.08)',border:'1px solid rgba(57,211,83,.3)',borderRadius:9,color:'#16a34a',cursor:'pointer',fontFamily:'monospace',fontSize:12,fontWeight:700},
};
