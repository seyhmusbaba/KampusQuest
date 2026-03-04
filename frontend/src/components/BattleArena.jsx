import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Savaş Arena Ana Bileşeni ──────────────────────── */
export default function BattleArena({ socket, currentUser, nearbyPlayers=[], onClose }) {
  const [phase, setPhase]           = useState('lobby');   // lobby | challenge_sent | waiting | battle | end
  const [battleData, setBattleData] = useState(null);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [notification, setNotification] = useState('');
  const notifTimer = useRef(null);

  const notify = useCallback((msg) => {
    setNotification(msg);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(''), 4000);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onChallenge = (d) => { setIncomingChallenge(d); setPhase('incoming'); };
    const onChallengeSent = () => { setPhase('challenge_sent'); notify('Meydan okuma gönderildi! 30 saniye bekleniyor...'); };
    const onDeclined = (d) => { setPhase('lobby'); notify(d.reason==='timeout' ? '⏰ Meydan okuma zaman aşımına uğradı' : '❌ Rakip reddetti'); };
    const onExpired = () => { setIncomingChallenge(null); setPhase('lobby'); };
    const onStart = (d) => {
      setBattleData({ battleId:d.battleId, opponentName:d.opponentName, opponentLevel:d.opponentLevel,
        totalRounds:d.totalRounds, round:-1, question:null, myScore:0, opponentScore:0,
        myAnswer:null, opponentAnswered:false, result:null, timer:15 });
      setPhase('battle');
    };
    const onQuestion = (d) => {
      setBattleData(prev => ({ ...prev, ...d, round:d.roundIndex, myAnswer:null, opponentAnswered:false, result:null, timer:15 }));
    };
    const onOpponentAnswered = () => setBattleData(prev => prev ? {...prev, opponentAnswered:true} : prev);
    const onRoundResult = (d) => {
      setBattleData(prev => {
        if (!prev) return prev;
        const myName = currentUser?.username;
        return { ...prev, result:d.result, myScore:d.scores[myName]||0,
          opponentScore:d.scores[prev.opponentName]||0, correctIndex:d.correctIndex, category:d.category };
      });
    };
    const onEnd = (d) => { setBattleData(prev => prev ? {...prev, endData:d} : prev); setPhase('end'); };
    const onForfeit = () => { notify('🏳️ Rakip teslim oldu! Zafer senin!'); };

    socket.on('battle:incoming_challenge', onChallenge);
    socket.on('battle:challenge_sent',    onChallengeSent);
    socket.on('battle:challenge_declined', onDeclined);
    socket.on('battle:challenge_expired',  onExpired);
    socket.on('battle:start',              onStart);
    socket.on('battle:question',           onQuestion);
    socket.on('battle:opponent_answered',  onOpponentAnswered);
    socket.on('battle:round_result',       onRoundResult);
    socket.on('battle:end',                onEnd);
    socket.on('battle:opponent_forfeited', onForfeit);

    return () => {
      socket.off('battle:incoming_challenge', onChallenge);
      socket.off('battle:challenge_sent',     onChallengeSent);
      socket.off('battle:challenge_declined', onDeclined);
      socket.off('battle:challenge_expired',  onExpired);
      socket.off('battle:start',              onStart);
      socket.off('battle:question',           onQuestion);
      socket.off('battle:opponent_answered',  onOpponentAnswered);
      socket.off('battle:round_result',       onRoundResult);
      socket.off('battle:end',                onEnd);
      socket.off('battle:opponent_forfeited', onForfeit);
    };
  }, [socket, currentUser, notify]);

  // Soru sayacı
  useEffect(() => {
    if (phase !== 'battle' || !battleData?.question || battleData.myAnswer !== null || battleData.result) return;
    const interval = setInterval(() => {
      setBattleData(prev => {
        if (!prev || prev.timer <= 1) { clearInterval(interval); return prev; }
        return {...prev, timer: prev.timer - 1};
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, battleData?.question, battleData?.myAnswer, battleData?.result]);

  const sendChallenge = () => {
    if (!selectedTarget) return;
    socket.emit('battle:challenge', {targetUserId: selectedTarget.userId});
  };

  const respondChallenge = (accept) => {
    socket.emit('battle:respond', {accept});
    setIncomingChallenge(null);
    if (!accept) setPhase('lobby');
  };

  const sendAnswer = (index) => {
    if (!battleData || battleData.myAnswer !== null || battleData.result) return;
    setBattleData(prev => prev ? {...prev, myAnswer:index} : prev);
    socket.emit('battle:answer', {battleId: battleData.battleId, answerIndex: index});
  };

  const forfeit = () => {
    if (battleData) socket.emit('battle:forfeit', {battleId: battleData.battleId});
    setPhase('lobby');
    setBattleData(null);
  };

  const reset = () => { setPhase('lobby'); setBattleData(null); setSelectedTarget(null); };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerIcon}>⚔️</span>
            <div>
              <div style={S.headerTitle}>Savaş Meydanı</div>
              <div style={S.headerSub}>Bilgi yarışması · PvP · XP kazan</div>
            </div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Bildirim */}
        {notification && <div style={S.notif}>{notification}</div>}

        {/* Gelen meydan okuma — her fazda göster */}
        {incomingChallenge && phase !== 'battle' && (
          <IncomingChallenge challenge={incomingChallenge} onRespond={respondChallenge}/>
        )}

        {/* İçerik */}
        <div style={S.body}>
          {phase === 'lobby' && (
            <Lobby nearbyPlayers={nearbyPlayers} currentUser={currentUser}
              selected={selectedTarget} onSelect={setSelectedTarget} onChallenge={sendChallenge}/>
          )}
          {phase === 'challenge_sent' && (
            <WaitingScreen opponentName={selectedTarget?.username}/>
          )}
          {phase === 'incoming' && !incomingChallenge && <Lobby nearbyPlayers={nearbyPlayers} currentUser={currentUser} selected={selectedTarget} onSelect={setSelectedTarget} onChallenge={sendChallenge}/>}
          {phase === 'battle' && battleData && (
            <BattleScreen data={battleData} onAnswer={sendAnswer} onForfeit={forfeit} currentUser={currentUser}/>
          )}
          {phase === 'end' && battleData && (
            <EndScreen data={battleData} currentUser={currentUser} onPlayAgain={reset} onClose={onClose}/>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Lobi ───────────────────────────────────────────── */
function Lobby({ nearbyPlayers, currentUser, selected, onSelect, onChallenge }) {
  const others = nearbyPlayers.filter(p => p.userId !== currentUser?.id && p.userId !== currentUser?._id);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={S.lobbyInfo}>
        <div style={S.lobbyInfoIcon}>🗡️</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#1e293b',marginBottom:4}}>Nasıl Oynanır?</div>
          <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',lineHeight:1.6}}>
            • Aynı alandaki bir oyuncuyu seç ve meydan oku<br/>
            • 5 soruluk bilgi yarışması, 15 saniye/soru<br/>
            • Hızlı cevap = daha fazla puan (3/2/1 puan)<br/>
            • Kazanan <span style={{color:'#ffd700'}}>+80 XP</span>, kaybeden <span style={{color:'#16a34a'}}>+25 XP</span>
          </div>
        </div>
      </div>

      <div>
        <div style={S.sectionTitle}>📍 Bu Alandaki Oyuncular ({others.length})</div>
        {others.length === 0 ? (
          <div style={S.emptyMsg}>Bu alanda savaşacak kimse yok.<br/>Bir lokasyona giderek diğer oyuncuları bul!</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {others.map(p => (
              <PlayerCard key={p.userId} player={p}
                isSelected={selected?.userId === p.userId}
                onClick={()=>onSelect(p)}/>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <button onClick={onChallenge} style={S.challengeBtn}>
          ⚔️ {selected.username}'i Savaşa Davet Et
        </button>
      )}
    </div>
  );
}

function PlayerCard({ player, isSelected, onClick }) {
  const c = player.avatar?.color || '#0e7490';
  return (
    <button onClick={onClick} style={{...S.playerCard, borderColor: isSelected ? c : `${c}22`, background: isSelected ? `${c}14` : `${c}06`}}>
      <div style={{...S.playerAvatar, borderColor:c, boxShadow:`0 0 8px ${c}40`}}>
        <span style={{fontSize:18}}>{player.avatar?.emoji||'🎓'}</span>
        <div style={{...S.playerLv, background:c}}>{player.level||1}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{player.username}</div>
        <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Lv.{player.level||1} · {player.xp||0} XP</div>
      </div>
      {isSelected && <div style={{color:c,fontSize:16}}>⚔️</div>}
    </button>
  );
}

/* ─── Gelen meydan okuma ─────────────────────────────── */
function IncomingChallenge({ challenge, onRespond }) {
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => { if(s<=1){clearInterval(t);onRespond(false);} return s-1; }), 1000);
    return () => clearInterval(t);
  }, [onRespond]);
  return (
    <div style={S.incomingBox}>
      <div style={{fontSize:28,marginBottom:6}}>⚔️</div>
      <div style={{fontSize:13,fontWeight:700,color:'#ffd700',marginBottom:4}}>Meydan Okuma!</div>
      <div style={{fontSize:12,color:'rgba(100,116,139,0.6)',marginBottom:12}}>
        <b style={{color:'#1e293b'}}>{challenge.challengerName}</b> (Lv.{challenge.challengerLevel}) sizi savaşa davet etti
      </div>
      <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',marginBottom:12}}>{seconds}s içinde karar ver</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>onRespond(true)}  style={S.acceptBtn}>⚔️ Kabul</button>
        <button onClick={()=>onRespond(false)} style={S.rejectBtn}>🚫 Reddet</button>
      </div>
    </div>
  );
}

/* ─── Bekleme ekranı ─────────────────────────────────── */
function WaitingScreen({ opponentName }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'40px 20px',textAlign:'center'}}>
      <div style={{fontSize:40,animation:'cg-float 2s ease-in-out infinite'}}>⚔️</div>
      <div style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>{opponentName} cevap bekliyor...</div>
      <div style={{fontSize:11,color:'rgba(100,116,139,0.6)'}}>Meydan okuma 30 saniye geçerli</div>
      <div style={S.waitDots}><span/><span/><span/></div>
    </div>
  );
}

