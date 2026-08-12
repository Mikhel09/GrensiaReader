import { TipeFile } from "@/types/reader";
import { bukaDocx } from "@/utils/docxReader";
import { ambilCoverEpub, BabEpub, bukaEpub } from "@/utils/epubReader";
import { ambilRiwayat, BukuRiwayat, hapusRiwayat, simpanRiwayat } from "@/utils/riwayat";
import { gabungkanKalimatLintasHalaman } from "@/utils/terjemahan";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

export function useDokumen() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [namaFile, setNamaFile] = useState("");
  const [tipeFile, setTipeFile] = useState<TipeFile>(null);
  const [loading, setLoading] = useState(false);

  const [daftarRiwayat, setDaftarRiwayat] = useState<BukuRiwayat[]>([]);

  const [babEpub, setBabEpub] = useState<BabEpub[]>([]);
  const [babKe, setBabKe] = useState(0);
  const [epubCover, setEpubCover] = useState<string | undefined>(undefined);

  const [htmlDokumen, setHtmlDokumen] = useState("");
  const [teksTxt, setTeksTxt] = useState("");

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfTeksPerHalaman, setPdfTeksPerHalaman] = useState<string[] | null>(null);
  const [pdfTeksUntukTerjemahan, setPdfTeksUntukTerjemahan] = useState<string[] | null>(null);
  const [pdfSedangEkstrak, setPdfSedangEkstrak] = useState(false);
  const [pdfErrorEkstrak, setPdfErrorEkstrak] = useState<string | null>(null);
  const [pdfRetryKey, setPdfRetryKey] = useState(0);
  const [pdfHalaman, setPdfHalaman] = useState(1);
  const [pdfTotalHalaman, setPdfTotalHalaman] = useState(0);
  const [pdfJumpTarget, setPdfJumpTarget] = useState(1);
  const [pdfJumpToken, setPdfJumpToken] = useState(0);

  function lompatKeHalamanPdf(halaman: number) {
    setPdfJumpTarget(halaman);
    setPdfJumpToken((t) => t + 1);
    setPdfHalaman(halaman);
  }

  useFocusEffect(
    useCallback(() => {
      if (!fileUri) {
        ambilRiwayat().then(setDaftarRiwayat);
      }
    }, [fileUri])
  );

  // Simpan progress bab EPUB setiap kali pindah bab, tetap menyertakan cover yang sudah didapat
  useEffect(() => {
    if (tipeFile === "epub" && fileUri) {
      simpanRiwayat({ uri: fileUri, nama: namaFile, tipe: "epub", babTerakhir: babKe, cover: epubCover });
    }
  }, [babKe, tipeFile, fileUri, namaFile, epubCover]);

  function bersihkanSemua() {
    setFileUri(null);
    setNamaFile("");
    setTipeFile(null);
    setBabEpub([]);
    setBabKe(0);
    setEpubCover(undefined);
    setHtmlDokumen("");
    setTeksTxt("");
    setPdfBase64(null);
    setPdfTeksPerHalaman(null);
    setPdfTeksUntukTerjemahan(null);
    setPdfSedangEkstrak(false);
    setPdfErrorEkstrak(null);
    setPdfHalaman(1);
    setPdfTotalHalaman(0);
  }

  async function bukaFileDenganUri(uri: string, nama: string, babAwal: number = 0) {
    const namaLower = nama.toLowerCase();
    bersihkanSemua();
    setLoading(true);
    try {
      if (namaLower.endsWith(".epub")) {
        const bab = await bukaEpub(uri);
        setBabEpub(bab);
        setBabKe(Math.min(babAwal, bab.length - 1));
        setTipeFile("epub");
        const cover = await ambilCoverEpub(uri).catch(() => null);
        setEpubCover(cover || undefined);
        await simpanRiwayat({ uri, nama, tipe: "epub", babTerakhir: babAwal, cover: cover || undefined });
      } else if (namaLower.endsWith(".docx")) {
        const html = await bukaDocx(uri);
        setHtmlDokumen(html);
        setTipeFile("docx");
        await simpanRiwayat({ uri, nama, tipe: "docx", babTerakhir: 0 });
      } else if (namaLower.endsWith(".txt")) {
        const teks = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
        setTeksTxt(teks);
        setTipeFile("txt");
        await simpanRiwayat({ uri, nama, tipe: "txt", babTerakhir: 0 });
      } else {
        setTipeFile("pdf");
        await simpanRiwayat({ uri, nama, tipe: "pdf", babTerakhir: 0 });
        setPdfSedangEkstrak(true);
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          setPdfBase64(base64);
        } catch (err) {
          console.log("Gagal membaca PDF untuk ekstraksi:", err);
          setPdfSedangEkstrak(false);
          setPdfErrorEkstrak("Gagal membaca file PDF.");
        }
      }
      setFileUri(uri);
      setNamaFile(nama);
    } catch (err) {
      console.log("Gagal membuka file:", err);
    } finally {
      setLoading(false);
    }
  }

  async function pilihFile() {
    const hasil = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/epub+zip",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });
    if (hasil.canceled) return;
    await bukaFileDenganUri(hasil.assets[0].uri, hasil.assets[0].name);
  }

  async function bukaDariRiwayat(buku: BukuRiwayat) {
    await bukaFileDenganUri(buku.uri, buku.nama, buku.babTerakhir);
  }

  async function hapusDariRiwayat(uri: string) {
    await hapusRiwayat(uri);
    setDaftarRiwayat(await ambilRiwayat());
  }

  function kembaliKeAwal() {
    bersihkanSemua();
  }

  function cobaLagiEkstrakPdf() {
    setPdfErrorEkstrak(null);
    setPdfSedangEkstrak(true);
    setPdfRetryKey((k) => k + 1);
  }

  function selesaiEkstrakPdf(hasil: string[]) {
    setPdfTeksPerHalaman(hasil);
    setPdfTeksUntukTerjemahan(gabungkanKalimatLintasHalaman(hasil));
    setPdfSedangEkstrak(false);
  }

  function gagalEkstrakPdf(pesan: string) {
    console.log("Gagal ekstrak PDF:", pesan);
    setPdfSedangEkstrak(false);
    setPdfErrorEkstrak("Teks tidak dapat diambil (kemungkinan PDF hasil scan).");
  }

  return {
    fileUri, namaFile, tipeFile, loading,
    daftarRiwayat,
    babEpub, babKe, setBabKe,
    htmlDokumen, teksTxt,
    pdfBase64, pdfTeksPerHalaman, pdfTeksUntukTerjemahan, pdfSedangEkstrak, pdfErrorEkstrak, pdfRetryKey,
    pdfHalaman, setPdfHalaman, pdfTotalHalaman, setPdfTotalHalaman,
    pdfJumpTarget, pdfJumpToken, lompatKeHalamanPdf,
    pilihFile, bukaDariRiwayat, hapusDariRiwayat, kembaliKeAwal,
    cobaLagiEkstrakPdf, selesaiEkstrakPdf, gagalEkstrakPdf,
  };
}