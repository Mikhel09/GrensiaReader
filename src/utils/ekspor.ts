import { bungkusHtml, teksParagrafKeHtml } from "@/utils/tampilan";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

const KUNCI_FOLDER_EKSPOR = "folder_ekspor_uri";

export type FormatEkspor = "txt" | "html";

export function tanyaFormatEkspor(onPilih: (format: FormatEkspor) => void) {
  Alert.alert("Pilih Format", "Simpan hasil terjemahan sebagai:", [
    { text: "Batal", style: "cancel" },
    { text: "Teks (.txt)", onPress: () => onPilih("txt") },
    { text: "HTML (.html)", onPress: () => onPilih("html") },
  ]);
}

export async function eksporTeksKeFile(namaFile: string, konten: string, mimeType: string): Promise<void> {
  const namaAman = namaFile.replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    let folderUri = await AsyncStorage.getItem(KUNCI_FOLDER_EKSPOR);

    if (!folderUri) {
      const izin = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!izin.granted) return;
      folderUri = izin.directoryUri;
      await AsyncStorage.setItem(KUNCI_FOLDER_EKSPOR, folderUri);
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(folderUri, namaAman, mimeType);
    await FileSystem.writeAsStringAsync(fileUri, konten, { encoding: FileSystem.EncodingType.UTF8 });

    Alert.alert("Berhasil disimpan", `File "${namaAman}" telah disimpan ke folder pilihanmu.`);
  } catch (err) {
    console.log("Gagal menyimpan file, mencoba minta folder baru:", err);
    try {
      await AsyncStorage.removeItem(KUNCI_FOLDER_EKSPOR);
    } catch {}
    Alert.alert(
      "Gagal menyimpan",
      "Terjadi kesalahan saat menyimpan file. Coba tekan tombol ekspor sekali lagi untuk memilih folder ulang."
    );
  }
}

// Ubah HTML jadi teks polos TAPI tetap menjaga jeda antar paragraf
function htmlKeTeksBerparagraf(html: string): string {
  const teksDenganPenanda = html
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\u0000")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ");

  return teksDenganPenanda
    .split("\u0000")
    .map((bagian) => bagian.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function susunEksporEpub(
  judulBuku: string,
  jumlahBab: number,
  cacheTerjemahan: Record<number, string>,
  format: FormatEkspor
): string {
  if (format === "txt") {
    let out = `${judulBuku}\n${"=".repeat(judulBuku.length)}\n\n`;
    for (let i = 0; i < jumlahBab; i++) {
      out += `--- Bab ${i + 1} ---\n\n`;
      out += cacheTerjemahan[i]
        ? htmlKeTeksBerparagraf(cacheTerjemahan[i]) + "\n\n"
        : "[Bab ini belum diterjemahkan]\n\n";
    }
    return out;
  }

  let body = `<h1>${judulBuku}</h1>`;
  for (let i = 0; i < jumlahBab; i++) {
    body += `<h2>Bab ${i + 1}</h2>`;
    body += cacheTerjemahan[i] || "<p>[Bab ini belum diterjemahkan]</p>";
  }
  return bungkusHtml(body, 18, false);
}

export function susunEksporPdf(
  namaBuku: string,
  jumlahHalaman: number,
  cacheTerjemahan: Record<number, string>,
  format: FormatEkspor
): string {
  if (format === "txt") {
    let out = `${namaBuku}\n${"=".repeat(namaBuku.length)}\n\n`;
    for (let i = 0; i < jumlahHalaman; i++) {
      out += `--- Halaman ${i + 1} ---\n\n`;
      out += cacheTerjemahan[i] ? cacheTerjemahan[i] + "\n\n" : "[Halaman ini belum diterjemahkan]\n\n";
    }
    return out;
  }

  let body = `<h1>${namaBuku}</h1>`;
  for (let i = 0; i < jumlahHalaman; i++) {
    body += `<h2>Halaman ${i + 1}</h2>`;
    body += cacheTerjemahan[i] ? teksParagrafKeHtml(cacheTerjemahan[i]) : "<p>[Halaman ini belum diterjemahkan]</p>";
  }
  return bungkusHtml(body, 18, false);
}

export function susunEksporDokumen(
  namaBuku: string,
  htmlAtauTeks: string,
  tipe: "html" | "teks",
  format: FormatEkspor
): string {
  if (format === "txt") {
    const isi = tipe === "html" ? htmlKeTeksBerparagraf(htmlAtauTeks) : htmlAtauTeks;
    return `${namaBuku}\n${"=".repeat(namaBuku.length)}\n\n${isi}`;
  }

  const bodyIsi = tipe === "html" ? htmlAtauTeks : `<pre>${htmlAtauTeks}</pre>`;
  return bungkusHtml(`<h1>${namaBuku}</h1>${bodyIsi}`, 18, false);
}