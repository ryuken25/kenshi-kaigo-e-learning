import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

const ProgressContext = createContext(null);

const GUEST_KEY = 'kaigoKittyProgress';
const CLIENT_ID_KEY = 'kaigoKittyClientId';

export function readGuestProgress() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '{"done":{},"xp":0,"streak":0}');
  } catch {
    return { done: {}, xp: 0, streak: 0 };
  }
}

export function saveGuestProgress(p) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(p));
  dispatchEvent(new Event('kk-progress-changed'));
}

function getOrCreateClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function ProgressProvider({ children }) {
  const { status, isAuthenticated, refresh: refreshAuth } = useAuth();
  const [serverProgress, setServerProgress] = useState(null);
  const [guestProgress, setGuestProgress] = useState(readGuestProgress);
  const [loading, setLoading] = useState(true);
  const [mergedForSession, setMergedForSession] = useState(false);

  const fetchServerProgress = useCallback(async () => {
    try {
      const r = await fetch('/api/progress', { credentials: 'same-origin' });
      if (r.status === 401) { setServerProgress(null); return; }
      const d = await r.json();
      setServerProgress(d);
    } catch {
      setServerProgress(null);
    }
  }, []);

  const mergeGuestIntoAccount = useCallback(async () => {
    const guest = readGuestProgress();
    const entries = Object.entries(guest.done || {}).map(([key, val]) => {
      const [sectionId, levelId] = key.split('-').map(Number);
      return { sectionId, levelId, bestScore: typeof val === 'object' ? (val.score || 100) : 100, attempts: 1 };
    });
    if (entries.length === 0) return;
    const clientId = getOrCreateClientId();
    try {
      const r = await fetch('/api/progress/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ clientId, entries }),
      });
      const d = await r.json();
      if (r.ok && !d.alreadyMerged) {
        localStorage.removeItem(GUEST_KEY);
        setGuestProgress(readGuestProgress());
      }
    } catch {
      // offline / failed — keep guest progress, will retry next login
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    setLoading(true);
    (async () => {
      if (status === 'authenticated') {
        if (!mergedForSession) {
          await mergeGuestIntoAccount();
          setMergedForSession(true);
        }
        await fetchServerProgress();
      } else {
        setServerProgress(null);
      }
      setLoading(false);
    })();
  }, [status, mergedForSession, mergeGuestIntoAccount, fetchServerProgress]);

  useEffect(() => {
    const onStorage = () => setGuestProgress(readGuestProgress());
    addEventListener('storage', onStorage);
    addEventListener('kk-progress-changed', onStorage);
    return () => { removeEventListener('storage', onStorage); removeEventListener('kk-progress-changed', onStorage); };
  }, []);

  // submit a completed quiz attempt; returns server response for authenticated users
  const submitAttempt = useCallback(async ({ sectionId, levelId, correctCount, totalCount, score, durationMs, attemptId }) => {
    if (isAuthenticated) {
      try {
        const r = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ sectionId, levelId, score, correctCount, totalCount, durationMs, attemptId }),
        });
        if (r.status === 401) throw new Error('not_signed_in');
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || d.error || 'progress_failed');
        await fetchServerProgress();
        await refreshAuth();
        return { ok: true, data: d };
      } catch (e) {
        // fallback to local queue on network/server failure, will not double count once synced
        const guest = readGuestProgress();
        guest.done[`${sectionId}-${levelId}`] = { score, pending: true };
        saveGuestProgress(guest);
        return { ok: false, error: e.message };
      }
    } else {
      const guest = readGuestProgress();
      guest.done[`${sectionId}-${levelId}`] = { score };
      guest.xp = (guest.xp || 0) + Math.max(10, Math.round(score / 10) * 10);
      saveGuestProgress(guest);
      setGuestProgress(guest);
      return { ok: true, guest: true, data: { xpDelta: Math.max(10, Math.round(score / 10) * 10) } };
    }
  }, [isAuthenticated, fetchServerProgress, refreshAuth]);

  const totalXp = isAuthenticated ? (serverProgress?.totalXp ?? 0) : (guestProgress.xp ?? 0);
  const streakCurrent = isAuthenticated ? (serverProgress?.streak?.current ?? 0) : (guestProgress.streak ?? 0);
  const completedCount = isAuthenticated
    ? (serverProgress?.sections?.reduce((a, s) => a + s.completedLevels, 0) ?? 0)
    : Object.keys(guestProgress.done || {}).length;

  return (
    <ProgressContext.Provider value={{
      isAuthenticated, loading, serverProgress, guestProgress,
      totalXp, streakCurrent, completedCount,
      submitAttempt, refresh: fetchServerProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
