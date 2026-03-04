import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CAMPUS = {
  center: [36.3303718, 36.1963282],
  bounds: { S:36.3235, N:36.3375, W:36.1890, E:36.2025 },
  zoom: 17,
};

export const ALL_LOCATIONS = [
  { id:'library',        chatRoomId:'chat_library',        name:'Merkez Kütüphane',    icon:'📚', lat:36.3286885, lng:36.1941526, r:16,  xp:50,  color:'#0ea5e9', isXpZone:true  },
  { id:'cafeteria',      chatRoomId:'chat_cafeteria',       name:'Merkez Yemekhane',    icon:'🍽️', lat:36.3303718, lng:36.1963282, r:16,  xp:30,  color:'#f97316', isXpZone:true  },
  { id:'ziraat',         chatRoomId:'chat_ziraat',          name:'Ziraat Fakültesi',    icon:'🌾', lat:36.3250892, lng:36.1959193, r:18,  xp:60,  color:'#16a34a', isXpZone:true  },
  { id:'rektorluk',      chatRoomId:'chat_central',         name:'Rektörlük',           icon:'🏛️', lat:36.3334261, lng:36.1984989, r:15,  xp:20,  color:'#d97706', isXpZone:true  },
  { id:'ogrenci_isleri', chatRoomId:'chat_student_affairs', name:'Öğrenci İşleri',      icon:'📋', lat:36.3336000, lng:36.1977000, r:12,  xp:100, color:'#8b5cf6', isXpZone:true  },
  { id:'egitim',         chatRoomId:'chat_egitim',          name:'Eğitim Fakültesi',    icon:'🎓', lat:36.3311481, lng:36.1950196, r:14,  xp:15,  color:'#0891b2', isXpZone:false },
  { id:'fen_edebiyat',   chatRoomId:'chat_fen_edebiyat',    name:'Fen-Edebiyat',        icon:'🔬', lat:36.3274557, lng:36.1970875, r:14,  xp:15,  color:'#15803d', isXpZone:false },
  { id:'veteriner',      chatRoomId:'chat_veteriner',       name:'Veteriner Fak.',      icon:'🐾', lat:36.3295837, lng:36.1979366, r:13,  xp:15,  color:'#065f46', isXpZone:false },
  { id:'tip',            chatRoomId:'chat_tip',             name:'Tıp Fakültesi',       icon:'🏥', lat:36.3350053, lng:36.1981479, r:14,  xp:15,  color:'#dc2626', isXpZone:false },
  { id:'dis_hekimligi',  chatRoomId:'chat_dis',             name:'Diş Hekimliği',       icon:'🦷', lat:36.3348000, lng:36.1974000, r:11,  xp:15,  color:'#db2777', isXpZone:false },
  { id:'saglik_yo',      chatRoomId:'chat_saglik',          name:'Sağlık YO',           icon:'⚕️', lat:36.3277828, lng:36.1942733, r:12,  xp:15,  color:'#0f766e', isXpZone:false },
  { id:'kyk_yurt',       chatRoomId:'chat_kyk',             name:'KYK Yurdu',           icon:'🏠', lat:36.3279630, lng:36.1922430, r:15,  xp:10,  color:'#b45309', isXpZone:false },
  { id:'spor',           chatRoomId:'chat_spor',            name:'Spor Salonu',         icon:'⚽', lat:36.3342677, lng:36.1954726, r:14,  xp:20,  color:'#0284c7', isXpZone:false },
  { id:'guzel_sanatlar', chatRoomId:'chat_sanatlar',        name:'Güzel Sanatlar',      icon:'🎨', lat:36.3307000, lng:36.1946000, r:11,  xp:15,  color:'#7c3aed', isXpZone:false },
  { id:'iibf',           chatRoomId:'chat_iibf',            name:'İİBF',                icon:'📊', lat:36.3297000, lng:36.1938000, r:12,  xp:15,  color:'#c2410c', isXpZone:false },
  { id:'fen_ens',        chatRoomId:'chat_fen_ens',         name:'Fen Bilimleri Ens.',  icon:'🧪', lat:36.3271728, lng:36.1940286, r:11,  xp:15,  color:'#6d28d9', isXpZone:false },
];

/* ─── Kampüs Yolları ─────────────────────────────────────── */
const ROADS = [
  [[36.3258,36.1963],[36.3272,36.1962],[36.3287,36.1960],[36.3300,36.1960],[36.3315,36.1962],[36.3330,36.1966],[36.3345,36.1973],[36.3360,36.1982]],
  [[36.3294,36.1935],[36.3298,36.1948],[36.3300,36.1963],[36.3303,36.1977],[36.3307,36.1990],[36.3310,36.2000]],
  [[36.3320,36.1968],[36.3326,36.1974],[36.3332,36.1980],[36.3340,36.1985]],
  [[36.3274,36.1937],[36.3278,36.1941],[36.3285,36.1942]],
  [[36.3279,36.1922],[36.3281,36.1932],[36.3284,36.1942]],
  [[36.3310,36.1949],[36.3322,36.1952],[36.3335,36.1956],[36.3344,36.1956]],
  [[36.3293,36.1960],[36.3296,36.1972],[36.3298,36.1980]],
];

