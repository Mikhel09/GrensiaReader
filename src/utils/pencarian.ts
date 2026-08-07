export type HasilCari = {
  babIndex: number | null; // null untuk dokumen tanpa bab (docx/txt)
  cuplikan: string;
};

export function cariDalamTeks(
  teks: string,
  kueri: string,
  batasHasil = 30
): { cuplikan: string }[] {
  if (!kueri.trim()) return [];

  const teksLower = teks.toLowerCase();
  const kueriLower = kueri.toLowerCase();
  const hasil: { cuplikan: string }[] = [];
  let dariIndex = 0;

  while (hasil.length < batasHasil) {
    const idx = teksLower.indexOf(kueriLower, dariIndex);
    if (idx === -1) break;

    const mulai = Math.max(0, idx - 40);
    const akhir = Math.min(teks.length, idx + kueri.length + 40);
    let cuplikan = teks.slice(mulai, akhir).trim();
    if (mulai > 0) cuplikan = "..." + cuplikan;
    if (akhir < teks.length) cuplikan = cuplikan + "...";

    hasil.push({ cuplikan });
    dariIndex = idx + kueri.length;
  }

  return hasil;
}