/* ─── Savaş ekranı ───────────────────────────────────── */
function BattleScreen({ data, onAnswer, onForfeit, currentUser }) {
  const { question, options, round, totalRounds, myScore, opponentScore,
          opponentName, myAnswer, opponentAnswered, result, correctIndex, timer, category } = data;

  const myName = currentUser?.username;
  const timerPct = (timer / 15) * 100;
  const timerColor = timer > 9 ? '#16a34a' : timer > 5 ? '#ffd700' : '#dc2626';

  if (!question) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'48px 0',textAlign:'center'}}>
        <div style={{fontSize:36}}>⚔️</div>
        <div style={{fontSize:14,color:'rgba(100,116,139,0.6)'}}>Savaş başlıyor...</div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {/* Skor şeridi */}
      <div style={S.scoreBar}>
        <div style={S.scoreSide}>
          <span style={S.scoreEmoji}>{currentUser?.avatar?.emoji||'🎓'}</span>
          <div>
            <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>{myName}</div>
            <div style={{fontSize:22,fontWeight:900,color:'#0e7490',fontFamily:'monospace'}}>{myScore}</div>
          </div>
        </div>
        <div style={S.scoreCenter}>
          <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginBottom:2}}>
            {round+1}/{totalRounds}
          </div>
          <div style={{fontSize:20,fontWeight:900,color:'rgba(100,116,139,0.6)'}}>VS</div>
        </div>
        <div style={{...S.scoreSide,flexDirection:'row-reverse',textAlign:'right'}}>
          <span style={S.scoreEmoji}>🎓</span>
          <div>
            <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>{opponentName}</div>
            <div style={{fontSize:22,fontWeight:900,color:'#ff6b35',fontFamily:'monospace'}}>{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* Kategori + Sayaç */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={S.catBadge}>{category}</div>
        {!result && (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {opponentAnswered && <span style={{fontSize:10,color:'#16a34a',fontFamily:'monospace'}}>✓ cevapladı</span>}
            <div style={{...S.timer, color:timerColor, borderColor:`${timerColor}50`}}>
              {timer}s
              <div style={{...S.timerBar, width:`${timerPct}%`, background:timerColor}}/>
            </div>
          </div>
        )}
      </div>

      {/* Soru */}
      <div style={S.questionBox}>{question}</div>

      {/* Şıklar */}
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {(options||[]).map((opt, i) => {
          let style = S.optionBtn;
          if (result) {
            if (i === correctIndex) style = {...S.optionBtn, ...S.optionCorrect};
            else if (i === myAnswer && myAnswer !== correctIndex) style = {...S.optionBtn, ...S.optionWrong};
            else style = {...S.optionBtn, ...S.optionDim};
          } else if (myAnswer !== null) {
            style = i === myAnswer ? {...S.optionBtn, ...S.optionSelected} : {...S.optionBtn, ...S.optionDim};
          }
          const labels = ['A','B','C','D'];
          return (
            <button key={i} onClick={()=>onAnswer(i)}
              disabled={myAnswer !== null || !!result}
              style={style}>
              <span style={S.optionLabel}>{labels[i]}</span>
              <span style={{flex:1,textAlign:'left'}}>{opt}</span>
              {result && i===correctIndex && <span>✓</span>}
              {result && i===myAnswer && myAnswer!==correctIndex && <span>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Tur sonucu */}
      {result && (
        <div style={{...S.roundResult, background: result.correct ? 'rgba(57,211,83,.1)' : 'rgba(255,56,96,.08)',
          borderColor: result.correct ? 'rgba(57,211,83,.3)' : 'rgba(255,56,96,.25)'}}>
          <span style={{fontSize:22}}>{result.correct ? '🎯' : '😔'}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:result.correct?'#16a34a':'#dc2626'}}>
              {result.correct ? `Doğru! +${result.pts} puan` : 'Yanlış — 0 puan'}
            </div>
            <div style={{fontSize:10,color:'rgba(100,116,139,0.6)'}}>Sonraki soru geliyor...</div>
          </div>
        </div>
      )}

      <button onClick={onForfeit} style={S.forfeitBtn}>🏳️ Teslim Ol</button>
    </div>
  );
}

/* ─── Bitiş ekranı ───────────────────────────────────── */
function EndScreen({ data, currentUser, onPlayAgain, onClose }) {
  const { opponentName, myScore, opponentScore, endData } = data;
  const myName = currentUser?.username;
  const isWinner = endData?.isWinner;
  const isDraw   = endData?.isDraw;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center',padding:'8px 0'}}>
      <div style={{fontSize:48,animation:'cg-ping 1s ease-out 2'}}>
        {isDraw ? '🤝' : isWinner ? '🏆' : '😔'}
      </div>
      <div style={{fontSize:18,fontWeight:900,color: isDraw?'#ffd700': isWinner?'#16a34a':'#dc2626'}}>
        {isDraw ? 'Beraberlik!' : isWinner ? 'Zafer!' : 'Mağlubiyet'}
      </div>
      {/* Skor kartı */}
      <div style={S.endScoreCard}>
        <div style={S.endPlayer}>
          <div style={{fontSize:28}}>{currentUser?.avatar?.emoji||'🎓'}</div>
          <div style={{fontSize:11,color:'rgba(100,116,139,0.6)'}}>{myName}</div>
          <div style={{fontSize:36,fontWeight:900,color:'#0e7490',fontFamily:'monospace'}}>{myScore}</div>
        </div>
        <div style={{fontSize:18,color:'rgba(100,116,139,0.6)',fontWeight:700}}>VS</div>
        <div style={S.endPlayer}>
          <div style={{fontSize:28}}>🎓</div>
          <div style={{fontSize:11,color:'rgba(100,116,139,0.6)'}}>{opponentName}</div>
          <div style={{fontSize:36,fontWeight:900,color:'#ff6b35',fontFamily:'monospace'}}>{opponentScore}</div>
        </div>
      </div>
      {/* XP */}
      {endData?.xpGained && (
        <div style={S.xpBadge}>
          <span>✨</span>
          <span style={{fontFamily:'monospace',fontWeight:700}}>+{endData.xpGained} XP kazandın</span>
        </div>
      )}
      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button onClick={onPlayAgain} style={S.challengeBtn}>🔄 Tekrar Oyna</button>
        <button onClick={onClose} style={S.rejectBtn}>✕ Kapat</button>
      </div>
    </div>
  );
}

