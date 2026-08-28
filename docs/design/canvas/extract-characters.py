# extract-characters.py — potong 18 karakter dari lembar referensi jadi PNG transparan.
#
# Sumber: satu PNG lembar, 3 baris (Momo/Yuki/Luna) x 7 kolom (profil + 6 ekspresi).
# Latar kartu berupa gradasi pastel yang menyatu dengan latar baris, jadi deteksi
# "kotak kartu" tidak pernah bersih. Yang dipakai di sini SILUET, bukan kotak:
#
#   1. Mask piksel gelap (garis luar, mata, badan Luna). Ambang per baris karena
#      badan Luna memang gelap sementara Momo & Yuki putih.
#   2. Dilasi kecil menutup celah antialias di garis luar.
#   3. Isi lubang -> siluet penuh termasuk bidang putih di dalam garis.
#   4. Erosi balik sebanyak dilasi supaya tepi kembali ke garis aslinya.
#   5. Label komponen. Tujuh terbesar per baris = profil + 6 ekspresi.
#   6. Komponen utama diambil LANGSUNG dari peta label baris (bukan dari jendela
#      potongan) — versi sebelumnya membuang badan utama karena telinga/lengan
#      menyentuh tepi jendela, hasilnya karakter bolong tinggal garis luar.
#   7. Hiasan (hati, zzz, kilau, awan) ikut kalau centroid-nya di rentang x karakter
#      itu dan bentuknya tidak tipis-melengkung seperti garis tepi kartu.
#
# Output: chars/<karakter>-<ekspresi>.png (RGBA, lebar maksimum MAXW)
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else r"D:\Download\ChatGPT Image Aug 28, 2026, 11_32_48 AM.png"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "chars")
MAXW = 300
KEEP_DECO = os.environ.get("KEEP_DECO") == "1"
EXPRS = ["idle", "happy", "sad", "sleepy", "surprised", "clap"]
# (nama, y0, y1, ambang gelap) — pita baris dari klasifikasi warna gutter
# (nama, y0, y1, ambang gelap, dilasi) — yuki butuh dilasi lebih besar: garis luar
# badannya paling terang, di pose clap ada celah sehingga isi lubang bocor keluar.
ROWS = [("momo", 100, 363, 195, 3), ("yuki", 365, 661, 208, 4), ("luna", 662, 929, 210, 3)]
DECO_MIN = 130      # piksel; di bawah ini dianggap noise
DECO_PAD = 26       # seberapa jauh dari bbox karakter hiasan masih dianggap miliknya
# Hiasan melayang (hati, zzz, awan hujan, kilau) SENGAJA dibuang: di lembar referensi
# hiasan itu bagian dari kartu stiker, tapi di dalam UI produk maskot dipakai di
# header 34px dan di kartu 46px — hiasan jadi noda yang tidak terbaca. Ekspresi
# tetap terbaca dari wajah & pose. Set KEEP_DECO=1 kalau butuh versi stikernya.

os.makedirs(OUT, exist_ok=True)
a = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
lum = a.mean(axis=2)
H, W = lum.shape

report, warn = [], []
for name, y0, y1, thr, DILATE in ROWS:
    dark = lum[y0:y1] < thr
    grown = ndimage.binary_dilation(dark, iterations=DILATE)
    filled = ndimage.binary_fill_holes(grown)
    mask = ndimage.binary_erosion(filled, iterations=DILATE)

    lab, n = ndimage.label(mask)
    slices = ndimage.find_objects(lab)
    comps = []
    for i, sl in enumerate(slices, start=1):
        if sl is None:
            continue
        sub = lab[sl] == i
        area = int(sub.sum())
        if area < DECO_MIN:
            continue
        ys, xs = sl
        bw, bh = xs.stop - xs.start, ys.stop - ys.start
        comps.append({"id": i, "sl": sl, "area": area, "x0": xs.start, "x1": xs.stop,
                      "y0": ys.start, "y1": ys.stop, "fill": area / float(bw * bh)})

    big = sorted([c for c in comps if c["area"] >= 2500], key=lambda c: -c["area"])[:7]
    if len(big) < 7:
        warn.append(f"{name}: cuma {len(big)} komponen besar (butuh 7) — periksa ambang {thr}")
        continue
    big.sort(key=lambda c: (c["x0"] + c["x1"]) / 2)

    for expr, b in zip(EXPRS, big[1:7]):
        keep = np.zeros_like(mask)
        keep[b["sl"]] |= lab[b["sl"]] == b["id"]          # badan utama, tanpa syarat
        for c in (comps if KEEP_DECO else []):
            if c["id"] == b["id"] or c["area"] >= 2500:
                continue
            cx = (c["x0"] + c["x1"]) / 2
            if not (b["x0"] - DECO_PAD <= cx <= b["x1"] + DECO_PAD):
                continue
            # garis lengkung tepi kartu: tipis dan bbox-nya nyaris kosong
            if c["area"] < 900 and c["fill"] < 0.20:
                continue
            keep[c["sl"]] |= lab[c["sl"]] == c["id"]

        ys, xs = np.where(keep)
        py0, py1, px0, px1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = a[y0:y1][py0:py1, px0:px1]
        # feather 0.45 + ambang lebih tinggi: sisa halo latar di tepi garis luar hilang
        alpha = ndimage.gaussian_filter(keep[py0:py1, px0:px1].astype(np.float32), 0.45)
        alpha = np.clip((alpha - 0.52) / 0.30, 0, 1)

        out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
        if out.width > MAXW:
            out = out.resize((MAXW, round(out.height * MAXW / out.width)), Image.LANCZOS)
        path = os.path.join(OUT, f"{name}-{expr}.png")
        out.save(path, optimize=True)
        solid = float((np.asarray(out)[:, :, 3] > 200).mean())
        report.append(f"{name}-{expr}: {out.width}x{out.height} {os.path.getsize(path)//1024}KB isi={solid:.0%}")

print("\n".join(report))
if warn:
    print("\nPERINGATAN:\n" + "\n".join(warn))