/* ─── Bina Footprint Poligonları ─────────────────────────── */
const FOOTPRINTS = [
  { id:'rektorluk',     color:'#ffd700', poly:[[36.3330,36.1980],[36.3337,36.1980],[36.3338,36.1989],[36.3331,36.1990],[36.3329,36.1985]] },
  { id:'library',       color:'#00f5ff', poly:[[36.3283,36.1937],[36.3290,36.1937],[36.3291,36.1946],[36.3283,36.1946]] },
  { id:'cafeteria',     color:'#ff6b35', poly:[[36.3299,36.1959],[36.3308,36.1959],[36.3309,36.1967],[36.3299,36.1967]] },
  { id:'ziraat',        color:'#39d353', poly:[[36.3246,36.1954],[36.3256,36.1954],[36.3257,36.1964],[36.3246,36.1964]] },
  { id:'egitim',        color:'#4fc3f7', poly:[[36.3307,36.1946],[36.3316,36.1946],[36.3317,36.1954],[36.3307,36.1954]] },
  { id:'fen_edebiyat',  color:'#81c784', poly:[[36.3270,36.1966],[36.3279,36.1966],[36.3280,36.1975],[36.3270,36.1975]] },
  { id:'veteriner',     color:'#a5d6a7', poly:[[36.3291,36.1975],[36.3301,36.1975],[36.3301,36.1984],[36.3291,36.1984]] },
  { id:'tip',           color:'#ef9a9a', poly:[[36.3345,36.1977],[36.3355,36.1977],[36.3356,36.1986],[36.3345,36.1986]] },
  { id:'spor',          color:'#80deea', poly:[[36.3338,36.1950],[36.3348,36.1950],[36.3349,36.1959],[36.3338,36.1959]] },
  { id:'saglik_yo',     color:'#80cbc4', poly:[[36.3274,36.1938],[36.3282,36.1938],[36.3282,36.1947],[36.3274,36.1947]] },
  { id:'kyk_yurt',      color:'#ffcc80', poly:[[36.3275,36.1918],[36.3284,36.1918],[36.3285,36.1927],[36.3275,36.1927]] },
  { id:'guzel_sanatlar',color:'#ce93d8', poly:[[36.3303,36.1946],[36.3312,36.1946],[36.3312,36.1954],[36.3303,36.1954]] },
  { id:'iibf',          color:'#ffab91', poly:[[36.3294,36.1941],[36.3302,36.1941],[36.3303,36.1949],[36.3294,36.1949]] },
  { id:'fen_ens',       color:'#b39ddb', poly:[[36.3268,36.1937],[36.3276,36.1937],[36.3276,36.1944],[36.3268,36.1944]] },
];

/* ─── Yeşil Alanlar ──────────────────────────────────────── */
const GREENS = [
  [[36.3298,36.1957],[36.3308,36.1957],[36.3308,36.1968],[36.3298,36.1968]],
  [[36.3326,36.1978],[36.3335,36.1978],[36.3335,36.1987],[36.3326,36.1987]],
  [[36.3252,36.1948],[36.3260,36.1948],[36.3260,36.1957],[36.3252,36.1957]],
  [[36.3340,36.1963],[36.3348,36.1963],[36.3348,36.1972],[36.3340,36.1972]],
];

