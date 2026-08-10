import { ambilTeksPolos } from "@/utils/terjemahan";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

const KUNCI_FOLDER_EKSPOR = "folder_ekspor_uri";

export async function eksporTeksKeFile(namaFile: string, konten: string): Promise<void> {
  const namaAman = namaFile.replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    let folderUri = await AsyncStorage.getItem(KUNCI_FOLDER_EKSPOR);

    if (!folderUri) {
      const izin = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!izin.granted) {
        return; // pengguna membatalkan pemilihan folder
      }
      folderUri = izin.directoryUri;
      await AsyncStorage.setItem(KUNCI_FOLDER_EKSPOR, folderUri);
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      folderUri,
      namaAman,
      "text/plain"
    );
    await FileSystem.writeAsStringAsync(fileUri, konten, {
      encoding: FileSystem.EncodingType.UTF8,
    });

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