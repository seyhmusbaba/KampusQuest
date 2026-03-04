import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const FACULTIES = [
  'Eğitim Fakültesi','Fen ve Edebiyat Fakültesi','Veteriner Fakültesi',
  'Ziraat Fakültesi','Tıp Fakültesi','Diş Hekimliği Fakültesi',
  'Güzel Sanatlar Fakültesi','Sağlık Bilimleri Yüksekokulu','İİBF',
];

const AVATAR_SETS = {
  'Akademik': ['🎓','👨‍🎓','👩‍🎓','📚','🔬','🧪','🧬','💡','🔭','🖥️','📐','⚗️'],
  'Hayvanlar': ['🦊','🐺','🦁','🐯','🦅','🐉','🦋','🦜','🐬','🦈','🐸','🦉'],
  'Güç': ['⚡','🔥','💫','🌟','✨','💥','🌊','🌪️','❄️','🌈','☄️','🎯'],
  'Karakter': ['😎','🤖','👾','🎭','🥷','🧙','🦸','🦹','🧑‍🚀','🥸','😈','🤠'],
};

const COLORS = [
  '#0ea5e9','#16a34a','#fbbf24','#f97316',
  '#a855f7','#ef4444','#06b6d4','#ec4899',
  '#6366f1','#84cc16','#8b5cf6','#14b8a6',
];

