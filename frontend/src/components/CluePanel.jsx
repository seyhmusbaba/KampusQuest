import React, { useState } from 'react';

/* Rektörlük'te Kaşif Defteri — gizli nokta ipuçları */
export default function CluePanel({ hiddenSpots = [], totalSpots = 15, onClose }) {
  const [tab, setTab] = useState('clues'); // clues | found

  const found  = hiddenSpots.filter(h => h.found);
  const active = hiddenSpots.filter(h => !h.found);
  const pct    = Math.round((found.length / totalSpots) * 100);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e => e.stopPropagation()}>

        <div style={S.header}>
          <div style={S.titleRow}>
            <span style={S.title}>🗝️ KAŞİF DEFTERİ</span>
            <span style={S.sub}>Rektörlük Kaşif Notları</span>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* İlerleme */}
        <div style={S.progress}>
          <div style={S.progRow}>
            <span style={S.progText}>{found.length} / {totalSpots} gizli nokta</span>
            <span style={{ ...S.pct, color: pct >= 100 ? '#ffd700' : '#7c3aed' }}>{pct}%</span>
          </div>
          <div style={S.track}>
            <div style={{ ...S.fill, width: `${pct}%`, background: pct >= 100 ? '#ffd700' : '#7c3aed', boxShadow: `0 0 10px ${pct >= 100 ? '#ffd70080' : '#bf5fff60'}` }} />
          </div>
          {pct >= 100 && <div style={S.complete}>🏆 Tüm noktaları buldun! Efsane Kaşif rozetini kazandın!</div>}
        </div>

        {/* Tab */}
        <div style={S.tabs}>
          <Tab label={`📋 İpuçları (${active.length})`}  active={tab === 'clues'} onClick={() => setTab('clues')} />
          <Tab label={`✅ Bulunanlar (${found.length})`}  active={tab === 'found'} onClick={() => setTab('found')} />
        </div>

        {/* Liste */}
        <div style={S.list}>
          {tab === 'clues' && (
            active.length === 0
              ? <div style={S.empty}>🎉 Tüm gizli noktaları buldun!</div>
              : active.map(h => (
                <div key={h.id} style={S.clueCard}>
                  <div style={S.clueNum}>#{h.order || '?'}</div>
                  <div style={S.clueBody}>
                    <div style={S.clueName}>??? Bilinmeyen Nokta</div>
                    <div style={S.clueText}>💡 {h.clue}</div>
                  </div>
                  <div style={S.clueIcon}>❓</div>
                </div>
              ))
          )}

          {tab === 'found' && (
            found.length === 0
              ? <div style={S.empty}>Henüz gizli nokta bulamadın.<br />İpuçlarını oku ve haritayı keşfet!</div>
              : found.map(h => (
                <div key={h.id} style={{ ...S.clueCard, ...S.foundCard }}>
                  <div style={{ ...S.clueNum, color: '#ffd700' }}>#{h.order || '?'}</div>
                  <div style={S.clueBody}>
                    <div style={{ ...S.clueName, color: '#ffd700' }}>{h.name}</div>
                    <div style={S.clueText}>💡 {h.clue}</div>
                  </div>
                  <div style={{ fontSize: 20 }}>{h.icon}</div>
                </div>
              ))
          )}
        </div>

        <div style={S.footer}>
          🗺️ Haritada <b style={{ color: '#7c3aed' }}>mor titreyen</b> noktalara yaklaş ve keşfet
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...tabS.btn, ...(active ? tabS.on : {}) }}>
      {label}
    </button>
  );
}

const tabS = {
  btn: { flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(241,245,249,0.8)', cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, background: 'transparent', color: 'rgba(255,255,255,.3)', transition: 'all .2s' },
  on:  { background: 'rgba(191,95,255,.1)', color: '#7c3aed', borderColor: 'rgba(191,95,255,.3)' },
};

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
  panel:   { width: 'min(440px,95vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(191,95,255,.2)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.12)' },
  header:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(191,95,255,.1)', flexShrink: 0 },
  titleRow:{ display: 'flex', flexDirection: 'column', gap: 2 },
  title:   { fontSize: 13, fontWeight: 900, letterSpacing: '.1em', color: '#7c3aed', fontFamily: 'monospace' },
  sub:     { fontSize: 9, color: 'rgba(100,116,139,0.6)', fontFamily: 'monospace' },
  closeBtn:{ background: 'rgba(241,245,249,0.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progress:{ padding: '10px 16px', borderBottom: '1px solid rgba(241,245,249,0.8)', flexShrink: 0 },
  progRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  progText:{ fontSize: 11, color: 'rgba(100,116,139,0.6)', fontFamily: 'monospace' },
  pct:     { fontSize: 13, fontWeight: 700, fontFamily: 'monospace' },
  track:   { height: 5, background: 'rgba(241,245,249,0.8)', borderRadius: 3, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 3, transition: 'width .7s ease' },
  complete:{ fontSize: 10, color: '#ffd700', fontFamily: 'monospace', marginTop: 5, textAlign: 'center' },
  tabs:    { display: 'flex', gap: 5, padding: '8px 12px', borderBottom: '1px solid rgba(241,245,249,0.8)', flexShrink: 0 },
  list:    { flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 },
  empty:   { textAlign: 'center', color: 'rgba(100,116,139,0.6)', padding: '30px 10px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8 },
  clueCard:{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(191,95,255,.05)', border: '1px solid rgba(191,95,255,.12)', borderRadius: 10 },
  foundCard:{ background: 'rgba(255,215,0,.05)', borderColor: 'rgba(255,215,0,.2)' },
  clueNum: { fontSize: 10, fontFamily: 'monospace', color: 'rgba(191,95,255,.5)', fontWeight: 700, flexShrink: 0, width: 24 },
  clueBody:{ flex: 1, minWidth: 0 },
  clueName:{ fontSize: 12, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', marginBottom: 3 },
  clueText:{ fontSize: 10, color: 'rgba(100,116,139,0.6)', fontFamily: 'monospace', lineHeight: 1.5 },
  clueIcon:{ fontSize: 18, flexShrink: 0 },
  footer:  { padding: '8px 16px', borderTop: '1px solid rgba(241,245,249,0.8)', fontSize: 10, color: 'rgba(100,116,139,0.6)', fontFamily: 'monospace', textAlign: 'center', flexShrink: 0 },
};
