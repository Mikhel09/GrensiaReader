import { Header } from "@/components/reader/Header";
import { PanelPencarian } from "@/components/reader/PanelPencarian";
import { PanelPengaturan } from "@/components/reader/PanelPengaturan";
import { PanelTerjemahanPdf } from "@/components/reader/PanelTerjemahanPdf";
import { styles } from "@/styles/reader";
import { HasilCariTampil, TipeFile } from "@/types/reader";
import { bukaDocx } from "@/utils/docxReader";
import { BabEpub, bukaEpub } from "@/utils/epubReader";
import { EkstrakPdfTeks } from "@/utils/pdfEkstrak";
import { cariDalamTeks } from "@/utils/pencarian";
import { ambilRiwayat, BukuRiwayat, hapusRiwayat, simpanRiwayat } from "@/utils/riwayat";
import { bungkusHtml } from "@/utils/tampilan";
import {
  ambilTeksPolos,
  Bahasa,
  DAFTAR_BAHASA,
  MetodeTerjemahan,
  terjemahkanHtml,
  terjemahkanTeksPanjang,
  terjemahkanTeksPolos,
} from "@/utils/terjemahan";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Button, FlatList, Text, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function Index() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [namaFile, setNamaFile] = useState("");
  const [tipeFile, setTipeFile] = useState<TipeFile>(null);
  const [loading, setLoading] = useState(false);

  const [daftarRiwayat, setDaftarRiwayat] = useState<BukuRiwayat[]>([]);

  const [babEpub, setBabEpub] = useState<BabEpub[]>([]);
  const [babKe, setBabKe] = useState(0);
  const [cacheTerjemahanEpub, setCacheTerjemahanEpub] = useState<Record<number, string>>({});
  const [sedangProsesLatar, setSedangProsesLatar] = useState(false);

  const [htmlDokumen, setHtmlDokumen] = useState("");
  const [htmlDokumenTerjemahan, setHtmlDokumenTerjemahan] = useState<string | null>(null);

  const [teksTxt, setTeksTxt] = useState("");
  const [teksTxtTerjemahan, setTeksTxtTerjemahan] = useState<string | null>(null);

  const [modeTerjemahan, setModeTerjemahan] = useState(false);
  const [sedangMenerjemahkan, setSedangMenerjemahkan] = useState(false);

  const [ukuranFont, setUkuranFont] = useState(18);
  const [modeGelap, setModeGelap] = useState(false);
  const [panelPengaturanTerbuka, setPanelPengaturanTerbuka] = useState(false);

  const [bahasaSumber, setBahasaSumberAsli] = useState<Bahasa>(DAFTAR_BAHASA[0]);
  const [bahasaTujuan, setBahasaTujuanAsli] = useState<Bahasa>(DAFTAR_BAHASA[3]);
  const [metode, setMetodeAsli] = useState<MetodeTerjemahan>("mlkit");

  const [pencarianTerbuka, setPencarianTerbuka] = useState(false);
  const [kueriPencarian, setKueriPencarian] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilCariTampil[]>([]);
  const [sedangMencari, setSedangMencari] = useState(false);

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfTeksPerHalaman, setPdfTeksPerHalaman] = useState<string[] | null>(null);
  const [pdfSedangEkstrak, setPdfSedangEkstrak] = useState(false);
  const [pdfErrorEkstrak, setPdfErrorEkstrak] = useState<string | null>(null);
  const [pdfRetryKey, setPdfRetryKey] = useState(0);
  const [pdfHalaman, setPdfHalaman] = useState(1);
  const [pdfTotalHalaman, setPdfTotalHalaman] = useState(0);
  const [panelTerjemahanPdfTerbuka, setPanelTerjemahanPdfTerbuka] = useState(false);
  const [pdfSedangMenerjemahkanHalaman, setPdfSedangMenerjemahkanHalaman] = useState(false);
  const [sedangProsesLatarPdf, setSedangProsesLatarPdf] = useState(false);
  const [cachePdfTerjemahan, setCachePdfTerjemahan] = useState<Record<number, string>>({});
  const cachePdfRef = useRef<Record<number, string>>({});
  const sedangLatarPdfRef = useRef(false);

  const cacheRef = useRef<Record<number, string>>({});
  const tokenSesiRef = useRef(0);
  const sedangLatarRef = useRef(false);

  function updateCacheBab(index: number, html: string) {
    cacheRef.current = { ...cacheRef.current, [index]: html };
    setCacheTerjemahanEpub(cacheRef.current);
  }

  function updateCachePdf(index: number, teks: string) {
    cachePdfRef.current = { ...cachePdfRef.current, [index]: teks };
    setCachePdfTerjemahan(cachePdfRef.current);
  }

  function bersihkanCacheTerjemahan() {
    tokenSesiRef.current += 1;
    cacheRef.current = {};
    setCacheTerjemahanEpub({});
    setHtmlDokumenTerjemahan(null);
    setTeksTxtTerjemahan(null);
    setModeTerjemahan(false);
    setSedangProsesLatar(false);
    cachePdfRef.current = {};
    setCachePdfTerjemahan({});
    setSedangProsesLatarPdf(false);
    setPanelTerjemahanPdfTerbuka(false);
  }

  function setBahasaSumber(bahasa: Bahasa) {
    if (bahasa.label === bahasaSumber.label) return;
    setBahasaSumberAsli(bahasa);
    bersihkanCacheTerjemahan();
  }
  function setBahasaTujuan(bahasa: Bahasa) {
    if (bahasa.label === bahasaTujuan.label) return;
    setBahasaTujuanAsli(bahasa);
    bersihkanCacheTerjemahan();
  }
  function setMetode(m: MetodeTerjemahan) {
    if (m === metode) return;
    setMetodeAsli(m);
    bersihkanCacheTerjemahan();
  }

  useFocusEffect(
    useCallback(() => {
      if (!fileUri) {
        ambilRiwayat().then(setDaftarRiwayat);
      }
    }, [fileUri])
  );

  useEffect(() => {
    if (tipeFile === "epub" && fileUri) {
      simpanRiwayat({ uri: fileUri, nama: namaFile, tipe: "epub", babTerakhir: babKe });
    }
  }, [babKe, tipeFile, fileUri, namaFile]);

  useEffect(() => {
    if (tipeFile === "pdf" && panelTerjemahanPdfTerbuka && pdfTeksPerHalaman) {
      const token = tokenSesiRef.current;
      const idx = pdfHalaman - 1;
      if (!cachePdfRef.current[idx]) {
        setPdfSedangMenerjemahkanHalaman(true);
        pastikanHalamanPdfTerjemahan(pdfTeksPerHalaman, idx, token, bahasaSumber, bahasaTujuan, metode).finally(() => {
          if (token === tokenSesiRef.current) setPdfSedangMenerjemahkanHalaman(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfHalaman, panelTerjemahanPdfTerbuka, pdfTeksPerHalaman]);

  function bersihkanPencarian() {
    setKueriPencarian("");
    setHasilPencarian([]);
  }

  function bersihkanStatePdf() {
    setPdfBase64(null);
    setPdfTeksPerHalaman(null);
    setPdfSedangEkstrak(false);
    setPdfErrorEkstrak(null);
    setPdfHalaman(1);
    setPdfTotalHalaman(0);
    setPanelTerjemahanPdfTerbuka(false);
    setPdfSedangMenerjemahkanHalaman(false);
    setSedangProsesLatarPdf(false);
    cachePdfRef.current = {};
    setCachePdfTerjemahan({});
    sedangLatarPdfRef.current = false;
  }

  function kembaliKeAwal() {
    tokenSesiRef.current += 1;
    cacheRef.current = {};
    setFileUri(null);
    setNamaFile("");
    setTipeFile(null);
    setBabEpub([]);
    setBabKe(0);
    setCacheTerjemahanEpub({});
    setHtmlDokumen("");
    setHtmlDokumenTerjemahan(null);
    setTeksTxt("");
    setTeksTxtTerjemahan(null);
    setModeTerjemahan(false);
    setSedangProsesLatar(false);
    bersihkanPencarian();
    bersihkanStatePdf();
  }

  async function bukaFileDenganUri(uri: string, nama: string, babAwal: number = 0) {
    const namaLower = nama.toLowerCase();
    tokenSesiRef.current += 1;
    cacheRef.current = {};
    bersihkanPencarian();
    bersihkanStatePdf();
    setLoading(true);
    try {
      if (namaLower.endsWith(".epub")) {
        const bab = await bukaEpub(uri);
        setBabEpub(bab);
        setBabKe(Math.min(babAwal, bab.length - 1));
        setCacheTerjemahanEpub({});
        setTipeFile("epub");
        await simpanRiwayat({ uri, nama, tipe: "epub", babTerakhir: babAwal });
      } else if (namaLower.endsWith(".docx")) {
        const html = await bukaDocx(uri);
        setHtmlDokumen(html);
        setHtmlDokumenTerjemahan(null);
        setTipeFile("docx");
        await simpanRiwayat({ uri, nama, tipe: "docx", babTerakhir: 0 });
      } else if (namaLower.endsWith(".txt")) {
        const teks = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
        setTeksTxt(teks);
        setTeksTxtTerjemahan(null);
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
      setModeTerjemahan(false);
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

  async function pastikanBabTerjemahan(
    daftarBab: BabEpub[],
    index: number,
    token: number,
    bSumber: Bahasa,
    bTujuan: Bahasa,
    m: MetodeTerjemahan
  ) {
    if (cacheRef.current[index]) return;
    const asli = daftarBab[index]?.html || "";
    const hasil = await terjemahkanHtml(asli, bSumber, bTujuan, m);
    if (token === tokenSesiRef.current) updateCacheBab(index, hasil);
  }

  function mulaiTerjemahkanSemuaDiLatar(
    daftarBab: BabEpub[],
    babAwal: number,
    token: number,
    bSumber: Bahasa,
    bTujuan: Bahasa,
    m: MetodeTerjemahan
  ) {
    if (sedangLatarRef.current) return;
    sedangLatarRef.current = true;
    setSedangProsesLatar(true);

    const urutan: number[] = [];
    for (let i = babAwal + 1; i < daftarBab.length; i++) urutan.push(i);
    for (let i = 0; i < babAwal; i++) urutan.push(i);

    (async () => {
      for (const i of urutan) {
        if (token !== tokenSesiRef.current) break;
        if (cacheRef.current[i]) continue;
        try {
          await pastikanBabTerjemahan(daftarBab, i, token, bSumber, bTujuan, m);
        } catch (err) {
          console.log("Gagal menerjemahkan bab di latar (bab " + (i + 1) + "):", err);
        }
      }
      sedangLatarRef.current = false;
      if (token === tokenSesiRef.current) setSedangProsesLatar(false);
    })();
  }

  function pindahBab(arah: 1 | -1) {
    const babBaru = babKe + arah;
    setBabKe(babBaru);
    if (modeTerjemahan && !cacheRef.current[babBaru]) {
      const token = tokenSesiRef.current;
      setSedangMenerjemahkan(true);
      pastikanBabTerjemahan(babEpub, babBaru, token, bahasaSumber, bahasaTujuan, metode).finally(() => {
        if (token === tokenSesiRef.current) setSedangMenerjemahkan(false);
      });
    }
  }

  async function pastikanHalamanPdfTerjemahan(
    daftarHalaman: string[],
    index: number,
    token: number,
    bSumber: Bahasa,
    bTujuan: Bahasa,
    m: MetodeTerjemahan
  ) {
    if (cachePdfRef.current[index]) return;
    const asli = daftarHalaman[index] || "";
    const hasil = await terjemahkanTeksPanjang(asli, bSumber, bTujuan, m);
    if (token === tokenSesiRef.current) updateCachePdf(index, hasil);
  }

  function mulaiTerjemahkanSemuaHalamanDiLatar(
    daftarHalaman: string[],
    halamanAwalIndex: number,
    token: number,
    bSumber: Bahasa,
    bTujuan: Bahasa,
    m: MetodeTerjemahan
  ) {
    if (sedangLatarPdfRef.current) return;
    sedangLatarPdfRef.current = true;
    setSedangProsesLatarPdf(true);

    const urutan: number[] = [];
    for (let i = halamanAwalIndex + 1; i < daftarHalaman.length; i++) urutan.push(i);
    for (let i = 0; i < halamanAwalIndex; i++) urutan.push(i);

    (async () => {
      for (const i of urutan) {
        if (token !== tokenSesiRef.current) break;
        if (cachePdfRef.current[i]) continue;
        try {
          await pastikanHalamanPdfTerjemahan(daftarHalaman, i, token, bSumber, bTujuan, m);
        } catch (err) {
          console.log("Gagal menerjemahkan halaman PDF di latar (" + (i + 1) + "):", err);
        }
      }
      sedangLatarPdfRef.current = false;
      if (token === tokenSesiRef.current) setSedangProsesLatarPdf(false);
    })();
  }

  async function toggleTerjemahanPdf() {
    if (panelTerjemahanPdfTerbuka) {
      setPanelTerjemahanPdfTerbuka(false);
      return;
    }
    if (!pdfTeksPerHalaman) return;

    const token = tokenSesiRef.current;
    const idx = pdfHalaman - 1;
    setPanelTerjemahanPdfTerbuka(true);

    if (!cachePdfRef.current[idx]) {
      setPdfSedangMenerjemahkanHalaman(true);
      try {
        await pastikanHalamanPdfTerjemahan(pdfTeksPerHalaman, idx, token, bahasaSumber, bahasaTujuan, metode);
      } catch (err) {
        console.log("Gagal menerjemahkan halaman:", err);
      }
      setPdfSedangMenerjemahkanHalaman(false);
    }

    mulaiTerjemahkanSemuaHalamanDiLatar(pdfTeksPerHalaman, idx, token, bahasaSumber, bahasaTujuan, metode);
  }

  async function toggleTerjemahan() {
    if (modeTerjemahan) {
      setModeTerjemahan(false);
      return;
    }

    if (tipeFile === "epub") {
      const token = tokenSesiRef.current;
      if (!cacheRef.current[babKe]) {
        setSedangMenerjemahkan(true);
        try {
          await pastikanBabTerjemahan(babEpub, babKe, token, bahasaSumber, bahasaTujuan, metode);
        } catch (err) {
          console.log("Gagal menerjemahkan:", err);
          setSedangMenerjemahkan(false);
          return;
        }
        setSedangMenerjemahkan(false);
      }
      if (token === tokenSesiRef.current) {
        setModeTerjemahan(true);
        mulaiTerjemahkanSemuaDiLatar(babEpub, babKe, token, bahasaSumber, bahasaTujuan, metode);
      }
      return;
    }

    if (tipeFile === "docx" && htmlDokumenTerjemahan) {
      setModeTerjemahan(true);
      return;
    }
    if (tipeFile === "txt" && teksTxtTerjemahan) {
      setModeTerjemahan(true);
      return;
    }

    setSedangMenerjemahkan(true);
    try {
      if (tipeFile === "docx") {
        const hasil = await terjemahkanHtml(htmlDokumen, bahasaSumber, bahasaTujuan, metode);
        setHtmlDokumenTerjemahan(hasil);
      } else if (tipeFile === "txt") {
        const hasil = await terjemahkanTeksPolos(teksTxt, bahasaSumber, bahasaTujuan, metode);
        setTeksTxtTerjemahan(hasil);
      }
      setModeTerjemahan(true);
    } catch (err) {
      console.log("Gagal menerjemahkan:", err);
    } finally {
      setSedangMenerjemahkan(false);
    }
  }

  function jalankanPencarian() {
    if (!kueriPencarian.trim()) {
      setHasilPencarian([]);
      return;
    }
    setSedangMencari(true);
    try {
      if (tipeFile === "epub") {
        const semuaHasil: HasilCariTampil[] = [];
        babEpub.forEach((bab, i) => {
          const teksPolos = ambilTeksPolos(bab.html);
          cariDalamTeks(teksPolos, kueriPencarian, 5).forEach((h) =>
            semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan })
          );
        });
        setHasilPencarian(semuaHasil);
      } else if (tipeFile === "docx") {
        const teksPolos = ambilTeksPolos(htmlDokumen);
        setHasilPencarian(
          cariDalamTeks(teksPolos, kueriPencarian, 30).map((h) => ({ babIndex: null, cuplikan: h.cuplikan }))
        );
      } else if (tipeFile === "txt") {
        setHasilPencarian(
          cariDalamTeks(teksTxt, kueriPencarian, 30).map((h) => ({ babIndex: null, cuplikan: h.cuplikan }))
        );
      } else if (tipeFile === "pdf" && pdfTeksPerHalaman) {
        const semuaHasil: HasilCariTampil[] = [];
        pdfTeksPerHalaman.forEach((teksHalaman, i) => {
          cariDalamTeks(teksHalaman, kueriPencarian, 5).forEach((h) =>
            semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan })
          );
        });
        setHasilPencarian(semuaHasil);
      }
    } finally {
      setSedangMencari(false);
    }
  }

  function tekanHasilPencarian(item: HasilCariTampil) {
    if (tipeFile === "epub" && item.babIndex !== null) {
      setBabKe(item.babIndex);
      setModeTerjemahan(false);
    } else if (tipeFile === "pdf" && item.babIndex !== null) {
      setPdfHalaman(item.babIndex + 1);
    }
    setPencarianTerbuka(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.teksLoading}>Membuka file...</Text>
      </SafeAreaView>
    );
  }

  if (!fileUri) {
    return (
      <SafeAreaView style={styles.containerRak}>
        <View style={styles.headerRak}>
          <Text style={styles.judul}>GrensiaReader</Text>
          <TouchableOpacity style={styles.tombolTambah} onPress={pilihFile}>
            <Text style={styles.teksTombolTambah}>+ Buka File</Text>
          </TouchableOpacity>
        </View>

        {daftarRiwayat.length === 0 ? (
          <View style={styles.container}>
            <Text style={styles.subjudul}>Belum ada buku yang dibuka</Text>
            <TouchableOpacity style={styles.tombolUtama} onPress={pilihFile}>
              <Text style={styles.teksTombolUtama}>Pilih File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={daftarRiwayat}
            keyExtractor={(item) => item.uri}
            contentContainerStyle={styles.daftarRiwayat}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.itemRiwayat} onPress={() => bukaDariRiwayat(item)}>
                <View style={styles.ikonBuku}>
                  <Text style={styles.teksIkonBuku}>{item.tipe.toUpperCase()}</Text>
                </View>
                <View style={styles.infoRiwayat}>
                  <Text style={styles.namaRiwayat} numberOfLines={1}>{item.nama}</Text>
                  {item.tipe === "epub" && <Text style={styles.subRiwayat}>Bab {item.babTerakhir + 1}</Text>}
                </View>
                <TouchableOpacity onPress={() => hapusDariRiwayat(item.uri)} style={styles.tombolHapus}>
                  <Text style={styles.teksHapus}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  const panel = (
    <PanelPengaturan
      visible={panelPengaturanTerbuka}
      onTutup={() => setPanelPengaturanTerbuka(false)}
      ukuranFont={ukuranFont}
      setUkuranFont={setUkuranFont}
      modeGelap={modeGelap}
      setModeGelap={setModeGelap}
      bahasaSumber={bahasaSumber}
      setBahasaSumber={setBahasaSumber}
      bahasaTujuan={bahasaTujuan}
      setBahasaTujuan={setBahasaTujuan}
      metode={metode}
      setMetode={setMetode}
    />
  );

  const panelCari = (
    <PanelPencarian
      visible={pencarianTerbuka}
      onTutup={() => setPencarianTerbuka(false)}
      kueri={kueriPencarian}
      setKueri={setKueriPencarian}
      onCari={jalankanPencarian}
      sedangMencari={sedangMencari}
      hasil={hasilPencarian}
      labelSatuan={tipeFile === "epub" ? "Bab" : tipeFile === "pdf" ? "Halaman" : null}
      onTekanHasil={tekanHasilPencarian}
    />
  );

  if (tipeFile === "epub") {
    const htmlAsli = babEpub[babKe]?.html || "";
    const htmlDitampilkan = modeTerjemahan ? cacheTerjemahanEpub[babKe] || htmlAsli : htmlAsli;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header
          namaFile={namaFile}
          onKembali={kembaliKeAwal}
          tampilkanFiturDokumen
          labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
          sedangMenerjemahkan={sedangMenerjemahkan}
          onToggleTerjemahan={toggleTerjemahan}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => setPencarianTerbuka(true)}
        />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap) }} />
        {sedangProsesLatar && (
          <View style={styles.indikatorLatar}>
            <ActivityIndicator size="small" color="#4A6FA5" />
            <Text style={styles.teksIndikatorLatar}>Menerjemahkan bab lainnya di latar belakang...</Text>
          </View>
        )}
        <View style={styles.navigasi}>
          <Button title="‹ Sebelumnya" disabled={babKe === 0} onPress={() => pindahBab(-1)} />
          <Text style={styles.teksNavigasi}>Bab {babKe + 1} / {babEpub.length}</Text>
          <Button title="Selanjutnya ›" disabled={babKe === babEpub.length - 1} onPress={() => pindahBab(1)} />
        </View>
        {panel}
        {panelCari}
      </SafeAreaView>
    );
  }

  if (tipeFile === "docx") {
    const htmlDitampilkan = modeTerjemahan ? htmlDokumenTerjemahan || htmlDokumen : htmlDokumen;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header
          namaFile={namaFile}
          onKembali={kembaliKeAwal}
          tampilkanFiturDokumen
          labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
          sedangMenerjemahkan={sedangMenerjemahkan}
          onToggleTerjemahan={toggleTerjemahan}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => setPencarianTerbuka(true)}
        />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap) }} />
        {panel}
        {panelCari}
      </SafeAreaView>
    );
  }

  if (tipeFile === "txt") {
    const teksDitampilkan = modeTerjemahan ? teksTxtTerjemahan || teksTxt : teksTxt;
    const htmlTxt = `<pre style="white-space: pre-wrap; margin: 0;">${teksDitampilkan}</pre>`;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header
          namaFile={namaFile}
          onKembali={kembaliKeAwal}
          tampilkanFiturDokumen
          labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
          sedangMenerjemahkan={sedangMenerjemahkan}
          onToggleTerjemahan={toggleTerjemahan}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => setPencarianTerbuka(true)}
        />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlTxt, ukuranFont, modeGelap) }} />
        {panel}
        {panelCari}
      </SafeAreaView>
    );
  }

  const pdfSiap = !!pdfTeksPerHalaman;

  return (
    <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
      <Header
        namaFile={namaFile}
        onKembali={kembaliKeAwal}
        tampilkanFiturDokumen={pdfSiap}
        labelTombolTerjemahan={panelTerjemahanPdfTerbuka ? "Sembunyikan" : "Terjemahkan"}
        sedangMenerjemahkan={false}
        onToggleTerjemahan={toggleTerjemahanPdf}
        onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
        onBukaPencarian={() => setPencarianTerbuka(true)}
      />

      <View style={{ flex: panelTerjemahanPdfTerbuka ? 0.55 : 1 }}>
        <Pdf
          source={{ uri: fileUri, cache: true }}
          style={styles.pdf}
          page={pdfHalaman}
          onPageChanged={(halaman, total) => {
            setPdfHalaman(halaman);
            setPdfTotalHalaman(total);
          }}
          onError={(error) => console.log("Error membuka PDF:", error)}
        />
      </View>

      {pdfSedangEkstrak && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menyiapkan pencarian & terjemahan...</Text>
        </View>
      )}
      {pdfErrorEkstrak && (
        <View style={styles.indikatorLatar}>
          <Text style={styles.teksIndikatorLatar}>{pdfErrorEkstrak}</Text>
          <TouchableOpacity
            onPress={() => {
              setPdfErrorEkstrak(null);
              setPdfSedangEkstrak(true);
              setPdfRetryKey((k) => k + 1);
            }}
            style={{ marginLeft: 10 }}
          >
            <Text style={[styles.teksIndikatorLatar, { color: "#4A6FA5", fontWeight: "700" }]}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}
      {pdfBase64 && !pdfTeksPerHalaman && !pdfErrorEkstrak && (
        <EkstrakPdfTeks
          key={pdfRetryKey}
          base64={pdfBase64}
          onSelesai={(hasil) => {
            setPdfTeksPerHalaman(hasil);
            setPdfSedangEkstrak(false);
          }}
          onError={(pesan) => {
            console.log("Gagal ekstrak PDF:", pesan);
            setPdfSedangEkstrak(false);
            setPdfErrorEkstrak("Teks tidak dapat diambil (kemungkinan PDF hasil scan).");
          }}
        />
      )}

      {panelTerjemahanPdfTerbuka && (
        <PanelTerjemahanPdf
          halaman={pdfHalaman}
          totalHalaman={pdfTotalHalaman}
          sedangProses={pdfSedangMenerjemahkanHalaman}
          teksTerjemahan={cachePdfTerjemahan[pdfHalaman - 1] || ""}
          sedangProsesLatar={sedangProsesLatarPdf}
          ukuranFont={ukuranFont}
          modeGelap={modeGelap}
        />
      )}

      {panel}
      {panelCari}
    </SafeAreaView>
  );
}