function MapPreview({ emoji, color }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{fontSize:9,color:'#94a3b8',fontFamily:'monospace',letterSpacing:'.08em'}}>HARİTADA GÖRÜNÜM</div>
      <div style={{position:'relative',width:58,height:58}}>
        <div style={{position:'absolute',inset:-6,borderRadius:'50%',border:`2px dashed ${color}`,opacity:.4}}/>
        <div style={{position:'absolute',inset:-3,borderRadius:'50%',border:`1.5px solid ${color}`,opacity:.6}}/>
        <div style={{width:58,height:58,borderRadius:'50%',border:`3px solid ${color}`,
          background:`radial-gradient(circle at 35% 30%, ${color}22, #f8fafc 65%)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 0 0 3px white, 0 2px 12px rgba(0,0,0,.15), 0 0 16px ${color}50`,
          position:'relative',zIndex:1}}>
          <span style={{fontSize:26}}>{emoji}</span>
        </div>
        <div style={{position:'absolute',bottom:-2,right:-2,width:18,height:18,borderRadius:9,
          background:color,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:9,fontWeight:900,fontFamily:'monospace',color:'white',
          border:'2px solid white',boxShadow:`0 1px 4px rgba(0,0,0,.2)`,zIndex:2}}>1</div>
      </div>
      <div style={{fontSize:9,color:color,fontFamily:'monospace',fontWeight:700}}>yeni oyuncu</div>
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab]       = useState('login');
  const [form, setForm]     = useState({ username:'', email:'', password:'', faculty:'', emoji:'🎓', color:'#0ea5e9' });
  const [avatarCat, setAvatarCat] = useState('Akademik');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);
  const [emailHint, setEmailHint] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleEmailChange = v => {
    set('email', v);
    if (v.includes('@')) {
      const ok = v.endsWith('@ogr.mku.edu.tr') || v.endsWith('@mku.edu.tr');
      setEmailHint(ok ? '✅ MKÜ e-postası geçerli' : '⚠️ Sadece @ogr.mku.edu.tr veya @mku.edu.tr');
    } else {
      setEmailHint('');
    }
  };

  const submit = async e => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          username: form.username, email: form.email, password: form.password,
          faculty: form.faculty, avatar: { emoji: form.emoji, color: form.color },
        });
      }
    } catch (ex) {
      if (!ex.response) setErr('Sunucuya ulaşılamıyor. Backend çalışıyor mu?');
      else setErr(ex.response?.data?.error || ex.message || 'Bir hata oluştu');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.bg}>
      <div style={S.grid}/>
      <div style={S.glow1}/><div style={S.glow2}/>
      <div style={S.wrap}>
        <div style={S.logo}>
          <img src="/mku_logo.png" alt="MKÜ" style={S.logoImg}/>
          <div>
            <div style={S.logoTitle}>KampüsQuest</div>
            <div style={S.logoSub}>Hatay Mustafa Kemal Üniversitesi</div>
            <div style={{...S.logoSub, color:'#8b1a1a', marginTop:1}}>Kampüs Keşif ve Rekabet Oyunu</div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.tabs}>
            {['login','register'].map(t => (
              <button key={t} style={{...S.tab,...(tab===t?S.tabOn:{})}}
                onClick={()=>{setTab(t);setErr('');setEmailHint('');}}>
                {t==='login' ? '🔑 GİRİŞ' : '🌟 KAYIT'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={S.form}>
            {tab === 'register' && (
              <>
                <div style={S.fieldWrap}>
                  <label style={S.label}>KULLANICI ADI</label>
                  <div style={S.inputWrap}>
                    <span style={S.inputIcon}>👤</span>
                    <input type="text" placeholder="kampuskasfifi" value={form.username}
                      onChange={e=>set('username',e.target.value)} style={S.input} required/>
                  </div>
                </div>

                <div style={S.avatarSection}>
                  <div style={S.avatarLabel}>AVATAR OLUŞTUR</div>
                  <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:10}}>
                    <MapPreview emoji={form.emoji} color={form.color}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:'#94a3b8',fontFamily:'monospace',marginBottom:5}}>RENK SEÇ</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {COLORS.map(hex=>(
                          <button key={hex} type="button"
                            style={{width:26,height:26,borderRadius:'50%',
                              border:`3px solid ${form.color===hex?'white':'transparent'}`,
                              outline:`2px solid ${form.color===hex?hex:'transparent'}`,
                              background:hex,cursor:'pointer',transition:'all .15s',
                              transform:form.color===hex?'scale(1.2)':'scale(1)'}}
                            onClick={()=>set('color',hex)}/>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:4,marginBottom:7,flexWrap:'wrap'}}>
                    {Object.keys(AVATAR_SETS).map(cat=>(
                      <button key={cat} type="button"
                        style={{fontSize:9,fontFamily:'monospace',fontWeight:700,padding:'3px 8px',borderRadius:6,
                          border:`1px solid ${avatarCat===cat?form.color:'rgba(100,116,139,.2)'}`,
                          background:avatarCat===cat?`${form.color}14`:'transparent',
                          color:avatarCat===cat?form.color:'#64748b',cursor:'pointer',transition:'all .15s'}}
                        onClick={()=>setAvatarCat(cat)}>{cat}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {(AVATAR_SETS[avatarCat]||[]).map(em=>(
                      <button key={em} type="button"
                        style={{width:38,height:38,borderRadius:9,cursor:'pointer',fontSize:19,
                          display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',
                          border:`2px solid ${form.emoji===em?form.color:'rgba(100,116,139,.15)'}`,
                          background:form.emoji===em?`${form.color}12`:'rgba(100,116,139,.04)',
                          transform:form.emoji===em?'scale(1.12)':'scale(1)'}}
                        onClick={()=>set('emoji',em)}>{em}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={S.fieldWrap}>
              <label style={S.label}>E-POSTA{tab==='register'?' (MKÜ)':''}</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>📧</span>
                <input type="email"
                  placeholder={tab==='register'?'ogrenci@ogr.mku.edu.tr':'e-posta adresiniz'}
                  value={form.email}
                  onChange={e=>tab==='register'?handleEmailChange(e.target.value):set('email',e.target.value)}
                  style={{...S.input,
                    borderColor:emailHint.startsWith('✅')?'rgba(22,163,74,.5)':
                                emailHint.startsWith('⚠️')?'rgba(239,68,68,.4)':'rgba(100,116,139,.2)'}}
                  required/>
              </div>
              {emailHint && (
                <div style={{fontSize:10,fontFamily:'monospace',marginTop:2,
                  color:emailHint.startsWith('✅')?'#16a34a':'#dc2626'}}>{emailHint}</div>
              )}
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>ŞİFRE</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔒</span>
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={e=>set('password',e.target.value)} style={S.input} required/>
              </div>
            </div>

            {tab==='register' && (
              <div style={S.fieldWrap}>
                <label style={S.label}>FAKÜLTENİZ (opsiyonel)</label>
                <select value={form.faculty} onChange={e=>set('faculty',e.target.value)} style={S.select}>
                  <option value="">Seçiniz...</option>
                  {FACULTIES.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}

            {tab==='register' && (
              <div style={S.emailNote}>
                🔒 Sadece <b>@ogr.mku.edu.tr</b> veya <b>@mku.edu.tr</b> uzantılı e-postalar kabul edilir
              </div>
            )}

            {err && <div style={S.err}>⚠️ {err}</div>}

            <button type="submit" disabled={loading} style={{...S.submit,opacity:loading?.65:1}}>
              {loading ? '⏳ İŞLENİYOR...' : tab==='login' ? '🔑 GİRİŞ YAP →' : '🌟 HESAP OLUŞTUR →'}
            </button>
          </form>
        </div>

        <div style={S.campusNote}>Tayfur Sökmen Kampüsü · Alahan, Antakya, Hatay</div>
      </div>
    </div>
  );
}

const S = {
  bg:{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
    background:'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#fff7f0 100%)',
    position:'relative',overflow:'hidden' },
  grid:{ position:'absolute',inset:0,
    backgroundImage:'linear-gradient(rgba(139,26,26,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,26,26,.03) 1px,transparent 1px)',
    backgroundSize:'40px 40px',pointerEvents:'none' },
  glow1:{ position:'absolute',top:'-15%',left:'-5%',width:'50vw',height:'50vw',borderRadius:'50%',
    background:'radial-gradient(circle,rgba(139,26,26,.06),transparent 70%)',pointerEvents:'none' },
  glow2:{ position:'absolute',bottom:'-15%',right:'-5%',width:'45vw',height:'45vw',borderRadius:'50%',
    background:'radial-gradient(circle,rgba(14,165,233,.06),transparent 70%)',pointerEvents:'none' },
  wrap:{ position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',
    gap:20,padding:'24px 16px',width:'100%',maxWidth:520 },
  logo:{ display:'flex',alignItems:'center',gap:14 },
  logoImg:{ width:62,height:62,borderRadius:'50%',filter:'drop-shadow(0 4px 12px rgba(139,26,26,.35))' },
  logoTitle:{ fontSize:22,fontWeight:900,letterSpacing:'.08em',color:'#1e293b',fontFamily:'monospace' },
  logoSub:{ fontSize:11,color:'#64748b',letterSpacing:'.04em',marginTop:2,fontFamily:'monospace' },
  card:{ width:'100%',background:'rgba(255,255,255,.96)',
    border:'1px solid rgba(100,116,139,.14)',borderRadius:20,padding:'26px 26px 22px',
    backdropFilter:'blur(16px)',boxShadow:'0 20px 60px rgba(0,0,0,.08)' },
  tabs:{ display:'flex',gap:6,marginBottom:22,background:'rgba(100,116,139,.08)',borderRadius:10,padding:4 },
  tab:{ flex:1,padding:'9px 0',borderRadius:8,border:'none',cursor:'pointer',
    fontFamily:'monospace',fontSize:12,fontWeight:700,letterSpacing:'.08em',
    background:'transparent',color:'#94a3b8',transition:'all .2s' },
  tabOn:{ background:'white',color:'#8b1a1a',boxShadow:'0 2px 8px rgba(0,0,0,.10)' },
  form:{ display:'flex',flexDirection:'column',gap:14 },
  fieldWrap:{ display:'flex',flexDirection:'column',gap:5 },
  label:{ fontSize:9,fontWeight:700,letterSpacing:'.12em',color:'#94a3b8',fontFamily:'monospace' },
  inputWrap:{ position:'relative' },
  inputIcon:{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16 },
  input:{ width:'100%',padding:'11px 12px 11px 40px',background:'rgba(100,116,139,.04)',
    border:'1px solid rgba(100,116,139,.2)',borderRadius:10,color:'#1e293b',
    fontFamily:'monospace',fontSize:13,outline:'none',boxSizing:'border-box' },
  select:{ width:'100%',padding:'11px 12px',background:'rgba(100,116,139,.04)',
    border:'1px solid rgba(100,116,139,.2)',borderRadius:10,color:'#1e293b',
    fontFamily:'monospace',fontSize:12,outline:'none' },
  avatarSection:{ background:'rgba(100,116,139,.04)',border:'1px solid rgba(100,116,139,.12)',
    borderRadius:12,padding:'12px' },
  avatarLabel:{ fontSize:9,fontWeight:700,letterSpacing:'.12em',color:'#94a3b8',
    fontFamily:'monospace',marginBottom:10 },
  emailNote:{ fontSize:10,fontFamily:'monospace',color:'#94a3b8',textAlign:'center',
    padding:'8px',background:'rgba(139,26,26,.04)',borderRadius:8,lineHeight:1.6,
    border:'1px solid rgba(139,26,26,.08)' },
  err:{ background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',
    borderRadius:8,padding:'9px 12px',color:'#dc2626',fontSize:12,fontFamily:'monospace' },
  submit:{ padding:'13px',background:'linear-gradient(135deg,#8b1a1a,#b91c1c)',
    border:'none',borderRadius:11,color:'white',fontFamily:'monospace',fontSize:13,
    fontWeight:700,letterSpacing:'.08em',cursor:'pointer',marginTop:4,
    boxShadow:'0 4px 16px rgba(139,26,26,.35)' },
  campusNote:{ fontSize:10,color:'#94a3b8',fontFamily:'monospace',letterSpacing:'.06em' },
};
