// tts.js — text-to-speech Jepang yang tidak ngebug. Diadaptasi dari pack v8 (doc 52-G).
//
// Prinsip utama: UCAPKAN KANA, BUKAN KANJI. 行 bisa dibaca い/おこな/ぎょう/こう —
// mesin TTS menebak dan sering salah. Teks kita beranotasi 漢字[かな], jadi
// toKana() memberi bacaan yang pasti benar. Itu yang dikirim ke TTS.

import { useEffect, useRef, useState } from 'react';

const RUBY_RE = /([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;

/** "報告[ほうこく]する" → "ほうこくする" */
export function toKana(annotated) {
  return String(annotated ?? '').replace(RUBY_RE, '$2');
}

let voicesReady = false;
let jaVoice = null;
let readyPromise = null;

/* getVoices() sering mengembalikan array kosong saat pertama dipanggil — daftar
   suara dimuat asinkron dan event-nya cuma dikirim sekali. */
export function initTTS() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      voicesReady = true;
      return resolve(false);
    }
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return false;
      jaVoice =
        voices.find((v) => v.lang === 'ja-JP' && v.localService) ||
        voices.find((v) => v.lang === 'ja-JP') ||
        voices.find((v) => v.lang?.startsWith('ja')) ||
        null;
      voicesReady = true;
      resolve(!!jaVoice);
      return true;
    };
    if (pick()) return;
    speechSynthesis.addEventListener('voiceschanged', pick, { once: true });
    // Sebagian browser tidak pernah mengirim event-nya. Jangan menunggu selamanya.
    setTimeout(() => { if (!voicesReady) { voicesReady = true; resolve(!!jaVoice); } }, 1500);
  });
  return readyPromise;
}

/** Ada suara Jepang atau tidak. Kalau tidak, JANGAN render tombolnya. */
export function hasJapaneseVoice() {
  return voicesReady && !!jaVoice;
}

/**
 * @param text teks beranotasi ("報告[ほうこく]する") atau kana biasa
 * @returns fungsi untuk menghentikan
 */
export function speak(text, { rate = 0.85, onStart, onEnd, onError } = {}) {
  if (!hasJapaneseVoice()) { onError?.(new Error('no_japanese_voice')); return () => {}; }
  const kana = toKana(text).trim();
  if (!kana) { onError?.(new Error('empty')); return () => {}; }
  speechSynthesis.cancel(); // diketuk cepat berkali-kali → antrian menumpuk, bersihkan dulu
  const u = new SpeechSynthesisUtterance(kana);
  u.voice = jaVoice;
  u.lang = 'ja-JP';
  u.rate = rate;      // 0.85 — bawaan terlalu cepat buat pemula
  u.pitch = 1;
  u.volume = 1;
  let done = false;
  const finish = (err) => {
    if (done) return;
    done = true;
    clearTimeout(watchdog);
    err ? onError?.(err) : onEnd?.();
  };
  u.onstart = () => onStart?.();
  u.onend = () => finish();
  u.onerror = (e) => finish(e.error === 'interrupted' ? null : new Error(e.error));
  // Chrome kadang diam tanpa mengirim onend — perkirakan durasi lalu paksa selesai.
  const watchdog = setTimeout(() => finish(), Math.max(4000, kana.length * 220));
  speechSynthesis.speak(u);
  return () => { speechSynthesis.cancel(); finish(); };
}

export function stop() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

/* ---------- hook React ---------- */

export function useTTS() {
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef(null);
  useEffect(() => {
    let alive = true;
    initTTS().then((ok) => { if (alive) setAvailable(ok); });
    return () => { alive = false; stopRef.current?.(); stop(); }; // berhenti saat pindah halaman
  }, []);
  const play = (text) => {
    if (speaking) { stopRef.current?.(); setSpeaking(false); return; }
    setSpeaking(true);
    stopRef.current = speak(text, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };
  // available === false → JANGAN render tombolnya sama sekali
  return { available, speaking, play, stop: () => { stopRef.current?.(); setSpeaking(false); } };
}
