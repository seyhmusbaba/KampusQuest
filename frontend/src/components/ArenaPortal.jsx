import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ════════════════════════════════════════════════════════
   🏟️  ARENA PORTALI — Ayrı Boyut
   Tüm event'ler arena:* prefix ile backend ile uyumlu
════════════════════════════════════════════════════════ */

const MODES = [
  { id:'trivia',     label:'Bilgi Düellosu',    icon:'🧠', desc:'7 soruluk hız+doğruluk yarışı', color:'#0e7490',  xp:'90 XP' },
  { id:'football',   label:'Futbol Bilgisi',    icon:'⚽', desc:'Futbol soruları, saha ortamı',   color:'#16a34a',  xp:'80 XP' },
  { id:'speed_math', label:'Hız Matematiği',    icon:'⚡', desc:'7 işlem, en hızlı kazanır',     color:'#ffd700',  xp:'100 XP' },
  { id:'flag',       label:'Bayrak Kapmaca',    icon:'🚩', desc:'Bayrağı ilk kapan kazanır!',    color:'#dc2626',  xp:'70 XP' },
];

export default function ArenaPortal({ socket, currentUser, allPlayers=[], onClose }) {
  /* ── State ────────────────────────────────────────── */
  const [phase, setPhase]           = useState('lobby');
  // lobby | mode_select | invite_sent | invite_incoming | entering | countdown | battle | end
  const [selectedMode, setMode]     = useState('trivia');
  const [selectedTarget, setTarget] = useState(null);
  const [incomingInvite, setIncoming] = useState(null);
  const [arena, setArena]           = useState(null);
  // { arenaId, mode, opponentName, opponentLevel, myScore, opScore, round, totalRounds,
  //   question, options, category, myAnswer, opAnswered, result, correctIndex, timer }
  const [endData, setEndData]       = useState(null);
  const [countdown, setCountdown]   = useState(null);
  const [notice, setNotice]         = useState('');
  const noticeRef = useRef(null);

  /* ── Bildirim ─────────────────────────────────────── */
  const notify = useCallback(msg => {
    setNotice(msg);
    clearTimeout(noticeRef.current);
    noticeRef.current = setTimeout(() => setNotice(''), 4000);
  }, []);

  /* ── Socket olayları ──────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      // Davet gönderildi — bekleme
      'arena:invite_sent':     ()  => setPhase('invite_sent'),
      'arena:invite_expired':  ()  => { setPhase('mode_select'); notify('⏰ Davet zaman aşımına uğradı'); },
      'arena:invite_declined': (d) => { setPhase('mode_select'); notify(d.reason==='rejected'?'❌ Rakip reddetti':'⏰ Davet süresi doldu'); },
      // Gelen davet
      'arena:invited': (d) => {
        setIncoming(d);
        // Eğer lobyde veya mode_select ekranındaysak incoming overlay göster
        // Phase'i değiştirmiyoruz, overlay üstte çıkacak
      },
      'arena:invite_cancelled': () => { setIncoming(null); notify('ℹ️ Davet iptal edildi'); },
      // Arena başlıyor
      'arena:enter': (d) => {
        setArena({
          arenaId: d.arenaId, mode: d.mode, modeLabel: d.modeLabel,
          opponentName: d.opponentName, opponentLevel: d.opponentLevel || 1,
          myScore: 0, opScore: 0,
          round: -1, totalRounds: d.totalRounds,
          question: null, options: [], category: '', myAnswer: null,
          opAnswered: false, result: null, correctIndex: -1, timer: 15,
        });
        setIncoming(null);
        setPhase('entering');
      },
      // Geri sayım
      'arena:countdown': (d) => {
        setCountdown(d.count);
        if (d.count <= 0) { setCountdown(null); setPhase('battle'); }
      },
      // Soru geldi
      'arena:question': (d) => {
        setArena(prev => ({
          ...prev, ...d,
          round: d.roundIndex,
          question: d.question,
          options: d.options,
          category: d.category,
          myAnswer: null, opAnswered: false, result: null, correctIndex: -1,
          timer: 15,
          myScore: d.scores?.[currentUser?.username] ?? prev?.myScore ?? 0,
          opScore: Object.entries(d.scores||{}).find(([k])=>k!==currentUser?.username)?.[1] ?? prev?.opScore ?? 0,
        }));
        setPhase('battle');
      },
      // Rakip cevapladı
      'arena:opponent_answered': () => setArena(prev => prev ? {...prev, opAnswered: true} : prev),
      // Tur sonucu
      'arena:round_result': (d) => {
        setArena(prev => {
          if (!prev) return prev;
          const myName = currentUser?.username;
          return {
            ...prev, result: d.result, correctIndex: d.correctIndex,
            myScore: d.scores?.[myName] ?? prev.myScore,
            opScore: Object.entries(d.scores||{}).find(([k])=>k!==myName)?.[1] ?? prev.opScore,
          };
        });
      },
      // Maç bitti
      'arena:end': (d) => { setEndData(d); setPhase('end'); },
      // Rakip teslim
      'arena:opponent_forfeited': () => notify('🏳️ Rakip teslim oldu! Zafer senin!'),
    };

    for (const [ev, fn] of Object.entries(handlers)) socket.on(ev, fn);
    return () => { for (const [ev, fn] of Object.entries(handlers)) socket.off(ev, fn); };
  }, [socket, currentUser, notify]);

  // Soru sayacı
  useEffect(() => {
    if (phase !== 'battle' || !arena?.question || arena.myAnswer !== null || arena.result) return;
    const interval = setInterval(() => {
      setArena(prev => {
        if (!prev || prev.timer <= 1) { clearInterval(interval); return prev; }
        return {...prev, timer: prev.timer - 1};
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, arena?.question, arena?.myAnswer, arena?.result]);

  /* ── Aksiyon ──────────────────────────────────────── */
  const sendInvite = useCallback(() => {
    if (!selectedTarget || !selectedMode) return;
    socket.emit('arena:invite', { targetUserId: selectedTarget.userId, mode: selectedMode });
  }, [socket, selectedTarget, selectedMode]);

  const respondInvite = useCallback((accept) => {
    socket.emit('arena:respond', { accept });
    setIncoming(null);
    if (!accept) notify('❌ Davet reddedildi');
  }, [socket, notify]);

  const sendAnswer = useCallback((index) => {
    if (!arena || arena.myAnswer !== null || arena.result) return;
    setArena(prev => prev ? {...prev, myAnswer: index} : prev);
    socket.emit('arena:answer', { arenaId: arena.arenaId, answerIndex: index });
  }, [socket, arena]);

  const grabFlag = useCallback(() => {
    if (!arena || arena.myAnswer !== null || arena.result) return;
    setArena(prev => prev ? {...prev, myAnswer: 0} : prev);
    socket.emit('arena:flag_grab', { arenaId: arena.arenaId });
  }, [socket, arena]);

  const forfeit = useCallback(() => {
    if (arena) socket.emit('arena:forfeit', { arenaId: arena.arenaId });
    setPhase('lobby');
    setArena(null);
    setEndData(null);
  }, [socket, arena]);

  const reset = useCallback(() => {
    setPhase('mode_select');
    setArena(null);
    setEndData(null);
    setCountdown(null);
  }, []);

  /* ── Render ───────────────────────────────────────── */
  const others = allPlayers.filter(p => p.userId !== currentUser?.id && p.userId !== String(currentUser?._id));

  return (
    <div style={S.backdrop}>
      {/* Tam ekran arena boyutu */}
      <div style={S.dimension}>
        {/* Arka plan partikülleri */}
        <div style={S.particles}>
          {[...Array(18)].map((_,i) => <div key={i} style={{...S.particle, animationDelay:`${i*0.38}s`, left:`${(i*23+7)%100}%`}}/>)}
        </div>

        {/* Üst bar */}
        <div style={S.topBar}>
          <div style={S.topLogo}>⚔️ <span style={S.topTitle}>ARENA BOYUTU</span></div>
          {(phase==='lobby'||phase==='mode_select') && (
            <button onClick={onClose} style={S.exitBtn}>← Geri Dön</button>
          )}
          {(phase==='battle'||phase==='entering'||phase==='countdown') && (
            <button onClick={forfeit} style={{...S.exitBtn,borderColor:'rgba(255,56,96,.4)',color:'#dc2626'}}>🏳️ Teslim Ol</button>
          )}
        </div>

        {/* Bildirim */}
        {notice && <div style={S.notice}>{notice}</div>}

        {/* Gelen davet overlay */}
        {incomingInvite && (
          <IncomingInvite invite={incomingInvite} onRespond={respondInvite} modes={MODES}/>
        )}

        {/* İçerik */}
        <div style={S.content}>
          {phase==='lobby' && (
            <LobbyScreen onContinue={()=>setPhase('mode_select')} currentUser={currentUser}/>
          )}
          {phase==='mode_select' && (
            <ModeSelectScreen
              modes={MODES} selectedMode={selectedMode} onSelectMode={setMode}
              players={others} selectedTarget={selectedTarget} onSelectTarget={setTarget}
              onInvite={sendInvite}
            />
          )}
          {phase==='invite_sent' && (
            <InviteSentScreen target={selectedTarget} mode={MODES.find(m=>m.id===selectedMode)}/>
          )}
          {(phase==='entering'||phase==='countdown') && arena && (
            <EnterScreen arena={arena} countdown={countdown} currentUser={currentUser}/>
          )}
          {phase==='battle' && arena && (
            <BattleScreen
              arena={arena}
              onAnswer={sendAnswer}
              onFlagGrab={grabFlag}
              currentUser={currentUser}
            />
          )}
          {phase==='end' && (
            <EndScreen endData={endData} arena={arena} currentUser={currentUser} onPlayAgain={reset} onExit={onClose}/>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Lobi Karşılama ──────────────────────────────── */
function LobbyScreen({ onContinue, currentUser }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:28,textAlign:'center',paddingTop:20}}>
      <div style={S.arenaBadge}>🏟️</div>
      <div>
        <div style={S.heroTitle}>ARENA BOYUTUNA</div>
        <div style={S.heroTitle2}>HOŞ GELDİN</div>
        <div style={S.heroSub}>Kampüsteki öğrencilerle gerçek zamanlı bilgi düellosuna gir.<br/>Kazan, XP topla, sıralamalarda yüksel.</div>
      </div>
      <div style={S.modeGrid}>
        {MODES.map(m => (
          <div key={m.id} style={{...S.modePreview, borderColor:`${m.color}30`, background:`${m.color}08`}}>
            <div style={{fontSize:28}}>{m.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:m.color,fontFamily:'monospace'}}>{m.label}</div>
            <div style={{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>{m.xp} kazanılabilir</div>
          </div>
        ))}
      </div>
      <button onClick={onContinue} style={S.bigBtn}>
        ⚔️ Rakip Seç ve Meydan Oku
      </button>
    </div>
  );
}

/* ─── Mod + Rakip Seçimi ─────────────────────────── */
function ModeSelectScreen({ modes, selectedMode, onSelectMode, players, selectedTarget, onSelectTarget, onInvite }) {
  const mode = modes.find(m=>m.id===selectedMode);
  return (
    <div style={S.twoCol}>
      {/* Sol: Mod seçimi */}
      <div style={S.col}>
        <div style={S.colTitle}>🎮 Oyun Modu Seç</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {modes.map(m => (
            <button key={m.id} onClick={()=>onSelectMode(m.id)}
              style={{...S.modeCard, borderColor: selectedMode===m.id ? m.color : `${m.color}22`,
                background: selectedMode===m.id ? `${m.color}12` : `${m.color}04`,
                boxShadow: selectedMode===m.id ? `0 0 20px ${m.color}22` : 'none'}}>
              <div style={{fontSize:24,flexShrink:0}}>{m.icon}</div>
              <div style={{flex:1,textAlign:'left'}}>
                <div style={{fontSize:12,fontWeight:700,color: selectedMode===m.id ? m.color : '#1e293b',fontFamily:'monospace'}}>{m.label}</div>
                <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',marginTop:2}}>{m.desc}</div>
              </div>
              <div style={{fontSize:10,fontWeight:900,color:m.color,fontFamily:'monospace',flexShrink:0}}>+{m.xp}</div>
              {selectedMode===m.id && <div style={{fontSize:14,color:m.color}}>✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Sağ: Rakip seçimi */}
      <div style={S.col}>
        <div style={S.colTitle}>👥 Rakip Seç ({players.length} çevrimiçi)</div>
        {players.length === 0 ? (
          <div style={S.empty}>Şu an kampüste başka oyuncu yok.<br/>Bir lokasyona gidip diğer öğrencilerle karşılaş!</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:7,maxHeight:280,overflowY:'auto'}}>
            {players.map(p => {
              const c = p.avatar?.color || '#0e7490';
              const sel = selectedTarget?.userId === p.userId;
              return (
                <button key={p.userId} onClick={()=>onSelectTarget(p)}
                  style={{...S.playerCard2, borderColor:sel?c:`${c}20`, background:sel?`${c}12`:`${c}05`}}>
                  <div style={{...S.pAvatar, borderColor:c}}>
                    <span style={{fontSize:16}}>{p.avatar?.emoji||'🎓'}</span>
                    <div style={{...S.pLv, background:c, color:'#ffffff'}}>{p.level||1}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{p.username}</div>
                    <div style={{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Lv.{p.level} · {p.xp||0} XP</div>
                  </div>
                  {sel && <span style={{color:c,fontSize:18}}>⚔️</span>}
                </button>
              );
            })}
          </div>
        )}

        {selectedTarget && mode && (
          <button onClick={onInvite} style={{...S.bigBtn, marginTop:12, background:`${mode.color}18`, borderColor:`${mode.color}55`, color:mode.color}}>
            {mode.icon} {selectedTarget.username}'i {mode.label}'na davet et
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Davet gönderildi ───────────────────────────── */
function InviteSentScreen({ target, mode }) {
  const [dots, setDots] = useState('.');
  useEffect(()=>{ const t=setInterval(()=>setDots(d=>d.length>=3?'.':d+'.'),600); return()=>clearInterval(t); },[]);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,paddingTop:40,textAlign:'center'}}>
      <div style={{fontSize:52, animation:'cg-float 2s ease-in-out infinite'}}>{mode?.icon||'⚔️'}</div>
      <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>{target?.username} cevap bekliyor{dots}</div>
      <div style={{fontSize:12,color:'rgba(100,116,139,0.6)'}}>30 saniye içinde kabul etmezse davet iptal olur</div>
      <div style={S.waitBar}><div style={{...S.waitFill, animation:'cg-wait 30s linear forwards'}}/></div>
    </div>
  );
}

/* ─── Gelen davet overlay ────────────────────────── */
function IncomingInvite({ invite, onRespond, modes }) {
  const [secs, setSecs] = useState(30);
  const mode = modes.find(m=>m.id===invite.mode);
  useEffect(()=>{
    const t=setInterval(()=>setSecs(s=>{ if(s<=1){clearInterval(t);onRespond(false);}return s-1;}),1000);
    return()=>clearInterval(t);
  },[onRespond]);
  return (
    <div style={S.inviteOverlay}>
      <div style={S.inviteCard}>
        <div style={{fontSize:36, marginBottom:8}}>{mode?.icon||'⚔️'}</div>
        <div style={{fontSize:15,fontWeight:900,color:'#ffd700',marginBottom:4,fontFamily:'monospace'}}>MEYDAN OKUMA!</div>
        <div style={{fontSize:12,color:'rgba(100,116,139,0.6)',marginBottom:4}}>
          <b style={{color:'#1e293b'}}>{invite.challengerName}</b> (Lv.{invite.challengerLevel})
        </div>
        <div style={{fontSize:11,color: mode?.color||'#0e7490', marginBottom:4, fontWeight:700}}>
          {mode?.label||invite.mode} modunda sizi davet etti
        </div>
        <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',marginBottom:16}}>{secs}s içinde karar ver</div>
        <div style={{width:'100%',height:3,background:'#f1f5f9',borderRadius:2,marginBottom:16}}>
          <div style={{height:'100%',background:'#ffd700',borderRadius:2,width:`${secs/30*100}%`,transition:'width 1s linear'}}/>
        </div>
        <div style={{display:'flex',gap:12}}>
          <button onClick={()=>onRespond(true)}  style={S.acceptBtn}>⚔️ Kabul Et!</button>
          <button onClick={()=>onRespond(false)} style={S.declineBtn}>🚫 Reddet</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Arena girişi + geri sayım ──────────────────── */
function EnterScreen({ arena, countdown, currentUser }) {
  const myColor = currentUser?.avatar?.color || '#0e7490';
  const mode = MODES.find(m=>m.id===arena.mode);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:24,paddingTop:30,textAlign:'center'}}>
      <div style={{fontSize:13,fontWeight:700,fontFamily:'monospace',color:'rgba(100,116,139,0.6)',letterSpacing:'.12em'}}>
        {mode?.label?.toUpperCase()||arena.mode.toUpperCase()} MAÇI
      </div>

      {/* VS kart */}
      <div style={S.vsRow}>
        <div style={S.vsPlayer}>
          <div style={{...S.vsAvatar, borderColor:myColor, boxShadow:`0 0 20px ${myColor}50`}}>
            <span style={{fontSize:32}}>{currentUser?.avatar?.emoji||'🎓'}</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:myColor,marginTop:6}}>{currentUser?.username}</div>
          <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Sen</div>
        </div>

        <div style={S.vsCenter}>
          {countdown !== null
            ? <div style={{...S.cdNumber, color: countdown>1?'#ffd700':'#dc2626'}}>{countdown||'GO!'}</div>
            : <div style={S.vsText}>VS</div>
          }
        </div>

        <div style={S.vsPlayer}>
          <div style={{...S.vsAvatar, borderColor:'#ff6b35', boxShadow:'0 0 20px rgba(255,107,53,.5)'}}>
            <span style={{fontSize:32}}>🎓</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:'#ff6b35',marginTop:6}}>{arena.opponentName}</div>
          <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Rakip · Lv.{arena.opponentLevel}</div>
        </div>
      </div>

      {countdown === null && (
        <div style={{fontSize:12,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Hazırlanıyor...</div>
      )}
    </div>
  );
}

/* ─── Savaş ekranı ───────────────────────────────── */
function BattleScreen({ arena, onAnswer, onFlagGrab, currentUser }) {
  const {
    question, options, category, myScore, opScore, opponentName,
    round, totalRounds, myAnswer, opAnswered, result, correctIndex, timer, mode
  } = arena;

  const myColor = currentUser?.avatar?.color || '#0e7490';
  const timerColor = timer > 9 ? '#16a34a' : timer > 5 ? '#ffd700' : '#dc2626';
  const timerPct = (timer / 15) * 100;
  const modeInfo = MODES.find(m=>m.id===mode);

  if (!question) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,paddingTop:48,textAlign:'center'}}>
        <div style={{fontSize:36,animation:'cg-float 2s ease-in-out infinite'}}>{modeInfo?.icon||'⚔️'}</div>
        <div style={{fontSize:13,color:'rgba(100,116,139,0.6)'}}>Sonraki soru geliyor...</div>
      </div>
    );
  }

  /* Bayrak modu özel UI */
  if (mode === 'flag') {
    return <FlagGame arena={arena} onGrab={onFlagGrab} currentUser={currentUser} myColor={myColor}/>;
  }

  const LABELS = ['A','B','C','D'];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:620,margin:'0 auto',width:'100%'}}>
      {/* Skor şeridi */}
      <ScoreBar myScore={myScore} opScore={opScore} myName={currentUser?.username}
        opName={opponentName} myColor={myColor} round={round} totalRounds={totalRounds}/>

      {/* Kategori + Sayaç */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{...S.catBadge, borderColor:`${modeInfo?.color||'#0e7490'}30`, color: modeInfo?.color||'#0e7490'}}>
          {modeInfo?.icon} {category}
        </div>
        {!result && (
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {opAnswered && <span style={{fontSize:10,color:'#16a34a',fontFamily:'monospace'}}>✓ cevapladı</span>}
            <div style={{...S.timerBox, color:timerColor, borderColor:`${timerColor}40`}}>
              {timer}s
              <div style={{...S.timerFill, width:`${timerPct}%`, background:timerColor}}/>
            </div>
          </div>
        )}
      </div>

      {/* Soru */}
      <div style={S.questionBox}>{question}</div>

      {/* Şıklar */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
        {(options||[]).map((opt,i) => {
          let btn = S.optBtn;
          if (result) {
            if (i===correctIndex)                   btn = {...S.optBtn,...S.optCorrect};
            else if (i===myAnswer&&myAnswer!==correctIndex) btn = {...S.optBtn,...S.optWrong};
            else                                    btn = {...S.optBtn,opacity:.35};
          } else if (myAnswer!==null) {
            btn = i===myAnswer ? {...S.optBtn,...S.optSelected} : {...S.optBtn,opacity:.4};
          }
          return (
            <button key={i} onClick={()=>onAnswer(i)}
              disabled={myAnswer!==null||!!result} style={btn}>
              <span style={{...S.optLabel, background: i===correctIndex&&result?'rgba(57,211,83,.3)': i===myAnswer&&!result&&myAnswer!==null?`${myColor}30`:'rgba(241,245,249,0.8)'}}>{LABELS[i]}</span>
              <span style={{flex:1,textAlign:'left',fontSize:11,lineHeight:1.4}}>{opt}</span>
              {result && i===correctIndex && <span style={{color:'#16a34a',fontSize:14}}>✓</span>}
              {result && i===myAnswer && myAnswer!==correctIndex && <span style={{color:'#dc2626',fontSize:14}}>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Tur sonucu */}
      {result && (
        <div style={{...S.roundResult, borderColor: result.correct?'rgba(57,211,83,.3)':'rgba(255,56,96,.25)', background: result.correct?'rgba(57,211,83,.08)':'rgba(255,56,96,.06)'}}>
          <span style={{fontSize:24}}>{result.correct?'🎯':'😔'}</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:result.correct?'#16a34a':'#dc2626'}}>
              {result.correct?`Doğru! +${result.pts} puan`:'Yanlış — 0 puan'}
            </div>
            <div style={{fontSize:10,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>Sonraki soru 3 saniye sonra...</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bayrak Kapmaca Modu ────────────────────────── */
function FlagGame({ arena, onGrab, currentUser, myColor }) {
  const { myScore, opScore, opponentName, round, totalRounds, myAnswer, result, opAnswered, timer } = arena;
  const [flagVisible, setFlagVisible] = useState(false);
  const timeoutRef = useRef(null);

  // Bayrak rastgele 2-5s sonra çıksın
  useEffect(() => {
    if (result || myAnswer !== null) return;
    setFlagVisible(false);
    timeoutRef.current = setTimeout(() => setFlagVisible(true), 2000 + Math.random()*3000);
    return () => clearTimeout(timeoutRef.current);
  }, [round, result, myAnswer]);

  const grabbed = myAnswer !== null;
  const winner  = result?.correct;
  const lost    = result && !result.correct;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:500,margin:'0 auto',width:'100%',textAlign:'center'}}>
      <ScoreBar myScore={myScore} opScore={opScore} myName={currentUser?.username}
        opName={opponentName} myColor={myColor} round={round} totalRounds={totalRounds}/>

      <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>
        🚩 Bayrak Kapmaca — İlk kapan kazanır! ({round+1}/{totalRounds})
      </div>

      {/* Bayrak alanı */}
      <div style={S.flagArena}>
        {!result && !grabbed && (
          <div style={{fontSize:12,color:'rgba(100,116,139,0.6)',fontFamily:'monospace'}}>
            {flagVisible ? '' : '⏳ Bayrak çıkıyor...'}
          </div>
        )}
        {!result && flagVisible && !grabbed && (
          <button onClick={onGrab} style={S.flagBtn}>
            <span style={{fontSize:52, filter:'drop-shadow(0 0 20px rgba(255,56,96,.8))'}}>🚩</span>
            <div style={{fontSize:13,fontWeight:700,color:'#dc2626',fontFamily:'monospace',marginTop:8}}>KAPTIM!</div>
          </button>
        )}
        {grabbed && !result && (
          <div style={{fontSize:48, animation:'cg-float 1s ease-in-out infinite'}}>
            {opAnswered ? '⚡ Sonuç belirleniyor...' : '✋ Bekleniyor...'}
          </div>
        )}
        {result && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            <div style={{fontSize:52}}>{winner?'🏆':'💨'}</div>
            <div style={{fontSize:15,fontWeight:700,color:winner?'#16a34a':'#dc2626',fontFamily:'monospace'}}>
              {winner?'Bayrağı kapttın! +1 puan':'Rakip daha hızlıydı!'}
            </div>
            <div style={{fontSize:11,color:'rgba(100,116,139,0.6)'}}>Sonraki tur geliyor...</div>
          </div>
        )}
        {!flagVisible && !grabbed && !result && (
          <div style={{fontSize:48, animation:'cg-ping 2s ease-in-out infinite', opacity:.2}}>🚩</div>
        )}
      </div>
    </div>
  );
}

/* ─── Skor şeridi ─────────────────────────────────── */
function ScoreBar({ myScore, opScore, myName, opName, myColor, round, totalRounds }) {
  return (
    <div style={S.scoreBar}>
      <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
        <div style={{...S.scoreCircle, borderColor:myColor, boxShadow:`0 0 12px ${myColor}40`}}>
          <span style={{fontSize:11,fontWeight:900,color:myColor,fontFamily:'monospace'}}>{myScore}</span>
        </div>
        <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{myName}</div>
      </div>
      <div style={{textAlign:'center',padding:'0 12px'}}>
        <div style={{fontSize:9,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',letterSpacing:'.06em'}}>{round+1}/{totalRounds}</div>
        <div style={{fontSize:14,fontWeight:900,color:'rgba(100,116,139,0.6)'}}>VS</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flex:1,flexDirection:'row-reverse'}}>
        <div style={{...S.scoreCircle, borderColor:'#ff6b35', boxShadow:'0 0 12px rgba(255,107,53,.4)'}}>
          <span style={{fontSize:11,fontWeight:900,color:'#ff6b35',fontFamily:'monospace'}}>{opScore}</span>
        </div>
        <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'right'}}>{opName}</div>
      </div>
    </div>
  );
}

/* ─── Bitiş ekranı ───────────────────────────────── */
function EndScreen({ endData, arena, currentUser, onPlayAgain, onExit }) {
  const isDraw   = endData?.isDraw;
  const isWinner = endData?.isWinner;
  const scores   = endData?.finalScores || {};
  const mode     = MODES.find(m=>m.id===arena?.mode);
  const myName   = currentUser?.username;
  const opName   = arena?.opponentName;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,textAlign:'center',paddingTop:16,maxWidth:480,margin:'0 auto',width:'100%'}}>
      <div style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:'rgba(100,116,139,0.6)',letterSpacing:'.12em'}}>
        {mode?.label?.toUpperCase()} MAÇI SONA ERDİ
      </div>
      <div style={{fontSize:64}}>{isDraw?'🤝':isWinner?'🏆':'😔'}</div>
      <div style={{fontSize:24,fontWeight:900,fontFamily:'monospace',
        color:isDraw?'#ffd700':isWinner?'#16a34a':'#dc2626'}}>
        {isDraw?'BERABERLİK':isWinner?'ZAFERSİN!':'MAGLUP OLDUN'}
      </div>

      {/* Final skor */}
      <div style={S.endCard}>
        <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',padding:'16px 24px',gap:16}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginBottom:4}}>{myName}</div>
            <div style={{fontSize:40,fontWeight:900,color:'#0e7490',fontFamily:'monospace'}}>{scores[myName]??0}</div>
          </div>
          <div style={{fontSize:18,color:'rgba(100,116,139,0.6)',fontWeight:700}}>—</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:'rgba(100,116,139,0.6)',fontFamily:'monospace',marginBottom:4}}>{opName}</div>
            <div style={{fontSize:40,fontWeight:900,color:'#ff6b35',fontFamily:'monospace'}}>{scores[opName]??0}</div>
          </div>
        </div>
      </div>

      {/* XP */}
      {endData?.xpGained && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 24px',background:'rgba(57,211,83,.1)',border:'1px solid rgba(57,211,83,.3)',borderRadius:20}}>
          <span style={{fontSize:18}}>✨</span>
          <span style={{fontSize:14,fontWeight:900,color:'#16a34a',fontFamily:'monospace'}}>+{endData.xpGained} XP kazandın</span>
        </div>
      )}

      <div style={{display:'flex',gap:12,marginTop:8}}>
        <button onClick={onPlayAgain} style={{...S.bigBtn,fontSize:12,padding:'10px 20px'}}>🔄 Tekrar Oyna</button>
        <button onClick={onExit} style={{...S.bigBtn,background:'#f1f5f9',borderColor:'rgba(255,255,255,.15)',color:'rgba(100,116,139,0.6)',fontSize:12,padding:'10px 20px'}}>← Haritaya Dön</button>
      </div>
    </div>
  );
}