/* ─── SVG Binalar ────────────────────────────────────────── */
/* ─── 3D İzometrik Binalar ─ TW=8 TH=4 ZS=10 OX=80 OY=148 ──────
   Tüm koordinatlar 0-160 x 0-180 viewBox içine sığar.
   Sol yüz: açık | Sağ yüz: koyu gölge | Üst: en açık
──────────────────────────────────────────────────────────────── */
const _TW=8,_TH=4,_ZS=10;
function _ip(x,y,z,ox,oy){return{px:(x-y)*_TW+ox,py:(x+y)*_TH-z*_ZS+oy};}
function _box(ox,oy,x,y,z,w,d,h){
  const v={
    BLF:_ip(x,y,z,ox,oy),    BRF:_ip(x+w,y,z,ox,oy),
    BRB:_ip(x+w,y+d,z,ox,oy),BLB:_ip(x,y+d,z,ox,oy),
    TLF:_ip(x,y,z+h,ox,oy),  TRF:_ip(x+w,y,z+h,ox,oy),
    TRB:_ip(x+w,y+d,z+h,ox,oy),TLB:_ip(x,y+d,z+h,ox,oy),
  };
  const j=q=>q.px+','+q.py;
  return{top:[v.TLF,v.TRF,v.TRB,v.TLB].map(j).join(' '),left:[v.BLF,v.TLF,v.TLB,v.BLB].map(j).join(' '),right:[v.BLF,v.BRF,v.TRF,v.TLF].map(j).join(' ')};
}
// Pencerecikler — y sabit=sağ yüz, x sabit=sol yüz
function _wR(ox,oy,x,ys,ye,zb,zt,lit){
  const v=[_ip(x,ys,zb,ox,oy),_ip(x,ye,zb,ox,oy),_ip(x,ye,zt,ox,oy),_ip(x,ys,zt,ox,oy)];
  const j=q=>q.px+','+q.py,f=lit?'#fffde7':'#e3f2fd';
  return '<polygon points="'+v.map(j).join(' ')+'" fill="'+f+'" stroke="#00000020" stroke-width=".5"/>'+(lit?'<polygon points="'+v.map(j).join(' ')+'" fill="#ffd70022"/>':'');
}
function _wL(ox,oy,xs,xe,y,zb,zt,lit){
  const v=[_ip(xs,y,zb,ox,oy),_ip(xe,y,zb,ox,oy),_ip(xe,y,zt,ox,oy),_ip(xs,y,zt,ox,oy)];
  const j=q=>q.px+','+q.py,f=lit?'#fffde7':'#c8e6c9';
  return '<polygon points="'+v.map(j).join(' ')+'" fill="'+f+'" stroke="#00000020" stroke-width=".5"/>';
}
function _h(hex){const n=parseInt(hex.replace('#',''),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
function _lt(hex,a){const{r,g,b}=_h(hex);return'rgb('+Math.min(255,r+a)+','+Math.min(255,g+a)+','+Math.min(255,b+a)+')';}
function _dk(hex,a){const{r,g,b}=_h(hex);return'rgb('+Math.max(0,r-a)+','+Math.max(0,g-a)+','+Math.max(0,b-a)+')';}
function _a(hex,a){const{r,g,b}=_h(hex);return'rgba('+r+','+g+','+b+','+a+')';}

function buildingSVG(id,col){
  const W=160,H=180,OX=80,OY=148,e=_dk(col,58);
  const gd='<defs>'
    +'<linearGradient id="t'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="'+_lt(col,82)+'"/><stop offset="100%" stop-color="'+_lt(col,42)+'"/></linearGradient>'
    +'<linearGradient id="l'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+_lt(col,28)+'"/><stop offset="100%" stop-color="'+col+'"/></linearGradient>'
    +'<linearGradient id="r'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+_dk(col,2)+'"/><stop offset="100%" stop-color="'+_dk(col,52)+'"/></linearGradient>'
    +'<filter id="f'+id+'"><feDropShadow dx="1" dy="2" stdDeviation="2.5" flood-color="'+_a(col,.3)+'"/></filter></defs>';
  const sh=(rx,ry)=>'<ellipse cx="'+(OX+3)+'" cy="'+(OY+1)+'" rx="'+rx+'" ry="'+ry+'" fill="'+_a(col,.11)+'"/>';
  const face=(pts,fill,stroke,sw)=>'<polygon points="'+pts+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';

  const M={
    rektorluk:(()=>{
      const mn=_box(OX,OY,-5,-3,0,10,6,5.5);
      const wL=_box(OX,OY,-7,-2,0,2,4,4);
      const wR=_box(OX,OY,5,-2,0,2,4,4);
      const tw=_box(OX,OY,-1.5,-1,5.5,3,2,5.5);
      const tr=_box(OX,OY,-1.5,-1,11,3,2,0.8);
      let ws='';
      [[-2.5,-1.4,0.8,2.2,true],[-1.0,0.0,0.8,2.2,false],[0.5,1.5,0.8,2.2,true],[2.0,3.0,0.8,2.2,false],
       [-2.5,-1.4,3.2,4.8,false],[2.0,3.0,3.2,4.8,true]].forEach(p=>ws+=_wR(OX,OY,-5,p[0],p[1],p[2],p[3],p[4]));
      [[-4.5,-3.5,0.8,2.2,true],[-3.0,-2.0,0.8,2.2,false],[-4.5,-3.5,3.2,4.8,false],[-3.0,-2.0,3.2,4.8,true]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],-3,p[2],p[3],p[4]));
      ws+=_wR(OX,OY,-1.5,-0.9,0.1,6.8,9,true); ws+=_wR(OX,OY,-1.5,0.5,1.5,6.8,9,false);
      const fl=_ip(0,0,11.9,OX,OY),fe=_ip(0,0,14.2,OX,OY),f1=_ip(1.2,0,13.8,OX,OY),f2=_ip(1.2,0,12,OX,OY);
      let cls=''; [-3.8,-1.2,1.2].forEach(x=>{const a=_ip(x,-3,0,OX,OY),b=_ip(x,-3,2.6,OX,OY);cls+='<line x1="'+a.px+'" y1="'+a.py+'" x2="'+b.px+'" y2="'+b.py+'" stroke="'+_dk(col,35)+'" stroke-width="1.5" opacity=".6"/>';});
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(72,9)
        +face(wL.top,'url(#t'+id+')',e,'1')+face(wL.right,'url(#r'+id+')',e,'1')+face(wL.left,'url(#l'+id+')',e,'1')
        +face(wR.top,'url(#t'+id+')',e,'1')+face(wR.right,'url(#r'+id+')',e,'1')+face(wR.left,'url(#l'+id+')',e,'1')
        +face(mn.top,'url(#t'+id+')',e,'1.3 filter="url(#f'+id+')"')+face(mn.right,'url(#r'+id+')',e,'1.3')+face(mn.left,'url(#l'+id+')',e,'1.3')
        +ws+cls
        +face(tw.top,_lt(col,88),e,'1.1')+face(tw.right,_dk(col,18),e,'1.1')+face(tw.left,_lt(col,42),e,'1.1')
        +face(tr.top,_lt(col,72),e,'.9')+face(tr.right,_dk(col,5),e,'.9')+face(tr.left,_lt(col,50),e,'.9')
        +'<line x1="'+fl.px+'" y1="'+fl.py+'" x2="'+fe.px+'" y2="'+fe.py+'" stroke="'+e+'" stroke-width="1.6"/>'
        +'<polygon points="'+fe.px+','+fe.py+' '+f1.px+','+f1.py+' '+f2.px+','+f2.py+'" fill="#ef4444"/>'
        +'</svg>';
    })(),
    library:(()=>{
      const bs=_box(OX,OY,-4.5,-3,0,9,6,5.2);
      const rL=[_ip(-4.5,-3,5.2,OX,OY),_ip(-4.5,3,5.2,OX,OY),_ip(0,3,8.2,OX,OY),_ip(0,-3,8.2,OX,OY)];
      const rR=[_ip(4.5,-3,5.2,OX,OY),_ip(4.5,3,5.2,OX,OY),_ip(0,3,8.2,OX,OY),_ip(0,-3,8.2,OX,OY)];
      const aF=[_ip(-4.5,-3,5.2,OX,OY),_ip(4.5,-3,5.2,OX,OY),_ip(0,-3,8.2,OX,OY)];
      const aB=[_ip(-4.5,3,5.2,OX,OY),_ip(4.5,3,5.2,OX,OY),_ip(0,3,8.2,OX,OY)];
      const s=q=>q.px+','+q.py;
      let ws='';
      [[-2.5,-1.4,0.8,2.5,true],[-1.0,0.0,0.8,2.5,false],[0.5,1.5,0.8,2.5,true],[2.0,3.0,0.8,2.5,false],
       [-2.5,-1.4,3.2,4.6,false],[0.5,1.5,3.2,4.6,true]].forEach(p=>ws+=_wR(OX,OY,-4.5,p[0],p[1],p[2],p[3],p[4]));
      [[-4.0,-3.0,0.8,2.5,false],[-2.5,-1.5,0.8,2.5,true],[-4.0,-3.0,3.2,4.6,true],[-2.5,-1.5,3.2,4.6,false]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],-3,p[2],p[3],p[4]));
      const dr=[_ip(-0.9,-3,0,OX,OY),_ip(0.9,-3,0,OX,OY),_ip(0.9,-3,2.8,OX,OY),_ip(-0.9,-3,2.8,OX,OY)];
      const rc=_ip(0,-3,7,OX,OY);
      const rR2=_ip(0,-3,8.2,OX,OY);
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(60,7)
        +face(bs.top,'url(#t'+id+')',e,'1.3')+face(bs.right,'url(#r'+id+')',e,'1.3')+face(bs.left,'url(#l'+id+')',e,'1.3')
        +ws+'<polygon points="'+dr.map(s).join(' ')+'" fill="'+_dk(col,40)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<polygon points="'+rL.map(s).join(' ')+'" fill="'+_lt(col,52)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<polygon points="'+rR.map(s).join(' ')+'" fill="'+_lt(col,35)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<polygon points="'+aF.map(s).join(' ')+'" fill="'+_lt(col,65)+'" stroke="'+e+'" stroke-width="1"/>'
        +'<polygon points="'+aB.map(s).join(' ')+'" fill="'+_dk(col,5)+'" stroke="'+e+'" stroke-width="1"/>'
        +'<line x1="'+rR2.px+'" y1="'+rR2.py+'" x2="'+_ip(0,3,8.2,OX,OY).px+'" y2="'+_ip(0,3,8.2,OX,OY).py+'" stroke="'+e+'" stroke-width="1.2"/>'
        +'<circle cx="'+rc.px+'" cy="'+rc.py+'" r="7" fill="#e3f2fd" stroke="'+e+'" stroke-width=".9"/>'
        +'<circle cx="'+rc.px+'" cy="'+rc.py+'" r="3.5" fill="'+_a(col,.3)+'" stroke="'+e+'" stroke-width=".5"/>'
        +'<line x1="'+(rc.px-7)+'" y1="'+rc.py+'" x2="'+(rc.px+7)+'" y2="'+rc.py+'" stroke="'+e+'" stroke-width=".4"/>'
        +'<line x1="'+rc.px+'" y1="'+(rc.py-7)+'" x2="'+rc.px+'" y2="'+(rc.py+7)+'" stroke="'+e+'" stroke-width=".4"/>'
        +'</svg>';
    })(),
    cafeteria:(()=>{
      const mn=_box(OX,OY,-5.5,-3.5,0,11,7,4.2);
      const ov=_box(OX,OY,-4,-3.5,4.2,8,7,0.9);
      const bd=_box(OX,OY,-5.5,-3.5,4.2,11,7,0.7);
      let ws='';
      [[-3.0,-1.8,0.5,3.4,true],[-1.5,-0.3,0.5,3.4,false],[0.2,1.4,0.5,3.4,true],[2.0,3.2,0.5,3.4,false]].forEach(p=>ws+=_wR(OX,OY,-5.5,p[0],p[1],p[2],p[3],p[4]));
      [[-5.0,-3.7,-3.5,0.5,3.4,false],[-3.3,-2.0,-3.5,0.5,3.4,true],[-1.6,-0.3,-3.5,0.5,3.4,false],[0.1,1.4,-3.5,0.5,3.4,true],[1.7,3.0,-3.5,0.5,3.4,false],[3.3,4.6,-3.5,0.5,3.4,true]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],p[2],p[3],p[4],p[5]));
      const dr=[_ip(-1.1,-3.5,0,OX,OY),_ip(1.1,-3.5,0,OX,OY),_ip(1.1,-3.5,3.0,OX,OY),_ip(-1.1,-3.5,3.0,OX,OY)];
      const s=q=>q.px+','+q.py;
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(74,9)
        +face(mn.top,'url(#t'+id+')',e,'1.3')+face(mn.right,'url(#r'+id+')',e,'1.3')+face(mn.left,'url(#l'+id+')',e,'1.3')
        +ws+'<polygon points="'+dr.map(s).join(' ')+'" fill="'+_dk(col,40)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<line x1="'+dr[0].px+'" y1="'+dr[0].py+'" x2="'+dr[3].px+'" y2="'+dr[3].py+'" stroke="'+e+'" stroke-width=".7"/>'
        +face(ov.top,_lt(col,58),e,'1')+face(ov.right,_dk(col,18),e,'1')+face(ov.left,_lt(col,18),e,'1')
        +face(bd.top,_lt(col,70),e,'.8')
        +'</svg>';
    })(),
    spor:(()=>{
      const bs=_box(OX,OY,-5.5,-3.5,0,11,7,3.8);
      const N=10;
      let dome='',str='',drs='';
      for(let i=0;i<N;i++){
        const t1=i/N*Math.PI,t2=(i+1)/N*Math.PI;
        const h1=Math.sin(t1)*4.8,h2=Math.sin(t2)*4.8;
        const x1=-5.5+i/N*11,x2=-5.5+(i+1)/N*11;
        const ps=[_ip(x1,-3.5,3.8+h1,OX,OY),_ip(x2,-3.5,3.8+h2,OX,OY),_ip(x2,3.5,3.8+h2,OX,OY),_ip(x1,3.5,3.8+h1,OX,OY)];
        const br=Math.round(72*(1-i/N));
        const dc=i<N/2?_lt(col,br):_dk(col,Math.round(22*i/N));
        dome+='<polygon points="'+ps.map(q=>q.px+','+q.py).join(' ')+'" fill="'+dc+'" stroke="'+_lt(col,28)+'" stroke-width=".5"/>';
      }
      [0.25,0.5,0.75].forEach(t=>{
        const h=Math.sin(t*Math.PI)*4.8,x=-5.5+t*11;
        const l=_ip(x,-3.5,3.8+h,OX,OY),r=_ip(x,3.5,3.8+h,OX,OY);
        str+='<line x1="'+l.px+'" y1="'+l.py+'" x2="'+r.px+'" y2="'+r.py+'" stroke="'+_dk(col,30)+'" stroke-width=".6" opacity=".5"/>';
      });
      [-4.2,-1.0,2.2].forEach(x=>{
        const dp=[_ip(x,-3.5,0,OX,OY),_ip(x+1.6,-3.5,0,OX,OY),_ip(x+1.6,-3.5,2.8,OX,OY),_ip(x,-3.5,2.8,OX,OY)];
        drs+='<polygon points="'+dp.map(q=>q.px+','+q.py).join(' ')+'" fill="'+_dk(col,42)+'" stroke="'+e+'" stroke-width=".9"/>';
      });
      const pk=_ip(0,0,8.8,OX,OY);
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(70,8)
        +face(bs.right,'url(#r'+id+')',e,'1.2')+face(bs.left,'url(#l'+id+')',e,'1.2')
        +dome+str+drs
        +'<circle cx="'+pk.px+'" cy="'+pk.py+'" r="5.5" fill="'+_lt(col,82)+'" stroke="'+e+'" stroke-width="1"/>'
        +'<circle cx="'+pk.px+'" cy="'+pk.py+'" r="2.5" fill="#e3f2fd" stroke="'+e+'" stroke-width=".5"/>'
        +'</svg>';
    })(),
    kyk_yurt:(()=>{
      const bs=_box(OX,OY,-3,-2,0,6,4,12);
      const rf=_box(OX,OY,-3.3,-2.3,12,6.6,4.6,1);
      const tk=_box(OX,OY,0.5,-0.5,13,1.5,1,1.6);
      const F=7;let ws='',fl='';
      for(let f=0;f<F;f++){
        const zb=f*(12/F)+0.3,zt=zb+1.1;
        [[-1.8,-0.9,f%2===0],[-0.6,0.3,f%3===0],[0.5,1.4,f%2!==0],[1.7,2.6,f%3===0]].forEach(p=>ws+=_wR(OX,OY,-3,p[0],p[1],zb,zt,p[2]));
        [[-2.8,-1.9,f%2===0],[-1.6,-0.7,f%3===0],[-0.4,0.5,f%2!==0],[0.7,1.6,f%3===0]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],-2,zb,zt,p[2]));
      }
      for(let f=1;f<F;f++){
        const z=f*(12/F);
        const a=_ip(-3,-2,z,OX,OY),b=_ip(-3,2,z,OX,OY),c=_ip(3,-2,z,OX,OY);
        fl+='<line x1="'+a.px+'" y1="'+a.py+'" x2="'+b.px+'" y2="'+b.py+'" stroke="'+_dk(col,22)+'" stroke-width=".5" opacity=".5"/>';
        fl+='<line x1="'+a.px+'" y1="'+a.py+'" x2="'+c.px+'" y2="'+c.py+'" stroke="'+_dk(col,22)+'" stroke-width=".5" opacity=".5"/>';
      }
      const en=[_ip(-0.8,-2,0,OX,OY),_ip(0.8,-2,0,OX,OY),_ip(0.8,-2,2.4,OX,OY),_ip(-0.8,-2,2.4,OX,OY)];
      const s=q=>q.px+','+q.py;
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(46,6)
        +face(bs.top,'url(#t'+id+')',e,'1.2')+face(bs.right,'url(#r'+id+')',e,'1.2')+face(bs.left,'url(#l'+id+')',e,'1.2')
        +fl+ws
        +'<polygon points="'+en.map(s).join(' ')+'" fill="'+_dk(col,42)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<line x1="'+en[0].px+'" y1="'+en[0].py+'" x2="'+en[3].px+'" y2="'+en[3].py+'" stroke="'+e+'" stroke-width=".7"/>'
        +face(rf.top,_lt(col,68),e,'1')+face(rf.right,_dk(col,10),e,'1')+face(rf.left,_lt(col,32),e,'1')
        +face(tk.top,_lt(col,72),e,'.8')+face(tk.right,_dk(col,22),e,'.8')+face(tk.left,_lt(col,42),e,'.8')
        +'</svg>';
    })(),
    ziraat:(()=>{
      const mn=_box(OX,OY,-5.5,-3.5,0,11,7,4.8);
      const ax=_box(OX,OY,-5.5,-3.5,0,2.5,7,6.8);
      const gh=_box(OX,OY,4.2,-3.5,0,1.3,7,3.5);
      const ch=_box(OX,OY,-4.5,0,4.8,0.8,1.5,2.8);
      const rL=[_ip(-5.5,-3.5,4.8,OX,OY),_ip(-5.5,3.5,4.8,OX,OY),_ip(0,3.5,7.8,OX,OY),_ip(0,-3.5,7.8,OX,OY)];
      const rR=[_ip(5.5,-3.5,4.8,OX,OY),_ip(5.5,3.5,4.8,OX,OY),_ip(0,3.5,7.8,OX,OY),_ip(0,-3.5,7.8,OX,OY)];
      const aF=[_ip(-5.5,-3.5,4.8,OX,OY),_ip(5.5,-3.5,4.8,OX,OY),_ip(0,-3.5,7.8,OX,OY)];
      const s=q=>q.px+','+q.py;
      let ws='',gc='';
      [[-3.0,-1.8,0.5,3.2,true],[-1.5,-0.3,0.5,3.2,false],[0.2,1.4,0.5,3.2,true],[2.0,3.2,0.5,3.2,false]].forEach(p=>ws+=_wR(OX,OY,-5.5,p[0],p[1],p[2],p[3],p[4]));
      [[-5.0,-3.7,-3.5,0.5,3.2,false],[-3.3,-2.0,-3.5,0.5,3.2,true],[-1.6,-0.3,-3.5,0.5,3.2,false],[0.1,1.4,-3.5,0.5,3.2,true],[1.7,3.0,-3.5,0.5,3.2,false]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],p[2],p[3],p[4],p[5]));
      [1,2].forEach(i=>{const z=i*1.2,l=_ip(4.2,-3.5,z,OX,OY),r=_ip(4.2,3.5,z,OX,OY);gc+='<line x1="'+l.px+'" y1="'+l.py+'" x2="'+r.px+'" y2="'+r.py+'" stroke="#0ea5e948" stroke-width=".6"/>';});
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd
        +'<defs><linearGradient id="gl'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b3e5fc60"/><stop offset="100%" stop-color="#e8f5e960"/></linearGradient></defs>'
        +sh(72,9)
        +face(gh.top,'url(#gl'+id+')','#0ea5e950','.8')+face(gh.right,'url(#gl'+id+')','#0ea5e948','.8')+face(gh.left,'url(#gl'+id+')','#0ea5e948','.8')+gc
        +face(mn.top,'url(#t'+id+')',e,'1.3')+face(mn.right,'url(#r'+id+')',e,'1.3')+face(mn.left,'url(#l'+id+')',e,'1.3')
        +face(ax.top,_lt(col,62),e,'1.1')+face(ax.right,_dk(col,8),e,'1.1')+face(ax.left,_lt(col,38),e,'1.1')
        +ws
        +'<polygon points="'+rL.map(s).join(' ')+'" fill="'+_lt(col,52)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<polygon points="'+rR.map(s).join(' ')+'" fill="'+_lt(col,35)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<polygon points="'+aF.map(s).join(' ')+'" fill="'+_lt(col,65)+'" stroke="'+e+'" stroke-width="1"/>'
        +face(ch.top,_dk(col,10),e,'.8')+face(ch.right,_dk(col,38),e,'.8')+face(ch.left,_dk(col,0),e,'.8')
        +'</svg>';
    })(),
    default:(()=>{
      const bs=_box(OX,OY,-4,-3,0,8,6,5.8);
      const rf=_box(OX,OY,-4,-3,5.8,8,6,0.9);
      let ws='',fl='';
      const fz=3;
      const la=_ip(-4,-3,fz,OX,OY),lb=_ip(4,-3,fz,OX,OY),lc=_ip(-4,3,fz,OX,OY);
      fl='<line x1="'+la.px+'" y1="'+la.py+'" x2="'+lb.px+'" y2="'+lb.py+'" stroke="'+_dk(col,22)+'" stroke-width=".7" opacity=".5"/>'
        +'<line x1="'+la.px+'" y1="'+la.py+'" x2="'+lc.px+'" y2="'+lc.py+'" stroke="'+_dk(col,22)+'" stroke-width=".7" opacity=".5"/>';
      [[0.5,2.4,true],[3.2,5.2,false]].forEach(([zb,zt,lit])=>{
        [[-2.5,-1.4,lit],[-1.0,0.0,!lit],[0.5,1.5,lit],[2.0,3.0,!lit]].forEach(p=>ws+=_wR(OX,OY,-4,p[0],p[1],zb,zt,p[2]));
        [[-3.5,-2.5,lit],[-2.0,-1.0,!lit],[-0.5,0.5,lit],[1.0,2.0,!lit]].forEach(p=>ws+=_wL(OX,OY,p[0],p[1],-3,zb,zt,p[2]));
      });
      const dr=[_ip(-1,-3,0,OX,OY),_ip(1,-3,0,OX,OY),_ip(1,-3,2.6,OX,OY),_ip(-1,-3,2.6,OX,OY)];
      let cls=''; [-3.2,-0.5,2.0].forEach(x=>{const a=_ip(x,-3,0,OX,OY),b=_ip(x,-3,2.6,OX,OY);cls+='<line x1="'+a.px+'" y1="'+a.py+'" x2="'+b.px+'" y2="'+b.py+'" stroke="'+_dk(col,30)+'" stroke-width="1.4" opacity=".55"/>';});
      const s=q=>q.px+','+q.py;
      return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" fill="none">'+gd+sh(58,7)
        +face(bs.top,'url(#t'+id+')',e,'1.2')+face(bs.right,'url(#r'+id+')',e,'1.2')+face(bs.left,'url(#l'+id+')',e,'1.2')
        +fl+ws+cls
        +'<polygon points="'+dr.map(s).join(' ')+'" fill="'+_dk(col,42)+'" stroke="'+e+'" stroke-width=".9"/>'
        +'<line x1="'+dr[0].px+'" y1="'+dr[0].py+'" x2="'+dr[3].px+'" y2="'+dr[3].py+'" stroke="'+e+'" stroke-width=".7"/>'
        +face(rf.top,_lt(col,62),e,'.9')+face(rf.right,_dk(col,12),e,'.9')+face(rf.left,_lt(col,30),e,'.9')
        +'</svg>';
    })(),
  };
  return M[id]||M.default;
}


