import { db } from '../_db.mjs';
import { hash, cookieHeader, clearCookieHeader, getSessionToken, requireUser } from '../_auth.mjs';

export default async function handler(req, res) {
  try {
    const sql = db();

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      const user = await requireUser(sql, req);
      if (!user) return res.status(200).json({ user: null });
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarSeed: user.avatar_seed,
          timezone: user.timezone,
          totalXp: user.total_xp,
          streak: { current: user.streak_current, longest: user.streak_longest },
          lastActiveDate: user.last_active_date,
          // Field sosial (006/007) — client pakai ini untuk onboarding & tema.
          handle: user.handle,
          displayName: user.display_name,
          avatarKey: user.avatar_key,
          theme: user.theme,
          gender: user.gender,
          onboardedStep: user.onboarded_step,
          visibility: user.visibility,
          avatarFrame: user.avatar_frame,
          handleChangedAt: user.handle_changed_at,
          // Karakter orisinal (008/doc 49) — tema tombol + maskot ikut characterId.
          characterId: user.character_id,
          charactersUnlocked: user.characters_unlocked || [],
        },
      });
    }

    if (req.method === 'DELETE') {
      const raw = getSessionToken(req);
      if (raw) await sql`UPDATE app_sessions SET revoked_at = now() WHERE token_hash = ${hash(raw)}`;
      res.setHeader('Set-Cookie', clearCookieHeader('kaigo_session'));
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }
}
