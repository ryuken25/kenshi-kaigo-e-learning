/* verify-furigana.js
 *
 * Tempel seluruh isi file ini ke console browser, di halaman materi mode ふり.
 * Script ini MENGUKUR posisi huruf sungguhan — sesuatu yang tidak bisa dilakukan
 * oleh `npm run build` maupun cek HTTP 200.
 *
 * Jalankan di 4 tempat: iOS Safari, Chrome Android, Chrome desktop, Firefox desktop.
 * Paste keempat outputnya sebagai bukti.
 */
(function verifyFurigana() {
  const CENTER_TOL = 3;   // px, toleransi kesejajaran tengah
  const OVERLAP_TOL = 1;  // px, toleransi tabrakan

  const rubies = [...document.querySelectorAll('ruby')];
  if (!rubies.length) {
    console.error('❌ Tidak ada <ruby> di halaman ini. Pastikan mode ふり aktif.');
    return;
  }

  const fail = { order: [], center: [], overlap: [], size: [], stretch: [], markup: [] };
  const rtBoxes = [];
  let minRt = Infinity;

  for (const ruby of rubies) {
    const rt = ruby.querySelector('rt');
    const rb = ruby.querySelector('.fg-rb') || ruby.querySelector('rb');

    if (!rt) { fail.markup.push(txt(ruby) + ' — tidak punya <rt>'); continue; }
    if (!rb) { fail.markup.push(txt(ruby) + ' — base tidak dibungkus .fg-rb'); continue; }

    const rtB = rt.getBoundingClientRect();
    const rbB = rb.getBoundingClientRect();
    const label = `${rb.textContent}[${rt.textContent}]`;

    // 1. bacaan harus DI ATAS kanji
    if (rtB.bottom > rbB.top + 2) {
      fail.order.push(`${label} — rt.bottom=${rtB.bottom.toFixed(1)} > rb.top=${rbB.top.toFixed(1)}`);
    }

    // 2. pusat horizontal sejajar
    const dc = Math.abs((rtB.left + rtB.right) / 2 - (rbB.left + rbB.right) / 2);
    if (dc > CENTER_TOL) {
      fail.center.push(`${label} — geser ${dc.toFixed(1)}px`);
    }

    // 3. ukuran font bacaan
    const fs = parseFloat(getComputedStyle(rt).fontSize);
    if (fs < 13) fail.size.push(`${label} — ${fs.toFixed(1)}px`);
    if (fs < minRt) minRt = fs;

    // 4. kanji dalam satu kata tidak diregangkan
    //    lebar base harus mendekati (jumlah karakter × ukuran font)
    const chars = rb.textContent.length;
    const baseFs = parseFloat(getComputedStyle(rb).fontSize);
    const expected = chars * baseFs;
    if (rbB.width > expected * 1.25) {
      fail.stretch.push(
        `${label} — lebar ${rbB.width.toFixed(1)}px, wajar ~${expected.toFixed(1)}px`
      );
    }

    rtBoxes.push({ label, box: rtB });
  }

  // 5. tidak ada dua bacaan yang bertabrakan
  for (let i = 0; i < rtBoxes.length; i++) {
    for (let j = i + 1; j < rtBoxes.length; j++) {
      const a = rtBoxes[i].box, b = rtBoxes[j].box;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > OVERLAP_TOL && oy > OVERLAP_TOL) {
        fail.overlap.push(`${rtBoxes[i].label} ✕ ${rtBoxes[j].label} — tumpang ${ox.toFixed(1)}×${oy.toFixed(1)}px`);
      }
    }
  }

  const n = rubies.length;
  const ok = (arr) => (arr.length === 0 ? '✓' : `✗ ${arr.length}`);

  console.log('\n=== VERIFIKASI FURIGANA ===');
  console.log('UA              :', navigator.userAgent.slice(0, 70));
  console.log('lebar layar     :', window.innerWidth + 'px');
  console.log('token diperiksa :', n);
  console.log('markup benar    :', `${n - fail.markup.length}/${n}`, ok(fail.markup));
  console.log('rt di atas rb   :', `${n - fail.order.length}/${n}`, ok(fail.order));
  console.log('sejajar tengah  :', `${n - fail.center.length}/${n}`, ok(fail.center));
  console.log('tabrakan rt     :', fail.overlap.length, ok(fail.overlap));
  console.log('ukuran rt min   :', isFinite(minRt) ? minRt.toFixed(1) + 'px' : 'n/a', ok(fail.size));
  console.log('kanji melar     :', fail.stretch.length, ok(fail.stretch));

  for (const [k, arr] of Object.entries(fail)) {
    if (!arr.length) continue;
    console.group(`\n--- ${k.toUpperCase()} (${arr.length}) ---`);
    arr.slice(0, 12).forEach((s) => console.log('  ' + s));
    if (arr.length > 12) console.log(`  … dan ${arr.length - 12} lagi`);
    console.groupEnd();
  }

  const total = Object.values(fail).reduce((a, b) => a + b.length, 0);
  console.log(total === 0 ? '\n✅ LULUS\n' : `\n❌ GAGAL — ${total} masalah\n`);
  return total === 0;

  function txt(el) { return (el.textContent || '').slice(0, 12); }
})();