/* ─── Marker icon factory ────────────────────────────────── */
const SVG_ID_MAP = ['rektorluk','library','cafeteria','spor','kyk_yurt','ziraat'];

function buildingMarkerIcon(loc) {
  const svgKey = SVG_ID_MAP.includes(loc.id) ? loc.id : 'default';
  const svg = buildingSVG(svgKey, loc.color);
  return L.divIcon({
    className: '', iconSize: [160, 180], iconAnchor: [80, 172],
    html: `<div class="cgm-building" style="--c:${loc.color}">
      <div class="cgm-bldg-svg">${svg}</div>
      <div class="cgm-bldg-label">
        <span class="cgm-bldg-icon">${loc.icon}</span>
        <span class="cgm-bldg-name">${loc.name}</span>
        ${loc.isXpZone
          ? `<span class="cgm-bldg-xp">+${loc.xp}XP</span>`
          : `<span class="cgm-bldg-chat">💬</span>`}
      </div>
    </div>`,
  });
}

function hiddenIcon(spot) {
  return L.divIcon({
    className: '', iconSize: [32, 32], iconAnchor: [16, 16],
    html: `<div class="cgm-hidden ${spot.found ? 'cgm-hidden-found' : ''}">${spot.found ? (spot.icon || '🗝️') : '❓'}</div>`,
  });
}

