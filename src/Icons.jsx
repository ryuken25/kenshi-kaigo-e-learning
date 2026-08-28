// Icons.jsx — set ikon SVG buatan sendiri, pengganti emoji di seluruh app.
//
// KENAPA BUKAN EMOJI: emoji dirender font sistem, jadi bentuknya beda-beda di
// Android/iOS/Windows dan warnanya TIDAK BISA ikut tema. Ikon di sini dua-nada
// (fill = warna utama, tint = warna muda untuk bidang belakang) dan dua-duanya
// ambil warna dari CSS custom property, jadi satu ikon yang sama tampil benar
// di tema Momo (merah muda), Yuki (biru), maupun Luna (ungu).
//
// Gaya: viewBox 32x32, bentuk isi (bukan garis) supaya tetap terbaca di 24px.
// Port dari docs/design/canvas/icons.mjs — SEMUA atribut sudah camelCase JSX
// (strokeWidth/strokeLinecap/strokeLinejoin), jangan tulis balik jadi kebab-case.
import React from 'react';

// Sudut rotasi kelopak sakura: cincin luar (tint) & cincin dalam (fill) diselang-seling.
const SAKURA_OUTER=[0,72,144,216,288],SAKURA_INNER=[36,108,180,252,324];
const STROBERI_SEEDS=[[12.6,17.4],[19.4,17.4],[16,20.4],[13.4,22.6],[18.6,22.6]];

