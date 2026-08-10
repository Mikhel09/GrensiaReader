import * as MLKitTranslate from "@react-native-ml-kit/translate-text";
import { TranslateLanguage } from "@react-native-ml-kit/translate-text";

const TranslateText = MLKitTranslate.default;
const PEMISAH = "\n<<<PISAH>>>\n";

export type MetodeTerjemahan = "mlkit" | "google";

export type Bahasa = {
  label: string;
  mlkit: TranslateLanguage;
  google: string; // kode ISO untuk Google Translate
};

export const DAFTAR_BAHASA: Bahasa[] = [
  { label: "Inggris", mlkit: TranslateLanguage.ENGLISH, google: "en" },
  { label: "Cina", mlkit: TranslateLanguage.CHINESE, google: "zh-CN" },
  { label: "Jepang", mlkit: TranslateLanguage.JAPANESE, google: "ja" },
  { label: "Korea", mlkit: TranslateLanguage.KOREAN, google: "ko" },
  { label: "Indonesia", mlkit: TranslateLanguage.INDONESIAN, google: "id" },
];

// --- Mesin 1: ML Kit (offline) ---
async function terjemahkanMLKit(
  teks: string,
  dari: TranslateLanguage,
  ke: TranslateLanguage
): Promise<string> {
  const hasil = await TranslateText.translate({
    text: teks,
    sourceLanguage: dari,
    targetLanguage: ke,
    downloadModelIfNeeded: true,
  } as any);
  return (hasil as any).text ?? (hasil as any).translatedText ?? String(hasil);
}