function npcIcon(npc) {
  return L.divIcon({
    className: '', iconSize: [54, 62], iconAnchor: [27, 54],
    html: `<div class="cgm-npc">
      <div class="cgm-npc-bubble">${npc.icon}</div>
      <div class="cgm-npc-name">${npc.name.split(' ')[0]}</div>
    </div>`,
  });
}

function playerHTML(player, isSelf) {
  const c  = player?.avatar?.color || '#00f5ff';
  const e  = player?.avatar?.emoji || '🎓';
  const n  = player?.username || '?';
  const lv = player?.level || 1;
  const role = player?.role;
  const roleTag = role==='admin' ? '<span class="cgm-role-admin">A</span>' : role==='moderator' ? '<span class="cgm-role-mod">M</span>' : '';
  return `<div class="cgm-player ${isSelf ? 'cgm-self' : ''}" style="--c:${c}">
    ${isSelf ? '<div class="cgm-ping"></div><div class="cgm-ping cgm-ping2"></div>' : ''}
    <div class="cgm-body">
      <div class="cgm-inner"><span class="cgm-emoji">${e}</span></div>
      <div class="cgm-lv">${roleTag}${lv}</div>
    </div>
    <div class="cgm-shadow"></div>
    <div class="cgm-label"><span class="cgm-name">${n}</span></div>
  </div>`;
}

