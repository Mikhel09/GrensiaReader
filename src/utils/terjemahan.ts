import * as MLKitTranslate from "@react-native-ml-kit/translate-text";

const TranslateText = MLKitTranslate.default;
const PEMISAH = "\n<<<PISAH>>>\n";

export async function terjemahkanTeks(
  teks: string,
  dariBahasa: any,
  keBahasa: any
): Promise<string> {
  if (!teks.trim()) return teks;
  const hasil = await TranslateText.translate({
    text: teks,
    sourceLanguage: dariBahasa,
    targetLanguage: keBahasa,
    downloadModelIfNeeded: true,
  } as any);
  return (hasil as any).text ?? (hasil as any).translatedText ?? String(hasil);
}

// Gabungkan banyak teks pendek jadi satu kiriman besar (dipisah token khusus),
// supaya jumlah pemanggilan translate() jauh berkurang.
async function terjemahkanBanyakDigabung(
  daftarTeks: string[],
  dariBahasa: any,
  keBahasa: any,
  ukuranGrup = 25
): Promise<string[]> {
  const hasilAkhir: string[] = [];

  for (let i = 0; i < daftarTeks.length; i += ukuranGrup) {
    const grup = daftarTeks.slice(i, i + ukuranGrup);
    const gabungan = grup.join(PEMISAH);

    const hasilGabungan = await terjemahkanTeks(gabungan, dariBahasa, keBahasa);
    const pecahan = hasilGabungan.split(/<<<\s*PISAH\s*>>>/i).map((s) => s.trim());

    // Kalau jumlah pecahan tidak cocok (pemisah rusak saat diterjemahkan),
    // fallback: terjemahkan satu-satu untuk grup ini saja
    if (pecahan.length !== grup.length) {
      const satuSatu = await Promise.all(
        grup.map((t) => terjemahkanTeks(t, dariBahasa, keBahasa))
      );
      hasilAkhir.push(...satuSatu);
    } else {
      hasilAkhir.push(...pecahan);
    }
  }

  return hasilAkhir;
}

export async function terjemahkanHtml(
  html: string,
  dariBahasa: any,
  keBahasa: any
): Promise<string> {
  const bagian = html.split(/(<[^>]+>)/g);

  const indexTeks: number[] = [];
  const teksUntukDiterjemahkan: string[] = [];

  bagian.forEach((potongan, i) => {
    const adalahTag = potongan.startsWith("<");
    if (!adalahTag && potongan.trim()) {
      indexTeks.push(i);
      teksUntukDiterjemahkan.push(potongan);
    }
  });

  const hasilTerjemahan = await terjemahkanBanyakDigabung(
    teksUntukDiterjemahkan,
    dariBahasa,
    keBahasa
  );

  const bagianBaru = [...bagian];
  indexTeks.forEach((idx, i) => {
    bagianBaru[idx] = hasilTerjemahan[i] ?? bagianBaru[idx];
  });

  return bagianBaru.join("");
}

export async function terjemahkanTeksPolos(
  teks: string,
  dariBahasa: any,
  keBahasa: any
): Promise<string> {
  const baris = teks.split("\n");
  const indexBerisi: number[] = [];
  const barisUntukDiterjemahkan: string[] = [];

  baris.forEach((satuBaris, i) => {
    if (satuBaris.trim()) {
      indexBerisi.push(i);
      barisUntukDiterjemahkan.push(satuBaris);
    }
  });

  const hasilTerjemahan = await terjemahkanBanyakDigabung(
    barisUntukDiterjemahkan,
    dariBahasa,
    keBahasa
  );

  const barisBaru = [...baris];
  indexBerisi.forEach((idx, i) => {
    barisBaru[idx] = hasilTerjemahan[i] ?? barisBaru[idx];
  });

  return barisBaru.join("\n");
}

export function ambilTeksPolos(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
