import { bungkusHtml, teksParagrafKeHtml } from "@/utils/tampilan";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

const KUNCI_FOLDER_EKSPOR = "folder_ekspor_uri";

async function pastikanFolderTerpilih(): Promise<string | null> {
  let folderUri = await AsyncStorage.getItem(KUNCI_FOLDER_EKSPOR);
  if (!folderUri) {
    const izin = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!izin.granted) return null;
    folderUri = izin.directoryUri;
    await AsyncStorage.setItem(KUNCI_FOLDER_EKSPOR, folderUri);
  }
  return folderUri;
}

export async function eksporTeksKeFile(namaFile: string, konten: string, mimeType: string): Promise<void> {
  const namaAman = namaFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const folderUri = await pastikanFolderTerpilih();
    if (!folderUri) return;

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(folderUri, namaAman, mimeType);
    await FileSystem.writeAsStringAsync(fileUri, konten, { encoding: FileSystem.EncodingType.UTF8 });

    Alert.alert("Berhasil disimpan", `File "${namaAman}" telah disimpan ke folder pilihanmu.`);
  } catch (err) {
    console.log("Gagal menyimpan file:", err);
    try {
      await AsyncStorage.removeItem(KUNCI_FOLDER_EKSPOR);
    } catch {}
    Alert.alert("Gagal menyimpan", "Terjadi kesalahan. Coba tekan tombol ekspor sekali lagi untuk memilih folder ulang.");
  }
}

export async function eksporFileBiner(namaFile: string, base64Konten: string, mimeType: string): Promise<void> {
  const namaAman = namaFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const folderUri = await pastikanFolderTerpilih();
    if (!folderUri) return;

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(folderUri, namaAman, mimeType);
    await FileSystem.writeAsStringAsync(fileUri, base64Konten, { encoding: FileSystem.EncodingType.Base64 });

    Alert.alert("Berhasil disimpan", `File "${namaAman}" telah disimpan ke folder pilihanmu.`);
  } catch (err) {
    console.log("Gagal menyimpan file biner:", err);
    try {
      await AsyncStorage.removeItem(KUNCI_FOLDER_EKSPOR);
    } catch {}
    Alert.alert("Gagal menyimpan", "Terjadi kesalahan. Coba tekan tombol ekspor sekali lagi untuk memilih folder ulang.");
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

export function susunEksporHtmlDokumen(namaBuku: string, htmlAtauTeks: string, tipe: "html" | "teks"): string {
  const bodyIsi = tipe === "html" ? htmlAtauTeks : `<pre>${htmlAtauTeks}</pre>`;
  return bungkusHtml(`<h1>${namaBuku}</h1>${bodyIsi}`, 18, false);
}

export function susunEksporHtmlPdf(
  namaBuku: string,
  jumlahHalaman: number,
  cacheTerjemahan: Record<number, string>
): string {
  let body = `<h1>${namaBuku}</h1>`;
  for (let i = 0; i < jumlahHalaman; i++) {
    body += `<h2>Halaman ${i + 1}</h2>`;
    body += cacheTerjemahan[i] ? teksParagrafKeHtml(cacheTerjemahan[i]) : "<p>[Halaman ini belum diterjemahkan]</p>";
  }
  return bungkusHtml(body, 18, false);
}

export function susunEksporTeksPolos(namaBuku: string, htmlAtauTeks: string, tipe: "html" | "teks"): string {
  const isi = tipe === "html" ? htmlKeTeksBerparagraf(htmlAtauTeks) : htmlAtauTeks;
  return `${namaBuku}\n${"=".repeat(namaBuku.length)}\n\n${isi}`;
}