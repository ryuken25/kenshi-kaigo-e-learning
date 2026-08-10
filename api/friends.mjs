import { db } from './_db.mjs';
import { requireUser } from './_auth.mjs';
import { evaluateAchievements } from './_achievements.mjs';

// Sistem pertemanan — model SATU BARIS PER ARAH:
//   pending  : user_id meminta friend_id jadi teman
//   accepted : DUA baris (A→B dan B→A) — pertemanan sah selalu sepasang,
//              supaya query daftar teman tinggal satu arah per baris
//   blocked  : satu baris; yang memblokir = user_id
//
// Semua aksi memakai HANDLE target (bukan uuid) — handle adalah identitas
// publik yang dilihat & diketik user, dan tidak membocorkan ID internal.
//
// GET  /api/friends          → { friends, incoming, outgoing }
// GET  /api/friends?q=handle → cari user + status relasi (sebelum add)
// POST /api/friends          → body { action, handle }
//      action: request | accept | remove | block | unblock

const publicUser = (u) => ({
  handle: u.handle, displayName: u.display_name || u.handle,
  avatarKey: u.avatar_key, avatarFrame: u.avatar_frame,
  characterId: u.character_id || 'momo',
  totalXp: u.total_xp, streak: u.streak_current,
});

async function resolveByHandle(sql, handle) {
  const rows = await sql`
    SELECT id, handle, display_name, avatar_key, avatar_frame, character_id, total_xp, streak_current
    FROM app_users WHERE handle=${String(handle || '').trim().toLowerCase()}`;
  return rows[0] || null;
}