function playerIcon(p, isSelf) {
  return L.divIcon({ className:'', html: playerHTML(p, isSelf), iconSize:[90,86], iconAnchor:[45,56] });
}

function friendIcon(f) {
  const c = f?.avatar?.color || '#39d353';
  const e = f?.avatar?.emoji || '🎓';
  return L.divIcon({
    className:'', iconSize:[72,68], iconAnchor:[36,52],
    html:`<div class="cgm-player cgm-friend" style="--c:${c}">
      <div class="cgm-friend-ring"></div>
      <div class="cgm-body" style="width:38px;height:38px">
        <div class="cgm-inner" style="width:34px;height:34px"><span class="cgm-emoji" style="font-size:18px">${e}</span></div>
      </div>
      <div class="cgm-label" style="font-size:8px"><span class="cgm-name">${f.username} 📍</span></div>
    </div>`,
  });
}

/* ─── Distance helper ────────────────────────────────────── */
function dist(lat1,lng1,lat2,lng2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ─── Ana component ──────────────────────────────────────── */
export default function GameMap({ selfPlayer, otherPlayers=[], friendLocations=[], hiddenSpots=[], npcs=[], discoveredLocs=[], onPlayerMove, onLocationEnter, onLocationLeave, onNPCNearby, onPlayerClick, chatFocused=false }) {
  const wrapRef    = useRef(null);
  const mapRef     = useRef(null);
  const selfMRef   = useRef(null);
  const othersRef  = useRef({});
  const friendsRef       = useRef({});
  const npcMarkersRef    = useRef([]);
  const discoveryRef     = useRef({});
  const hiddenMarkersRef = useRef({});
  const keysRef          = useRef({});
  const posRef     = useRef({ lat: selfPlayer?.lastPosition?.lat||CAMPUS.center[0], lng: selfPlayer?.lastPosition?.lng||CAMPUS.center[1] });
  const curLocRef  = useRef(null);
  const animRef    = useRef(null);
  const emitRef    = useRef(0);
  const selfRef    = useRef(selfPlayer);
  const chatRef    = useRef(chatFocused);
  const cbRef      = useRef({ onPlayerMove, onLocationEnter, onLocationLeave, onNPCNearby });

  useEffect(()=>{ selfRef.current=selfPlayer; },[selfPlayer]);
  useEffect(()=>{ chatRef.current=chatFocused; },[chatFocused]);
  useEffect(()=>{ cbRef.current={onPlayerMove,onLocationEnter,onLocationLeave,onNPCNearby,onPlayerClick}; });

  useEffect(()=>{
    if(mapRef.current||!wrapRef.current) return;

    const map=L.map(wrapRef.current,{center:CAMPUS.center,zoom:CAMPUS.zoom,zoomControl:false,minZoom:15,maxZoom:19});

    /* Koyu minimal harita — yalnızca sokak hatları */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:'© CartoDB'}).addTo(map);
    L.control.zoom({position:'bottomright'}).addTo(map);

    /* Kampüs sınır */
    L.rectangle([[CAMPUS.bounds.S,CAMPUS.bounds.W],[CAMPUS.bounds.N,CAMPUS.bounds.E]],{
      color:'#0ea5e9',weight:2,opacity:.4,fill:true,fillOpacity:.03,dashArray:'12 16',
    }).addTo(map);

    /* Yeşil alanlar */
    GREENS.forEach(g=>L.polygon(g,{color:'#16a34a',weight:1.2,opacity:.5,fillColor:'#bbf7d0',fillOpacity:.48}).addTo(map));

    /* Yollar — iki katman: gri + mavi parıltı */
    ROADS.forEach(r=>{
      L.polyline(r,{color:'#e2e8f0',weight:7,opacity:.55}).addTo(map);
      L.polyline(r,{color:'#8b1a1a',weight:1.5,opacity:.15}).addTo(map);
    });

    /* Bina footprint poligonları */
    FOOTPRINTS.forEach(b=>{
      L.polygon(b.poly,{
        color:b.color,weight:1.6,opacity:.5,
        fillColor:b.color,fillOpacity:.22,
        className:'cgm-building-fp',
      }).addTo(map);
    });

    /* Lokasyon zone halkaları + bina ikonları */
    ALL_LOCATIONS.forEach(loc=>{
      if(loc.isXpZone){
        L.circle([loc.lat,loc.lng],{radius:loc.r*1.6,color:loc.color,weight:1,opacity:.1,fillColor:loc.color,fillOpacity:.015,dashArray:'14 12',className:'cgm-zone-outer'}).addTo(map);
        L.circle([loc.lat,loc.lng],{radius:loc.r,color:loc.color,weight:2.2,opacity:.7,fillColor:loc.color,fillOpacity:.1,className:'cgm-zone-inner'}).addTo(map);
      } else {
        L.circle([loc.lat,loc.lng],{radius:loc.r,color:loc.color,weight:1.4,opacity:.4,fillColor:loc.color,fillOpacity:.06,dashArray:'6 8'}).addTo(map);
      }
      L.marker([loc.lat,loc.lng],{icon:buildingMarkerIcon(loc),interactive:false,zIndexOffset:-100}).addTo(map);
    });

    /* Klavye */
    const keys=keysRef.current;
    const MOVE_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    const onDown=e=>{ if(chatRef.current) return; const t=document.activeElement?.tagName; if(t==='INPUT'||t==='TEXTAREA') return; keys[e.code]=true; if(MOVE_KEYS.has(e.code)) e.preventDefault(); };
    const onUp  =e=>{ keys[e.code]=false; };
    window.addEventListener('keydown',onDown);
    window.addEventListener('keyup',onUp);
    map.on('click',e=>{ posRef.current={lat:e.latlng.lat,lng:e.latlng.lng}; });

    /* Oyuncu markeri */
    const selfM=L.marker([posRef.current.lat,posRef.current.lng],{icon:playerIcon(selfRef.current,true),zIndexOffset:2000}).addTo(map);
    selfMRef.current=selfM;

    /* Oyun döngüsü */
    const SPEED=0.000026;
    let lastTs=0;
    let lastNPCId=null;
    const tick=ts=>{
      const dt=lastTs>0?Math.min((ts-lastTs)/16.67,2.5):1;lastTs=ts;
      const k=keysRef.current;
      let dLat=0,dLng=0;
      if(!chatRef.current){
        const t=document.activeElement?.tagName;
        if(t!=='INPUT'&&t!=='TEXTAREA'){
          if(k['KeyW']||k['ArrowUp'])    dLat+=SPEED*dt;
          if(k['KeyS']||k['ArrowDown'])  dLat-=SPEED*dt;
          if(k['KeyD']||k['ArrowRight']) dLng+=SPEED*dt;
          if(k['KeyA']||k['ArrowLeft'])  dLng-=SPEED*dt;
        }
      }
      if(dLat!==0&&dLng!==0){dLat/=Math.SQRT2;dLng/=Math.SQRT2;}
      if(dLat!==0||dLng!==0){
        const{S,N,W,E}=CAMPUS.bounds,m=0.0003;
        posRef.current={lat:Math.max(S+m,Math.min(N-m,posRef.current.lat+dLat)),lng:Math.max(W+m,Math.min(E-m,posRef.current.lng+dLng))};
        selfMRef.current?.setLatLng([posRef.current.lat,posRef.current.lng]);
        map.setView([posRef.current.lat,posRef.current.lng],map.getZoom(),{animate:false});
      }
      if(ts-emitRef.current>100){
        emitRef.current=ts;
        const{lat,lng}=posRef.current;
        const x=(lng-CAMPUS.bounds.W)/(CAMPUS.bounds.E-CAMPUS.bounds.W);
        const y=1-(lat-CAMPUS.bounds.S)/(CAMPUS.bounds.N-CAMPUS.bounds.S);
        cbRef.current.onPlayerMove?.(lat,lng,x,y);
        let entered=null;
        for(const loc of ALL_LOCATIONS) if(dist(lat,lng,loc.lat,loc.lng)<=loc.r){entered=loc;break;}
        if(entered?.id!==curLocRef.current?.id){
          if(curLocRef.current) cbRef.current.onLocationLeave?.(curLocRef.current);
          curLocRef.current=entered;
          if(entered) cbRef.current.onLocationEnter?.(entered);
        }
        let nearNPC=null;
        for(const npc of npcs) if(dist(lat,lng,npc.lat,npc.lng)<=20){nearNPC=npc;break;}
        if(nearNPC?.id!==lastNPCId){lastNPCId=nearNPC?.id||null;cbRef.current.onNPCNearby?.(nearNPC);}
      }
      animRef.current=requestAnimationFrame(tick);
    };
    animRef.current=requestAnimationFrame(tick);
    mapRef.current=map;
    return()=>{ cancelAnimationFrame(animRef.current); window.removeEventListener('keydown',onDown); window.removeEventListener('keyup',onUp); map.remove(); mapRef.current=null; selfMRef.current=null; };
  // eslint-disable-next-line
  },[]);

  useEffect(()=>{ if(!selfMRef.current||!selfPlayer) return; selfMRef.current.setIcon(playerIcon(selfPlayer,true)); },[selfPlayer?.avatar,selfPlayer?.level,selfPlayer?.username,selfPlayer?.role]);

  useEffect(()=>{
    const map=mapRef.current; if(!map) return;
    const ids=new Set((otherPlayers||[]).map(p=>p.userId||p.socketId));
    for(const id of Object.keys(othersRef.current)) if(!ids.has(id)){othersRef.current[id].remove();delete othersRef.current[id];}
    for(const p of (otherPlayers||[])){
      const id=p.userId||p.socketId,pos=p.position||p.lastPosition;
      if(!pos?.lat) continue;
      if(othersRef.current[id]){
        othersRef.current[id].setLatLng([pos.lat,pos.lng]);
        othersRef.current[id].setIcon(playerIcon(p,false));
      } else {
        const m=L.marker([pos.lat,pos.lng],{icon:playerIcon(p,false),zIndexOffset:1000}).addTo(map);
        const c=p.avatar?.color||'#00f5ff';
        m.bindTooltip(
          `<div style="font-family:monospace;font-size:10px;text-align:center;line-height:1.7;">
            <b style="color:${c}">${p.username}</b><br>
            <span style="color:rgba(148,163,184,.7)">Lv.${p.level||1}</span><br>
            <span style="color:${c};font-size:9px;">⚔️ Arena'ya davet et</span>
          </div>`,
          {className:'cgm-tooltip',direction:'top',offset:[0,-56]}
        );
        m.on('click',()=>{ cbRef.current.onPlayerClick?.(p); });
        othersRef.current[id]=m;
      }
    }
  },[otherPlayers]);

  useEffect(()=>{
    const map=mapRef.current; if(!map) return;
    const ids=new Set((friendLocations||[]).map(f=>String(f._id||f.id)));
    for(const id of Object.keys(friendsRef.current)) if(!ids.has(id)){friendsRef.current[id].remove();delete friendsRef.current[id];}
    for(const f of (friendLocations||[])){
      const id=String(f._id||f.id),pos=f.lastPosition;
      if(!pos?.lat||!f.isOnline) continue;
      if(friendsRef.current[id]) friendsRef.current[id].setLatLng([pos.lat,pos.lng]);
      else{
        friendsRef.current[id]=L.marker([pos.lat,pos.lng],{icon:friendIcon(f),zIndexOffset:900}).addTo(map);
        friendsRef.current[id].bindTooltip(`👥 <b>${f.username}</b>${f.currentRoom?`<br>📍 ${f.currentRoom.replace('chat_','').replace(/_/g,' ')}`:''}`,{className:'cgm-tooltip',direction:'top',offset:[0,-48]});
      }
    }
  },[friendLocations]);

  /* ── NPC'ler — reaktif (socket'tan gelince render et) ── */
  useEffect(()=>{
    const map=mapRef.current; if(!map||!npcs?.length) return;
    npcMarkersRef.current.forEach(m=>m.remove());
    npcMarkersRef.current=[];
    npcs.forEach(npc=>{
      if(npc.lat==null||npc.lng==null||isNaN(npc.lat)||isNaN(npc.lng)) return;
      try{
        const m=L.marker([npc.lat,npc.lng],{icon:npcIcon(npc),zIndexOffset:500}).addTo(map);
        m.bindTooltip(`<b>${npc.icon||'👤'} ${npc.name}</b><br><i>${(npc.greeting||'').slice(0,48)}…</i>`,{className:'cgm-tooltip',direction:'top',offset:[0,-54]});
        npcMarkersRef.current.push(m);
      }catch(e){}
    });
  },[npcs]);

  /* ── Gizli noktalar — reaktif ── */
  useEffect(()=>{
    const map=mapRef.current; if(!map) return;
    const existing=hiddenMarkersRef.current;
    hiddenSpots.forEach(spot=>{
      if(!spot.found||existing[spot.id]) return;
      if(spot.lat==null||spot.lng==null||isNaN(spot.lat)||isNaN(spot.lng)) return;
      try{
        const m=L.marker([spot.lat,spot.lng],{icon:hiddenIcon(spot),zIndexOffset:400}).addTo(map);
        m.bindTooltip(`🗝️ <b>${spot.name}</b>`,{className:'cgm-tooltip',direction:'top'});
        existing[spot.id]=m;
      }catch(e){}
    });
  },[hiddenSpots]);

  /* ── Keşfedilen lokasyonlar — yeşil tik işareti ── */
  useEffect(()=>{
    const map=mapRef.current; if(!map) return;
    const existing=discoveryRef.current;
    discoveredLocs.forEach(locId=>{
      if(existing[locId]) return;
      const loc=ALL_LOCATIONS.find(l=>l.id===locId);
      if(!loc||loc.lat==null||loc.lng==null) return;
      try{
        const m=L.marker([loc.lat,loc.lng],{
          icon:L.divIcon({className:'',iconSize:[28,28],iconAnchor:[14,14],
            html:`<div class="cgm-discovered" style="--c:${loc.color}" title="${loc.name} — keşfedildi">✓</div>`}),
          zIndexOffset:350,interactive:false
        }).addTo(map);
        existing[locId]=m;
      }catch(e){}
    });
  },[discoveredLocs]);

  return <div ref={wrapRef} style={{width:'100%',height:'100%'}}/>;
}