// --- Mesin 2: Google Translate (tidak resmi, butuh internet) ---
async function terjemahkanGoogle(
  teks: string,
  dari: string,
  ke: string
): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${dari}&tl=${ke}&dt=t&q=${encodeURIComponent(teks)}`;
  const respons = await fetch(url);
  const data = await respons.json();
  // Struktur responsnya: [[["teks terjemahan", "teks asli", ...], ...], ...]
  return data[0].map((bagian: any) => bagian[0]).join("");
}

// Fungsi utama: pilih mesin sesuai metode yang dipilih
export async function terjemahkanTeks(
  teks: string,
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
): Promise<string> {
  if (!teks.trim()) return teks;
  if (metode === "google") {
    return terjemahkanGoogle(teks, bahasaSumber.google, bahasaTujuan.google);
  }
  return terjemahkanMLKit(teks, bahasaSumber.mlkit, bahasaTujuan.mlkit);
}

async function terjemahkanBanyakDigabung(
  daftarTeks: string[],
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan,
  ukuranGrup = 25
): Promise<string[]> {
  const hasilAkhir: string[] = [];

  for (let i = 0; i < daftarTeks.length; i += ukuranGrup) {
    const grup = daftarTeks.slice(i, i + ukuranGrup);
    const gabungan = grup.join(PEMISAH);

    const hasilGabungan = await terjemahkanTeks(gabungan, bahasaSumber, bahasaTujuan, metode);
    const pecahan = hasilGabungan.split(/<<<\s*PISAH\s*>>>/i).map((s) => s.trim());

    if (pecahan.length !== grup.length) {
      const satuSatu = await Promise.all(
        grup.map((t) => terjemahkanTeks(t, bahasaSumber, bahasaTujuan, metode))
      );
      hasilAkhir.push(...satuSatu);
    } else {
      hasilAkhir.push(...pecahan);
    }
  }

  return hasilAkhir;
}

const TAG_BLOK = ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"];

function namaTag(tag: string): string {
  const cocok = tag.match(/^<\/?\s*([a-zA-Z0-9]+)/);
  return cocok ? cocok[1].toLowerCase() : "";
}

export async function terjemahkanHtml(
  html: string,
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
): Promise<string> {
  // Pecah HTML jadi blok-blok berdasarkan tag pembuka/tutup blok (<p>, <div>, dst),
  // supaya kalimat yang mengandung format inline (italic/bold) tetap utuh satu potong.
  const tokens = html.split(/(<\/?[a-zA-Z0-9]+[^>]*>)/g);

  const blokList: string[] = [];
  let bufferTeksPolos = "";

  function tutupBlok() {
    blokList.push(bufferTeksPolos);
    bufferTeksPolos = "";
  }

  const susunanTag: string[] = [];

  for (const tok of tokens) {
    const adalahTag = tok.startsWith("<");
    if (adalahTag) {
      const nama = namaTag(tok);
      if (TAG_BLOK.includes(nama)) {
        tutupBlok();
        susunanTag.push("<<<BLOK>>>");
        susunanTag.push(tok);
      }
      // tag inline (italic/bold/dst) dibuang begitu saja untuk versi terjemahan
    } else {
      bufferTeksPolos += tok;
    }
  }
  tutupBlok();

  // Susun ulang: setiap kali ketemu penanda <<<BLOK>>>, ambil isi blok berikutnya dari blokList
  let idxBlok = 0;
  const potongan: { tag?: string; blokIndex?: number }[] = [];
  for (let i = 0; i < susunanTag.length; i++) {
    if (susunanTag[i] === "<<<BLOK>>>") {
      potongan.push({ blokIndex: idxBlok });
      idxBlok++;
      i++; // lewati, tag penyertanya diambil di baris berikut
      potongan.push({ tag: susunanTag[i] });
    }
  }

  const teksUntukDiterjemahkan = blokList.filter((b) => b.trim());
  const hasilTerjemahan =
    teksUntukDiterjemahkan.length > 0
      ? await terjemahkanBanyakDigabung(teksUntukDiterjemahkan, bahasaSumber, bahasaTujuan, metode)
      : [];

  let cursorHasil = 0;
  const blokHasil = blokList.map((b) => {
    if (!b.trim()) return b;
    const hasil = hasilTerjemahan[cursorHasil] ?? b;
    cursorHasil++;
    return hasil;
  });

  let output = "";
  for (const p of potongan) {
    if (p.tag !== undefined) {
      output += p.tag;
    } else if (p.blokIndex !== undefined) {
      output += blokHasil[p.blokIndex] || "";
    }
  }

  return output;
}

export async function terjemahkanTeksPolos(
  teks: string,
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
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
    bahasaSumber,
    bahasaTujuan,
    metode
  );

  const barisBaru = [...baris];
  indexBerisi.forEach((idx, i) => {
    barisBaru[idx] = hasilTerjemahan[i] ?? barisBaru[idx];
  });

  return barisBaru.join("\n");
}

// Pisah teks jadi per-kalimat (bukan potong sembarangan), supaya konteks kalimat tetap utuh
function pecahJadiKalimat(teks: string): string[] {
  const teksBersih = teks.replace(/\s+/g, " ").trim();
  const kalimat = teksBersih.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return kalimat ? kalimat.map((s) => s.trim()).filter(Boolean) : [teksBersih];
}

function bersihkanSpasi(teks: string): string {
  return teks
    .replace(/[ \t]+/g, " ")             // spasi ganda jadi satu spasi
    .replace(/[ \t]+([.,!?;:])/g, "$1")  // hapus spasi nyasar sebelum tanda baca
    .trim();
}

export function gabungkanKalimatLintasHalaman(halaman: string[]): string[] {
  const hasil = [...halaman];

  for (let i = 0; i < hasil.length - 1; i++) {
    const teksIni = hasil[i].trimEnd();
    if (!teksIni) continue;

    // Kalau halaman ini sudah berakhir dengan tanda baca penutup kalimat, tidak perlu disambung
    const berakhirLengkap = /[.!?"'\u201d\u2019)]\s*$/.test(teksIni);
    if (berakhirLengkap) continue;

    const halamanBerikut = hasil[i + 1];
    const cocok = halamanBerikut.match(/^[\s\S]*?[.!?]+(["'\u201d\u2019)]*)(\s+|$)/);

    let ambil: string;
    if (cocok) {
      ambil = cocok[0];
    } else {
      const idxParagrafBaru = halamanBerikut.indexOf("\n\n");
      ambil = idxParagrafBaru !== -1 ? halamanBerikut.slice(0, idxParagrafBaru) : halamanBerikut;
    }

    hasil[i] = teksIni + " " + ambil.trim();
    hasil[i + 1] = halamanBerikut.slice(ambil.length);
  }

  return hasil;
}

export async function terjemahkanTeksPanjang(
  teks: string,
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
): Promise<string> {
  if (!teks.trim()) return teks;

  const paragraf = teks.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraf.length === 0) return teks;

  const semuaKalimat: string[] = [];
  const jumlahKalimatPerParagraf: number[] = [];
  for (const p of paragraf) {
    const kalimat = pecahJadiKalimat(p);
    jumlahKalimatPerParagraf.push(kalimat.length);
    semuaKalimat.push(...kalimat);
  }

  const hasilKalimat = await terjemahkanBanyakDigabung(semuaKalimat, bahasaSumber, bahasaTujuan, metode);

  const paragrafHasil: string[] = [];
  let idx = 0;
  for (const jumlah of jumlahKalimatPerParagraf) {
    const gabunganParagraf = hasilKalimat.slice(idx, idx + jumlah).join(" ");
    paragrafHasil.push(bersihkanSpasi(gabunganParagraf));
    idx += jumlah;
  }

  return paragrafHasil.join("\n\n");
}

export function ambilTeksPolos(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}