/* ---------- 13 ikon bab (ganti emoji bab 1..13) ---------- */
const SECTION_ICONS={
  // sakura — bab 1, martabat
  sakura:(f,t)=><>
    <g>{SAKURA_OUTER.map(a=><path key={a} d="M16 16 C13.4 12.6 13.6 8.4 16 5.6 C18.4 8.4 18.6 12.6 16 16 Z" fill={t} transform={`rotate(${a} 16 16)`}/>)}</g>
    <g>{SAKURA_INNER.map(a=><path key={a} d="M16 16 C13.9 13.2 14.1 9.8 16 7.6 C17.9 9.8 18.1 13.2 16 16 Z" fill={f} opacity=".55" transform={`rotate(${a} 16 16)`}/>)}</g>
    <circle cx="16" cy="16" r="3.1" fill={f}/></>,
  // surat cinta — bab 2, komunikasi
  surat:(f,t)=><>
    <rect x="4" y="8" width="24" height="17" rx="3.5" fill={t}/>
    <path d="M4.6 10.4 16 18.2 27.4 10.4" stroke={f} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M16 24.6c-2.9-2-4.6-3.5-4.6-5.3a2.5 2.5 0 0 1 4.6-1.3 2.5 2.5 0 0 1 4.6 1.3c0 1.8-1.7 3.3-4.6 5.3Z" fill={f}/></>,
  // rumah — bab 3, sistem & aturan
  rumah:(f,t)=><>
    <path d="M6 14.6 16 6.4l10 8.2V25a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill={t}/>
    <path d="M3.6 15.4 16 5.2l12.4 10.2" stroke={f} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="13.2" y="17.6" width="5.6" height="9.4" rx="1.4" fill={f}/>
    <circle cx="17.4" cy="22.3" r=".9" fill={t}/></>,
  // jantung + denyut — bab 4, tubuh & pikiran
  jantung:(f,t)=><>
    <path d="M16 27c-6.4-4.3-10.4-7.8-10.4-12.2A5.7 5.7 0 0 1 16 11.4 5.7 5.7 0 0 1 26.4 14.8C26.4 19.2 22.4 22.7 16 27Z" fill={t}/>
    <path d="M5.8 17.4h4.6l2-3.4 2.6 6.4 2.4-4.4 1.8 2.6h6.6" stroke={f} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  // tulip — bab 5, perkembangan & penuaan
  tulip:(f,t)=><>
    <path d="M16 17.8c-3.6 0-5.8-2.4-5.8-6V7.6l3.4 3 2.4-3.6 2.4 3.6 3.4-3v4.2c0 3.6-2.2 6-5.8 6Z" fill={t}/>
    <path d="M16 17.8V27" stroke={f} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M16 22.4c-2.6.4-4.4-.8-5-3.2 2.4-.6 4.4.6 5 3.2Z" fill={f} opacity=".6"/></>,
  // otak — bab 6, demensia
  otak:(f,t)=><>
    <path d="M13.4 5.6a4 4 0 0 0-3.9 3.1 3.7 3.7 0 0 0-2.2 6.2 3.9 3.9 0 0 0 1.4 6.1 4 4 0 0 0 4.7 5V5.6Z" fill={t}/>
    <path d="M18.6 5.6a4 4 0 0 1 3.9 3.1 3.7 3.7 0 0 1 2.2 6.2 3.9 3.9 0 0 1-1.4 6.1 4 4 0 0 1-4.7 5V5.6Z" fill={t}/>
    <path d="M16 5.6V26M13 11.4c-1.6 0-2.4 1-2.4 2.4M19 11.4c1.6 0 2.4 1 2.4 2.4M12.8 18.6c-1.4 0-2.2.8-2.2 2M19.2 18.6c1.4 0 2.2.8 2.2 2" stroke={f} strokeWidth="1.9" strokeLinecap="round" fill="none"/></>,
  // beruang — bab 7, disabilitas
  beruang:(f,t)=><>
    <circle cx="9.4" cy="9.8" r="4" fill={t}/><circle cx="22.6" cy="9.8" r="4" fill={t}/>
    <circle cx="9.4" cy="9.8" r="1.8" fill={f} opacity=".5"/><circle cx="22.6" cy="9.8" r="1.8" fill={f} opacity=".5"/>
    <circle cx="16" cy="18" r="8.6" fill={t}/>
    <circle cx="12.9" cy="16.4" r="1.5" fill={f}/><circle cx="19.1" cy="16.4" r="1.5" fill={f}/>
    <ellipse cx="16" cy="20.6" rx="3.6" ry="2.8" fill={f} opacity=".28"/>
    <path d="M14.6 19.9h2.8L16 21.5Z" fill={f}/>
    <path d="M13.4 23c1.5 1.4 3.7 1.4 5.2 0" stroke={f} strokeWidth="1.8" strokeLinecap="round" fill="none"/></>,
  // stetoskop — bab 8, medical care
  stetoskop:(f,t)=><>
    <path d="M8.6 5.4v6.2a5.4 5.4 0 0 0 10.8 0V5.4" stroke={t} strokeWidth="3.4" strokeLinecap="round" fill="none"/>
    <path d="M8.6 5.4v6.2a5.4 5.4 0 0 0 10.8 0V5.4" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M14 17v2.6a5.4 5.4 0 0 0 10.8 0v-1.4" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="24.8" cy="15" r="3.4" fill={t}/><circle cx="24.8" cy="15" r="3.4" stroke={f} strokeWidth="2" fill="none"/></>,
  // stroberi — bab 9, dasar kaigo
  stroberi:(f,t)=><>
    <path d="M16 27c-5 0-8.4-3.8-8.4-8.6 0-3.4 3.6-6 8.4-6s8.4 2.6 8.4 6C24.4 23.2 21 27 16 27Z" fill={t}/>
    <path d="M16 12.4V7M10.4 8.6l4 3.2M21.6 8.6l-4 3.2M9.2 12.4h13.6" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    {STROBERI_SEEDS.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.1" fill={f}/>)}</>,
  // gelembung — bab 10, teknik komunikasi
  gelembung:(f,t)=><>
    <circle cx="12" cy="18.6" r="7.4" fill={t}/>
    <circle cx="22.4" cy="11.4" r="5" fill={t}/>
    <circle cx="24.2" cy="22.4" r="3.4" fill={t}/>
    <circle cx="12" cy="18.6" r="7.4" stroke={f} strokeWidth="1.8" fill="none"/>
    <circle cx="22.4" cy="11.4" r="5" stroke={f} strokeWidth="1.8" fill="none"/>
    <path d="M8.8 16.2a3.6 3.6 0 0 1 2.6-2.2" stroke={f} strokeWidth="1.7" strokeLinecap="round" fill="none"/></>,
  // bak mandi — bab 11, teknik bantuan hidup
  bak:(f,t)=><>
    <path d="M4 15.4h24v3.8a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6Z" fill={t}/>
    <path d="M3 15.4h26" stroke={f} strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M8 15.4V9a2.8 2.8 0 0 1 5.4-1" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M9.6 25.2 8.4 27.4M22.4 25.2l1.2 2.2" stroke={f} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="19" cy="20" r="1.5" fill={f} opacity=".45"/><circle cx="23" cy="21.4" r="1.1" fill={f} opacity=".45"/></>,
  // catatan — bab 12, proses kaigo
  catatan:(f,t)=><>
    <path d="M6 5.6h13.4L25 11.2V26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill={t}/>
    <path d="M19.4 5.6V11H25" stroke={f} strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <path d="M10 16h9M10 20.4h6.4" stroke={f} strokeWidth="2" strokeLinecap="round"/>
    <path d="m21.8 19.6 3.6 3.6-4.4 1 .8-4.6Z" fill={f}/></>,
  // pita — bab 13, soal gabungan (juga dipakai node milestone)
  pita:(f,t)=><>
    <path d="M15 16c-2.4-3.4-6.2-5.6-8.6-4.4-2 1-1.8 4 .2 5.6 1.8 1.4 5 1.4 8.4-1.2Z" fill={t}/>
    <path d="M17 16c2.4-3.4 6.2-5.6 8.6-4.4 2 1 1.8 4-.2 5.6-1.8 1.4-5 1.4-8.4-1.2Z" fill={t}/>
    <path d="M15 16c-2.4-3.4-6.2-5.6-8.6-4.4-2 1-1.8 4 .2 5.6 1.8 1.4 5 1.4 8.4-1.2Z" stroke={f} strokeWidth="1.9" strokeLinejoin="round" fill="none"/>
    <path d="M17 16c2.4-3.4 6.2-5.6 8.6-4.4 2 1 1.8 4-.2 5.6-1.8 1.4-5 1.4-8.4-1.2Z" stroke={f} strokeWidth="1.9" strokeLinejoin="round" fill="none"/>
    <path d="m14.2 17.2-2.6 7.4M17.8 17.2l2.6 7.4" stroke={f} strokeWidth="1.9" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="2.6" fill={f}/></>,
};

/* ---------- 7 ikon UI ---------- */
const UI_ICONS={
  // konfeti — popup jawaban benar
  konfeti:(f,t)=><>
    <path d="M5 27 12.4 11l8.6 8.6Z" fill={t}/>
    <path d="M5 27 12.4 11l8.6 8.6Z" stroke={f} strokeWidth="1.9" strokeLinejoin="round" fill="none"/>
    <path d="M18.6 9.4c1-2 3-2.4 4.4-1M22.6 14c1.8-1.4 4-.8 5 .8M17.4 5.2c.4-1.4 1.6-2.2 3-2.2" stroke={f} strokeWidth="1.9" strokeLinecap="round" fill="none"/>
    <circle cx="26.4" cy="7.4" r="1.6" fill={f}/><circle cx="20.6" cy="24.6" r="1.3" fill={f}/></>,
  // sedih — popup jawaban salah
  sedih:(f,t)=><>
    <circle cx="16" cy="16" r="11.4" fill={t}/>
    <path d="M10.4 12.6c1.2-1 2.8-1 4 0M17.6 12.6c1.2-1 2.8-1 4 0" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M12.4 21.4c1.9-1.8 5.3-1.8 7.2 0" stroke={f} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M11 16.6h2.6M18.4 16.6H21" stroke={f} strokeWidth="1.8" strokeLinecap="round"/></>,
  // jejak — state memuat
  jejak:(f,t)=><>
    <ellipse cx="16" cy="21" rx="6" ry="4.8" fill={t}/>
    <ellipse cx="8.6" cy="13.6" rx="2.8" ry="3.6" fill={f} opacity=".7"/>
    <ellipse cx="13.6" cy="9.6" rx="2.6" ry="3.4" fill={f} opacity=".7"/>
    <ellipse cx="18.8" cy="9.6" rx="2.6" ry="3.4" fill={f} opacity=".7"/>
    <ellipse cx="23.6" cy="13.6" rx="2.8" ry="3.6" fill={f} opacity=".7"/></>,
  // kilau — hasil sempurna & toast unlock
  kilau:(f,t)=><>
    <path d="M16 4.4c1.1 5.3 2.7 6.9 8 8-5.3 1.1-6.9 2.7-8 8-1.1-5.3-2.7-6.9-8-8 5.3-1.1 6.9-2.7 8-8Z" fill={f}/>
    <path d="M25.4 19.6c.5 2.4 1.2 3.1 3.6 3.6-2.4.5-3.1 1.2-3.6 3.6-.5-2.4-1.2-3.1-3.6-3.6 2.4-.5 3.1-1.2 3.6-3.6Z" fill={t}/>
    <path d="M7 19.4c.4 1.8.9 2.3 2.7 2.7-1.8.4-2.3.9-2.7 2.7-.4-1.8-.9-2.3-2.7-2.7 1.8-.4 2.3-.9 2.7-2.7Z" fill={t}/></>,
  // lambai — onboarding langkah 1
  lambai:(f,t)=><>
    <path d="M11 27c-3.4-1.6-5.4-4.6-5.4-8.4V13a1.8 1.8 0 0 1 3.6 0v3.4" fill="none" stroke={f} strokeWidth="2" strokeLinecap="round"/>
    <path d="M9.2 16.4V8.6a1.8 1.8 0 0 1 3.6 0v7M12.8 15.6V6.6a1.8 1.8 0 0 1 3.6 0v9M16.4 15.6V8.4a1.8 1.8 0 0 1 3.6 0v8.2c0 5.4-2.6 9-6.8 10.4" fill={t} stroke={f} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 6.6c1.6 1.4 2.4 3 2.4 5M26.6 4.6c2.2 2 3.2 4.4 3.2 7.2" stroke={f} strokeWidth="1.9" strokeLinecap="round" fill="none"/></>,
  // label — onboarding handle
  label:(f,t)=><>
    <path d="M16.6 4.4H26a1.6 1.6 0 0 1 1.6 1.6v9.4a2 2 0 0 1-.6 1.4L15.4 28.2a2 2 0 0 1-2.8 0L4 19.6a2 2 0 0 1 0-2.8L15.2 5a2 2 0 0 1 1.4-.6Z" fill={t}/>
    <path d="M16.6 4.4H26a1.6 1.6 0 0 1 1.6 1.6v9.4a2 2 0 0 1-.6 1.4L15.4 28.2a2 2 0 0 1-2.8 0L4 19.6a2 2 0 0 1 0-2.8L15.2 5a2 2 0 0 1 1.4-.6Z" stroke={f} strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <circle cx="21.8" cy="10.2" r="2.2" fill={f}/></>,
  // medali — tier bingkai avatar di halaman achievement
  medali:(f,t)=><>
    <path d="m10.6 4 4.2 8M21.4 4l-4.2 8" stroke={f} strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="16" cy="19.4" r="8.2" fill={t}/>
    <circle cx="16" cy="19.4" r="8.2" stroke={f} strokeWidth="2" fill="none"/>
    <path d="M16 15.2l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5Z" fill={f}/></>,
};

const ALL_ICONS={...SECTION_ICONS,...UI_ICONS};

/** Urutan ikon bab 1..13, sesuai array plans di src/data.js. */
export const SECTION_ICON_NAMES=['sakura','surat','rumah','jantung','tulip','otak','beruang','stetoskop','stroberi','gelembung','bak','catatan','pita'];
export const UI_ICON_NAMES=['konfeti','sedih','jejak','kilau','lambai','label','medali'];

/**
 * @param name  nama ikon (lihat SECTION_ICON_NAMES / UI_ICON_NAMES)
 * @param fill  warna utama, default ikut warna teks induk
 * @param tint  warna bidang belakang, default var(--pink-pale)
 * Nama tak dikenal => null, JANGAN dilempar error: ini dipakai langsung di render.
 */
export function Icon({name,size=24,fill='currentColor',tint='var(--pink-pale)',className='',...rest}){
  const draw=ALL_ICONS[name];
  if(!draw)return null;
  return <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true" className={className||undefined} {...rest}>{draw(fill,tint)}</svg>;
}

/** Kotak ikon berukuran tetap — dipakai untuk kotak ikon bab. */
export function IconTile({name,size=30,box=52,radius=18,fill,tint,bg,className=''}){
  return <span className={className||undefined} style={{width:box,height:box,borderRadius:radius,display:'grid',placeItems:'center',background:bg,flex:'none'}}><Icon name={name} size={size} fill={fill} tint={tint}/></span>;
}

export default Icon;
