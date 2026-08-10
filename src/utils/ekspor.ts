import { ambilTeksPolos } from "@/utils/terjemahan";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function eksporTeksKeFile(namaFile: string, konten: string): Promise<void> {
  const namaAman = namaFile.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = FileSystem.documentDirectory + namaAman;
  await FileSystem.writeAsStringAsync(path, konten, { encoding: FileSystem.EncodingType.UTF8 });

  const tersedia = await Sharing.isAvailableAsync();
  if (tersedia) {
    await Sharing.shareAsync(path, {
      mimeType: "text/plain",
      dialogTitle: "Simpan atau bagikan hasil terjemahan",
    });
  }
}

export function susunEksporEpub(
  judulBuku: string,
  jumlahBab: number,
  cacheTerjemahan: Record<number, string>
): string {
  let out = `${judulBuku}\n${"=".repeat(judulBuku.length)}\n\n`;
  for (let i = 0; i < jumlahBab; i++) {
    out += `--- Bab ${i + 1} ---\n\n`;
    out += cacheTerjemahan[i] ? ambilTeksPolos(cacheTerjemahan[i]) + "\n\n" : "[Bab ini belum diterjemahkan]\n\n";
  }
  return out;
}

export function susunEksporPdf(
  namaBuku: string,
  jumlahHalaman: number,
  cacheTerjemahan: Record<number, string>
): string {
  let out = `${namaBuku}\n${"=".repeat(namaBuku.length)}\n\n`;
  for (let i = 0; i < jumlahHalaman; i++) {
    out += `--- Halaman ${i + 1} ---\n\n`;
    out += cacheTerjemahan[i] ? cacheTerjemahan[i] + "\n\n" : "[Halaman ini belum diterjemahkan]\n\n";
  }
  return out;
}

export function susunEksporDokumen(namaBuku: string, htmlAtauTeks: string, tipe: "html" | "teks"): string {
  const isi = tipe === "html" ? ambilTeksPolos(htmlAtauTeks) : htmlAtauTeks;
  return `${namaBuku}\n${"=".repeat(namaBuku.length)}\n\n${isi}`;
}