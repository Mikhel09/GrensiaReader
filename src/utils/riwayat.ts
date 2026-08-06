import AsyncStorage from "@react-native-async-storage/async-storage";

export type BukuRiwayat = {
  uri: string;
  nama: string;
  tipe: "pdf" | "epub" | "txt" | "docx";
  babTerakhir: number;
  waktuDibuka: number;
};

const KUNCI_PENYIMPANAN = "riwayat_buku";

export async function ambilRiwayat(): Promise<BukuRiwayat[]> {
  try {
    const data = await AsyncStorage.getItem(KUNCI_PENYIMPANAN);
    if (!data) return [];
    const daftar: BukuRiwayat[] = JSON.parse(data);
    return daftar.sort((a, b) => b.waktuDibuka - a.waktuDibuka);
  } catch {
    return [];
  }
}

export async function simpanRiwayat(buku: Omit<BukuRiwayat, "waktuDibuka">) {
  try {
    const daftar = await ambilRiwayat();
    const tanpaDuplikat = daftar.filter((b) => b.uri !== buku.uri);
    tanpaDuplikat.unshift({ ...buku, waktuDibuka: Date.now() });
    await AsyncStorage.setItem(
      KUNCI_PENYIMPANAN,
      JSON.stringify(tanpaDuplikat.slice(0, 30)) // simpan maksimal 30 terakhir
    );
  } catch (err) {
    console.log("Gagal menyimpan riwayat:", err);
  }
}

export async function hapusRiwayat(uri: string) {
  try {
    const daftar = await ambilRiwayat();
    const tanpaItem = daftar.filter((b) => b.uri !== uri);
    await AsyncStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(tanpaItem));
  } catch (err) {
    console.log("Gagal menghapus riwayat:", err);
  }
}