/* ─── Stiller ─────────────────────────────────────── */
const S = {
  backdrop: {position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.12)',backdropFilter:'blur(12px)'},
  dimension: {
    position:'relative',width:'100%',height:'100%',
    background:'radial-gradient(ellipse at 20% 10%, rgba(255,56,96,.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(100,116,139,0.15) 0%, transparent 50%), #050b1a',
    display:'flex',flexDirection:'column',overflow:'hidden',
  },
  particles: {position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'},
  particle: {
    position:'absolute',width:2,height:2,borderRadius:'50%',background:'rgba(100,116,139,0.15)',
    animation:'cg-particle 8s linear infinite',
  },
  topBar: {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 24px',borderBottom:'1px solid rgba(255,56,96,.1)',flexShrink:0},
  topLogo: {display:'flex',alignItems:'center',gap:10,fontSize:16},
  topTitle: {fontFamily:'monospace',fontWeight:900,fontSize:13,letterSpacing:'.14em',color:'#1e293b'},
  exitBtn: {fontSize:11,fontFamily:'monospace',fontWeight:700,color:'rgba(100,116,139,0.6)',background:'none',border:'1px solid #e2e8f0',borderRadius:7,padding:'6px 14px',cursor:'pointer'},
  notice: {margin:'8px 24px',padding:'8px 16px',background:'rgba(255,215,0,.1)',border:'1px solid rgba(255,215,0,.3)',borderRadius:8,fontSize:12,color:'#ffd700',fontFamily:'monospace',textAlign:'center',flexShrink:0},
  content: {flex:1,overflowY:'auto',padding:'20px 24px 24px'},
  arenaBadge: {fontSize:64,filter:'drop-shadow(0 0 30px rgba(255,56,96,.5))',animation:'cg-float 3s ease-in-out infinite'},
  heroTitle: {fontSize:'min(32px,6vw)',fontWeight:900,fontFamily:'monospace',letterSpacing:'.1em',color:'#1e293b'},
  heroTitle2: {fontSize:'min(28px,5.5vw)',fontWeight:900,fontFamily:'monospace',letterSpacing:'.12em',color:'#dc2626',textShadow:'0 0 30px rgba(255,56,96,.5)'},
  heroSub: {fontSize:12,color:'rgba(100,116,139,0.6)',marginTop:12,lineHeight:1.7},
  modeGrid: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',maxWidth:480},
  modePreview: {display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'14px',border:'1px solid',borderRadius:12},
  bigBtn: {padding:'13px 28px',background:'rgba(255,56,96,.15)',border:'1px solid rgba(255,56,96,.45)',borderRadius:12,color:'#dc2626',fontWeight:900,fontFamily:'monospace',fontSize:13,cursor:'pointer',transition:'all .2s',letterSpacing:'.04em'},
  twoCol: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'},
  col: {display:'flex',flexDirection:'column',gap:10},
  colTitle: {fontSize:11,fontWeight:700,fontFamily:'monospace',color:'rgba(100,116,139,0.6)',textTransform:'uppercase',letterSpacing:'.08em'},
  modeCard: {display:'flex',alignItems:'center',gap:12,padding:'11px 14px',border:'1.5px solid',borderRadius:11,cursor:'pointer',transition:'all .15s',background:'none',textAlign:'left'},
  playerCard2: {display:'flex',alignItems:'center',gap:10,padding:'9px 12px',border:'1px solid',borderRadius:10,cursor:'pointer',background:'none',transition:'all .15s',textAlign:'left',width:'100%'},
  pAvatar: {width:36,height:36,borderRadius:'50%',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',background:'#f1f5f9',flexShrink:0},
  pLv: {position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:7,fontSize:7,fontWeight:900,fontFamily:'monospace',display:'flex',alignItems:'center',justifyContent:'center'},
  empty: {textAlign:'center',padding:'20px',fontSize:11,color:'rgba(100,116,139,0.6)',lineHeight:1.7,border:'1px dashed rgba(241,245,249,0.8)',borderRadius:10},
  inviteOverlay: {position:'absolute',inset:0,background:'rgba(0,0,0,0.12)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,backdropFilter:'blur(4px)'},
  inviteCard: {background:'rgba(4,8,22,.98)',border:'1px solid rgba(255,215,0,.3)',borderRadius:18,padding:'28px 32px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',boxShadow:'0 30px 80px rgba(0,0,0,0.12)',maxWidth:340},
  acceptBtn: {padding:'11px 22px',background:'rgba(57,211,83,.15)',border:'1px solid rgba(57,211,83,.5)',borderRadius:9,color:'#16a34a',fontWeight:900,fontFamily:'monospace',fontSize:12,cursor:'pointer'},
  declineBtn: {padding:'11px 22px',background:'rgba(255,56,96,.1)',border:'1px solid rgba(255,56,96,.3)',borderRadius:9,color:'#dc2626',fontWeight:700,fontFamily:'monospace',fontSize:12,cursor:'pointer'},
  waitBar: {width:200,height:4,background:'#f1f5f9',borderRadius:2,overflow:'hidden'},
  waitFill: {height:'100%',background:'rgba(255,56,96,.5)',borderRadius:2},
  vsRow: {display:'flex',alignItems:'center',justifyContent:'center',gap:0,width:'100%',maxWidth:500,margin:'0 auto'},
  vsPlayer: {display:'flex',flexDirection:'column',alignItems:'center',flex:1},
  vsAvatar: {width:80,height:80,borderRadius:'50%',border:'3px solid',display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f5f9'},
  vsCenter: {padding:'0 24px'},
  vsText: {fontSize:28,fontWeight:900,fontFamily:'monospace',color:'rgba(100,116,139,0.6)',letterSpacing:'.08em'},
  cdNumber: {fontSize:56,fontWeight:900,fontFamily:'monospace',textShadow:'0 0 30px currentColor',animation:'cg-ping .6s ease-out'},
  scoreBar: {display:'flex',alignItems:'center',padding:'10px 14px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:12},
  scoreCircle: {width:36,height:36,borderRadius:'50%',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  catBadge: {fontSize:9,fontWeight:700,fontFamily:'monospace',border:'1px solid',borderRadius:6,padding:'3px 9px',textTransform:'uppercase',letterSpacing:'.06em'},
  timerBox: {fontSize:13,fontWeight:900,fontFamily:'monospace',border:'1px solid',borderRadius:8,padding:'3px 11px',position:'relative',overflow:'hidden',minWidth:44,textAlign:'center'},
  timerFill: {position:'absolute',bottom:0,left:0,height:2,transition:'width .9s linear'},
  questionBox: {padding:'16px 18px',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:12,fontSize:14,color:'#1e293b',lineHeight:1.6,fontWeight:500,textAlign:'center'},
  optBtn: {display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:10,color:'#475569',fontSize:11,cursor:'pointer',transition:'all .15s',textAlign:'left'},
  optLabel: {width:22,height:22,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,fontFamily:'monospace',flexShrink:0},
  optCorrect: {background:'rgba(57,211,83,.15)',borderColor:'rgba(57,211,83,.5)',color:'#16a34a'},
  optWrong:   {background:'rgba(255,56,96,.12)',borderColor:'rgba(255,56,96,.4)',color:'#dc2626'},
  optSelected:{background:'rgba(100,116,139,0.15)',borderColor:'rgba(100,116,139,0.15)',color:'#0e7490'},
  roundResult:{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',border:'1px solid',borderRadius:10},
  flagArena: {display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,border:'1px solid rgba(255,56,96,.15)',borderRadius:16,background:'rgba(255,56,96,.04)',gap:12},
  flagBtn: {display:'flex',flexDirection:'column',alignItems:'center',gap:0,padding:'20px 36px',background:'rgba(255,56,96,.15)',border:'2px solid rgba(255,56,96,.5)',borderRadius:16,cursor:'pointer',animation:'cg-ping-soft 1s ease-in-out infinite',transition:'all .1s',boxShadow:'0 0 30px rgba(255,56,96,.3)'},
  endCard: {width:'100%',background:'#f1f5f9',border:'1px solid rgba(241,245,249,0.8)',borderRadius:14},
};
