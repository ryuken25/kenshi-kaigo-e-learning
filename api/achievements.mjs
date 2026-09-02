import { db } from './_db.mjs';
import { requireUser, rejectCrossSite } from './_auth.mjs';
import { reportClientAchievements, FRAME_TIERS, frameForCount } from './_achievements.mjs';

// GET  /api/achievements — katalog lengkap + status unlock user + tier bingkai.
// POST /api/achievements — client melaporkan achievement whitelist (ujian/glossary):
//      body { ids: ['exam-pass', ...] }. Di luar whitelist ditolak diam-diam.
export default async function handler(req, res) {
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    // Mutasi lintas situs ditolak (lapis kedua di luar cookie SameSite=Lax).
    if (req.method !== 'GET' && rejectCrossSite(req, res)) return;

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store');
      const [defs, mine] = await Promise.all([
        sql`SELECT id, name_id, desc_id, category, icon, xp_reward, tier FROM achievements ORDER BY category, tier, id`,
        sql`SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id=${user.id}`,
      ]);
      const unlockedMap = new Map(mine.map(r => [r.achievement_id, r.unlocked_at]));
      return res.status(200).json({
        achievements: defs.map(d => ({
          id: d.id, nameId: d.name_id, descId: d.desc_id, category: d.category,
          icon: d.icon, xpReward: d.xp_reward, tier: d.tier,
          unlocked: unlockedMap.has(d.id), unlockedAt: unlockedMap.get(d.id) || null,
        })),
        unlockedCount: mine.length,
        // ascending: bronze dulu, rainbow terakhir — siap render sebagai ladder.
        frameTiers: FRAME_TIERS.slice().reverse().map(t => ({ frame: t.frame, min: t.min })),
        frameUnlocked: frameForCount(mine.length), // tier tertinggi yang SUDAH berhak dipakai
        currentFrame: user.avatar_frame,
      });
    }

    if (req.method === 'POST') {
      const newAchievements = await reportClientAchievements(sql, user.id, req.body?.ids);
      return res.status(200).json({ newAchievements });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Achievements service unavailable' });
  }
}