/* ─── Stiller ────────────────────────────────────────── */
const S = {
  overlay: {position:'fixed',inset:0,background:'rgba(0,0,0,0.12)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'},
  modal: {width:'min(480px,95vw)',maxHeight:'90vh',overflowY:'auto',background:'rgba(5,9,22,.98)',border:'1px solid rgba(255,56,96,.25)',borderRadius:18,display:'flex',flexDirection:'column',boxShadow:'0 30px 80px rgba(0,0,0,0.12)'},
  header: {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid rgba(255,56,96,.12)'},
  headerLeft: {display:'flex',alignItems:'center',gap:12},
  headerIcon: {fontSize:24},
  headerTitle: {fontSize:14,fontWeight:900,color:'#1e293b',fontFamily:'monospace',letterSpacing:'.04em'},
  headerSub: {fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginTop:2},
  closeBtn: {background:'none',border:'1px solid #e2e8f0',color:'rgba(100,116,139,0.6)',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'},
  body: {padding:'16px 20px 20px',flex:1},
  notif: {margin:'0 20px',padding:'8px 12px',background:'rgba(255,215,0,.1)',border:'1px solid rgba(255,215,0,.3)',borderRadius:8,fontSize:11,color:'#ffd700',fontFamily:'monospace',textAlign:'center'},
  lobbyInfo: {display:'flex',gap:12,padding:'12px',background:'rgba(255,56,96,.06)',border:'1px solid rgba(255,56,96,.15)',borderRadius:12},
  lobbyInfoIcon: {fontSize:22,flexShrink:0},
  sectionTitle: {fontSize:11,fontWeight:700,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8},
  emptyMsg: {textAlign:'center',padding:'24px 16px',fontSize:12,color:'rgba(100,116,139,0.6)',lineHeight:1.6,border:'1px dashed rgba(241,245,249,0.8)',borderRadius:10},
  playerCard: {display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:'1px solid',borderRadius:10,cursor:'pointer',transition:'all .15s',background:'none',width:'100%',textAlign:'left'},
  playerAvatar: {width:40,height:40,borderRadius:'50%',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',background:'#f1f5f9',flexShrink:0},
  playerLv: {position:'absolute',bottom:-4,right:-4,width:16,height:16,borderRadius:8,fontSize:8,fontWeight:900,fontFamily:'monospace',display:'flex',alignItems:'center',justifyContent:'center',color:'#ffffff'},
  challengeBtn: {padding:'12px',background:'rgba(255,56,96,.15)',border:'1px solid rgba(255,56,96,.4)',borderRadius:10,color:'#dc2626',fontWeight:700,fontFamily:'monospace',fontSize:12,cursor:'pointer',transition:'all .2s',width:'100%'},
  incomingBox: {margin:'0 20px 12px',display:'flex',flexDirection:'column',alignItems:'center',padding:'16px',background:'rgba(255,215,0,.08)',border:'1px solid rgba(255,215,0,.3)',borderRadius:12,textAlign:'center'},
  acceptBtn: {padding:'9px 18px',background:'rgba(57,211,83,.15)',border:'1px solid rgba(57,211,83,.4)',borderRadius:8,color:'#16a34a',fontWeight:700,fontFamily:'monospace',fontSize:12,cursor:'pointer'},
  rejectBtn: {padding:'9px 18px',background:'rgba(255,56,96,.1)',border:'1px solid rgba(255,56,96,.3)',borderRadius:8,color:'#dc2626',fontWeight:700,fontFamily:'monospace',fontSize:12,cursor:'pointer'},
  waitDots: {display:'flex',gap:6,'& span':{width:8,height:8,borderRadius:'50%',background:'rgba(255,56,96,.4)',animation:'cg-blink 1.2s ease-in-out infinite'}},
  scoreBar: {display:'flex',alignItems:'center',gap:0,padding:'12px 16px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:12},
  scoreSide: {display:'flex',alignItems:'center',gap:10,flex:1},
  scoreCenter: {display:'flex',flexDirection:'column',alignItems:'center',padding:'0 14px'},
  scoreEmoji: {fontSize:24},
  catBadge: {fontSize:9,fontWeight:700,fontFamily:'monospace',color:'rgba(100,116,139,0.6)',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:6,padding:'3px 8px',textTransform:'uppercase',letterSpacing:'.06em'},
  timer: {fontSize:13,fontWeight:900,fontFamily:'monospace',border:'1px solid',borderRadius:8,padding:'3px 10px',position:'relative',overflow:'hidden',minWidth:40,textAlign:'center'},
  timerBar: {position:'absolute',bottom:0,left:0,height:2,transition:'width .9s linear'},
  questionBox: {padding:'14px 16px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:12,fontSize:13,color:'#1e293b',lineHeight:1.6,fontWeight:500},
  optionBtn: {display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:9,color:'#475569',fontSize:12,cursor:'pointer',transition:'all .15s',width:'100%',textAlign:'left'},
  optionLabel: {width:22,height:22,borderRadius:6,background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,fontFamily:'monospace',flexShrink:0},
  optionCorrect: {background:'rgba(57,211,83,.15)',borderColor:'rgba(57,211,83,.5)',color:'#16a34a'},
  optionWrong: {background:'rgba(255,56,96,.12)',borderColor:'rgba(255,56,96,.4)',color:'#dc2626'},
  optionSelected: {background:'rgba(100,116,139,0.15)',borderColor:'rgba(100,116,139,0.15)',color:'#0e7490'},
  optionDim: {opacity:.45},
  roundResult: {display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:'1px solid',borderRadius:10},
  forfeitBtn: {background:'none',border:'1px solid rgba(241,245,249,0.8)',borderRadius:8,color:'rgba(100,116,139,0.6)',fontSize:10,cursor:'pointer',padding:'6px',fontFamily:'monospace',transition:'all .15s',alignSelf:'center'},
  endScoreCard: {display:'flex',alignItems:'center',gap:24,padding:'20px 24px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:14},
  endPlayer: {display:'flex',flexDirection:'column',alignItems:'center',gap:4},
  xpBadge: {display:'flex',alignItems:'center',gap:8,padding:'8px 20px',background:'rgba(57,211,83,.1)',border:'1px solid rgba(57,211,83,.3)',borderRadius:20,color:'#16a34a',fontSize:13},
};