async function pairRows(sql, a, b) {
  return sql`SELECT user_id, friend_id, status FROM friendships
    WHERE (user_id=${a} AND friend_id=${b}) OR (user_id=${b} AND friend_id=${a})`;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store');

      // Mode cari: ?q=handle — exact match, plus status relasi dengan user login.
      const q = String(req.query?.q || '').trim().toLowerCase();
      if (q) {
        const target = await resolveByHandle(sql, q);
        if (!target) return res.status(200).json({ result: null });
        if (target.id === user.id) return res.status(200).json({ result: { ...publicUser(target), relationship: 'self' } });
        const rows = await pairRows(sql, user.id, target.id);
        const mine = rows.find(r => r.user_id === user.id), theirs = rows.find(r => r.user_id === target.id);
        let relationship = 'none';
        if (mine?.status === 'blocked' || theirs?.status === 'blocked') relationship = 'blocked';
        else if (mine?.status === 'accepted' || theirs?.status === 'accepted') relationship = 'friend';
        else if (mine?.status === 'pending') relationship = 'outgoing';
        else if (theirs?.status === 'pending') relationship = 'incoming';
        return res.status(200).json({ result: { ...publicUser(target), relationship } });
      }

      // Daftar lengkap. Dua UNION (bukan CASE join): lebih gampang dibaca
      // dan tetap kena index friendships_user_idx / friendships_friend_idx.
      const friends = await sql`
        SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.total_xp, u.streak_current
        FROM friendships f JOIN app_users u ON u.id = f.friend_id
        WHERE f.user_id=${user.id} AND f.status='accepted'
        UNION
        SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.total_xp, u.streak_current
        FROM friendships f JOIN app_users u ON u.id = f.user_id
        WHERE f.friend_id=${user.id} AND f.status='accepted'
        ORDER BY total_xp DESC`;
      const incoming = await sql`
        SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.total_xp, u.streak_current, f.created_at
        FROM friendships f JOIN app_users u ON u.id = f.user_id
        WHERE f.friend_id=${user.id} AND f.status='pending' ORDER BY f.created_at DESC`;
      const outgoing = await sql`
        SELECT u.handle, u.display_name, u.avatar_key, u.avatar_frame, u.total_xp, u.streak_current, f.created_at
        FROM friendships f JOIN app_users u ON u.id = f.friend_id
        WHERE f.user_id=${user.id} AND f.status='pending' ORDER BY f.created_at DESC`;
      return res.status(200).json({ friends: friends.map(publicUser), incoming: incoming.map(publicUser), outgoing: outgoing.map(publicUser) });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = String(body.action || '');
      const target = await resolveByHandle(sql, body.handle);
      if (!target) return res.status(404).json({ error: 'user_not_found', message: 'Handle tidak ditemukan' });
      if (target.id === user.id) return res.status(400).json({ error: 'invalid_input', message: 'Tidak bisa untuk diri sendiri' });
      const rows = await pairRows(sql, user.id, target.id);
      const mine = rows.find(r => r.user_id === user.id), theirs = rows.find(r => r.user_id === target.id);

      if (action === 'request') {
        if (mine?.status === 'blocked' || theirs?.status === 'blocked') return res.status(403).json({ error: 'blocked', message: 'Tidak bisa mengirim permintaan' });
        if (mine?.status === 'accepted' || theirs?.status === 'accepted') return res.status(409).json({ error: 'already_friends', message: 'Kalian sudah berteman' });
        if (mine?.status === 'pending') return res.status(409).json({ error: 'already_requested', message: 'Permintaan sudah dikirim' });
        let autoAccepted = false;
        if (theirs?.status === 'pending') {
          // Dia sudah minta duluan → langsung sah tanpa round-trip kedua.
          await sql`UPDATE friendships SET status='accepted', updated_at=now() WHERE user_id=${target.id} AND friend_id=${user.id}`;
          await sql`INSERT INTO friendships(user_id, friend_id, status) VALUES(${user.id}, ${target.id}, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status='accepted', updated_at=now()`;
          autoAccepted = true;
        } else {
          await sql`INSERT INTO friendships(user_id, friend_id, status) VALUES(${user.id}, ${target.id}, 'pending') ON CONFLICT (user_id, friend_id) DO UPDATE SET status='pending', updated_at=now()`;
        }
        const newAchievements = await evaluateAchievements(sql, user.id);
        return res.status(200).json({ ok: true, autoAccepted, newAchievements });
      }

      if (action === 'accept') {
        if (!theirs || theirs.status !== 'pending') return res.status(409).json({ error: 'no_pending_request', message: 'Tidak ada permintaan masuk dari user ini' });
        await sql`UPDATE friendships SET status='accepted', updated_at=now() WHERE user_id=${target.id} AND friend_id=${user.id}`;
        await sql`INSERT INTO friendships(user_id, friend_id, status) VALUES(${user.id}, ${target.id}, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status='accepted', updated_at=now()`;
        const newAchievements = await evaluateAchievements(sql, user.id);
        return res.status(200).json({ ok: true, newAchievements });
      }

      if (action === 'remove') {
        await sql`DELETE FROM friendships WHERE (user_id=${user.id} AND friend_id=${target.id} AND status='accepted') OR (user_id=${target.id} AND friend_id=${user.id} AND status='accepted')`;
        return res.status(200).json({ ok: true });
      }

      if (action === 'decline') {
        // Tolak permintaan masuk: buang baris pending milik target.
        if (!theirs || theirs.status !== 'pending') return res.status(409).json({ error: 'no_pending_request', message: 'Tidak ada permintaan masuk dari user ini' });
        await sql`DELETE FROM friendships WHERE user_id=${target.id} AND friend_id=${user.id} AND status='pending'`;
        return res.status(200).json({ ok: true });
      }

      if (action === 'cancel') {
        // Batalkan permintaan keluar milik sendiri.
        if (!mine || mine.status !== 'pending') return res.status(409).json({ error: 'no_outgoing_request', message: 'Tidak ada permintaan keluar ke user ini' });
        await sql`DELETE FROM friendships WHERE user_id=${user.id} AND friend_id=${target.id} AND status='pending'`;
        return res.status(200).json({ ok: true });
      }

      if (action === 'block') {
        // Blokir menghapus semua baris dua arah, lalu menulis SATU baris blocked.
        await sql`DELETE FROM friendships WHERE (user_id=${user.id} AND friend_id=${target.id}) OR (user_id=${target.id} AND friend_id=${user.id})`;
        await sql`INSERT INTO friendships(user_id, friend_id, status) VALUES(${user.id}, ${target.id}, 'blocked')`;
        return res.status(200).json({ ok: true });
      }

      if (action === 'unblock') {
        await sql`DELETE FROM friendships WHERE user_id=${user.id} AND friend_id=${target.id} AND status='blocked'`;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'invalid_input', message: 'action: request | accept | decline | cancel | remove | block | unblock' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Friends service unavailable' });
  }
}
