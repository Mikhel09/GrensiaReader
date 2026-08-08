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
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type TipeFile = "pdf" | "epub" | "txt" | "docx" | null;

type HasilCariTampil = { babIndex: number | null; cuplikan: string };

const DAFTAR_METODE: { kode: MetodeTerjemahan; label: string }[] = [
  { kode: "mlkit", label: "ML Kit (Offline)" },
  { kode: "google", label: "Google (Online)" },
];

function Header({
  namaFile,
  onKembali,
  tampilkanFiturDokumen,
  labelTombolTerjemahan,
  sedangMenerjemahkan,
  onToggleTerjemahan,
  onBukaPengaturan,
  onBukaPencarian,
}: {
  namaFile: string;
  onKembali: () => void;
  tampilkanFiturDokumen: boolean;
  labelTombolTerjemahan: string;
  sedangMenerjemahkan: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onKembali} style={styles.tombolKembali}>
        <Text style={styles.teksKembali}>‹ Kembali</Text>
      </TouchableOpacity>
      <Text style={styles.namaFileHeader} numberOfLines={1}>
        {namaFile}
      </Text>
      {tampilkanFiturDokumen && (
        <TouchableOpacity onPress={onBukaPencarian} style={styles.tombolHeaderKanan}>
          <Text style={styles.teksKembali}>🔍</Text>
        </TouchableOpacity>
      )}
      {tampilkanFiturDokumen && (
        <TouchableOpacity onPress={onToggleTerjemahan} disabled={sedangMenerjemahkan} style={styles.tombolHeaderKanan}>
          {sedangMenerjemahkan ? (
            <ActivityIndicator size="small" color="#4A6FA5" />
          ) : (
            <Text style={styles.teksKembali}>{labelTombolTerjemahan}</Text>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onBukaPengaturan} style={styles.tombolHeaderKanan}>
        <Text style={styles.teksKembali}>Aa</Text>
      </TouchableOpacity>
    </View>
  );
}

function PanelPencarian({
  visible,
  onTutup,
  kueri,
  setKueri,
  onCari,
  sedangMencari,
  hasil,
  labelSatuan,
  onTekanHasil,
}: {
  visible: boolean;
  onTutup: () => void;
  kueri: string;
  setKueri: (s: string) => void;
  onCari: () => void;
  sedangMencari: boolean;
  hasil: HasilCariTampil[];
  labelSatuan: string | null;
  onTekanHasil: (item: HasilCariTampil) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.containerBaca}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onTutup} style={styles.tombolKembali}>
            <Text style={styles.teksKembali}>‹ Tutup</Text>
          </TouchableOpacity>
          <Text style={styles.namaFileHeader}>Cari dalam Buku</Text>
        </View>
        <View style={styles.barisCari}>
          <TextInput
            style={styles.inputCari}
            placeholder="Ketik kata yang dicari..."
            value={kueri}
            onChangeText={setKueri}
            onSubmitEditing={onCari}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.tombolCariAksi} onPress={onCari}>
            <Text style={styles.teksTombolCariAksi}>Cari</Text>
          </TouchableOpacity>
        </View>

        {sedangMencari ? (
          <ActivityIndicator size="large" color="#4A6FA5" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={hasil}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.daftarHasilCari}
            ListEmptyComponent={
              kueri.trim() ? (
                <Text style={styles.teksKosongCari}>Tidak ada hasil ditemukan.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.itemHasilCari} onPress={() => onTekanHasil(item)}>
                {labelSatuan && item.babIndex !== null && (
                  <Text style={styles.labelBabHasil}>
                    {labelSatuan} {item.babIndex + 1}
                  </Text>
                )}
                <Text style={styles.cuplikanHasil}>{item.cuplikan}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function PilihanBahasa({
  label,
  terpilih,
  onPilih,
}: {
  label: string;
  terpilih: Bahasa;
  onPilih: (bahasa: Bahasa) => void;
}) {
  return (
    <View style={styles.blokBahasa}>
      <Text style={styles.labelPanel}>{label}</Text>
      <View style={styles.barisChip}>
        {DAFTAR_BAHASA.map((bahasa) => (
          <TouchableOpacity
            key={bahasa.label}
            style={[styles.chipBahasa, terpilih.label === bahasa.label && styles.chipBahasaAktif]}
            onPress={() => onPilih(bahasa)}
          >
            <Text style={[styles.teksChip, terpilih.label === bahasa.label && styles.teksChipAktif]}>
              {bahasa.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PilihanMetode({
  terpilih,
  onPilih,
}: {
  terpilih: MetodeTerjemahan;
  onPilih: (metode: MetodeTerjemahan) => void;
}) {
  return (
    <View style={styles.blokBahasa}>
      <Text style={styles.labelPanel}>Mesin Terjemahan</Text>
      <View style={styles.barisChip}>
        {DAFTAR_METODE.map((m) => (
          <TouchableOpacity
            key={m.kode}
            style={[styles.chipBahasa, terpilih === m.kode && styles.chipBahasaAktif]}
            onPress={() => onPilih(m.kode)}
          >
            <Text style={[styles.teksChip, terpilih === m.kode && styles.teksChipAktif]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {terpilih === "google" && (
        <Text style={styles.catatanMetode}>
          Metode Google bersifat tidak resmi, butuh internet, dan sewaktu-waktu bisa berhenti bekerja.
        </Text>
      )}
    </View>
  );
}

function PanelPengaturan({
  visible, onTutup, ukuranFont, setUkuranFont, modeGelap, setModeGelap,
  bahasaSumber, setBahasaSumber, bahasaTujuan, setBahasaTujuan,
  metode, setMetode,
}: {
  visible: boolean; onTutup: () => void; ukuranFont: number; setUkuranFont: (n: number) => void;
  modeGelap: boolean; setModeGelap: (b: boolean) => void;
  bahasaSumber: Bahasa; setBahasaSumber: (b: Bahasa) => void;
  bahasaTujuan: Bahasa; setBahasaTujuan: (b: Bahasa) => void;
  metode: MetodeTerjemahan; setMetode: (m: MetodeTerjemahan) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onTutup}>
        <View style={styles.panelPengaturan}>
          <Text style={styles.judulPanel}>Pengaturan Baca</Text>

          <Text style={styles.labelPanel}>Ukuran Teks</Text>
          <View style={styles.barisFont}>
            <TouchableOpacity style={styles.tombolFont} onPress={() => setUkuranFont(Math.max(12, ukuranFont - 2))}>
              <Text style={styles.teksTombolFont}>A-</Text>
            </TouchableOpacity>
            <Text style={styles.angkaFont}>{ukuranFont}</Text>
            <TouchableOpacity style={styles.tombolFont} onPress={() => setUkuranFont(Math.min(32, ukuranFont + 2))}>
              <Text style={styles.teksTombolFont}>A+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.barisModeGelap}>
            <Text style={styles.labelPanel}>Mode Gelap</Text>
            <TouchableOpacity style={[styles.saklar, modeGelap && styles.saklarAktif]} onPress={() => setModeGelap(!modeGelap)}>
              <View style={[styles.bulatSaklar, modeGelap && styles.bulatSaklarAktif]} />
            </TouchableOpacity>
          </View>

          <PilihanMetode terpilih={metode} onPilih={setMetode} />
          <PilihanBahasa label="Dari Bahasa" terpilih={bahasaSumber} onPilih={setBahasaSumber} />
          <PilihanBahasa label="Ke Bahasa" terpilih={bahasaTujuan} onPilih={setBahasaTujuan} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

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

  // Pencarian
  const [pencarianTerbuka, setPencarianTerbuka] = useState(false);
  const [kueriPencarian, setKueriPencarian] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilCariTampil[]>([]);
  const [sedangMencari, setSedangMencari] = useState(false);

  // --- Khusus PDF ---
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

  // Auto-terjemahkan halaman PDF yang sedang dibuka setiap kali pindah halaman,
  // selama panel terjemahan sedang terbuka.
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
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
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

  // --- Logika terjemahan EPUB ---
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
    if (token === tokenSesiRef.current) {
      updateCacheBab(index, hasil);
    }
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

  // --- Logika terjemahan PDF ---
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
    if (token === tokenSesiRef.current) {
      updateCachePdf(index, hasil);
    }
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
          const hasilBab = cariDalamTeks(teksPolos, kueriPencarian, 5);
          hasilBab.forEach((h) => semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan }));
        });
        setHasilPencarian(semuaHasil);
      } else if (tipeFile === "docx") {
        const teksPolos = ambilTeksPolos(htmlDokumen);
        const hasilDoc = cariDalamTeks(teksPolos, kueriPencarian, 30);
        setHasilPencarian(hasilDoc.map((h) => ({ babIndex: null, cuplikan: h.cuplikan })));
      } else if (tipeFile === "txt") {
        const hasilDoc = cariDalamTeks(teksTxt, kueriPencarian, 30);
        setHasilPencarian(hasilDoc.map((h) => ({ babIndex: null, cuplikan: h.cuplikan })));
      } else if (tipeFile === "pdf" && pdfTeksPerHalaman) {
        const semuaHasil: HasilCariTampil[] = [];
        pdfTeksPerHalaman.forEach((teksHalaman, i) => {
          const hasilHalaman = cariDalamTeks(teksHalaman, kueriPencarian, 5);
          hasilHalaman.forEach((h) => semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan }));
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
                  {item.tipe === "epub" && (
                    <Text style={styles.subRiwayat}>Bab {item.babTerakhir + 1}</Text>
                  )}
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

  // --- Tampilan PDF ---
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
        <View style={styles.panelTerjemahanPdfBawah}>
          <View style={styles.headerTerjemahanPdfKecil}>
            <Text style={styles.labelTerjemahanPdfKecil}>
              Terjemahan — Halaman {pdfHalaman}
              {pdfTotalHalaman ? ` / ${pdfTotalHalaman}` : ""}
            </Text>
          </View>
          {pdfSedangMenerjemahkanHalaman ? (
            <View style={styles.container}>
              <ActivityIndicator size="small" color="#4A6FA5" />
              <Text style={styles.teksLoading}>Menerjemahkan halaman ini...</Text>
            </View>
          ) : (
            <ScrollView style={styles.isiTerjemahanPdf}>
              <Text style={styles.teksTerjemahanPdf}>
                {cachePdfTerjemahan[pdfHalaman - 1] || "Belum ada terjemahan untuk halaman ini."}
              </Text>
            </ScrollView>
          )}
          {sedangProsesLatarPdf && (
            <View style={styles.indikatorLatar}>
              <ActivityIndicator size="small" color="#4A6FA5" />
              <Text style={styles.teksIndikatorLatar}>Menerjemahkan halaman lainnya di latar belakang...</Text>
            </View>
          )}
        </View>
      )}

      {panel}
      {panelCari}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F7F8FA" },
  containerRak: { flex: 1, backgroundColor: "#F7F8FA" },
  containerBaca: { flex: 1, backgroundColor: "#fff" },
  containerGelap: { backgroundColor: "#1A1A1A" },
  headerRak: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  judul: { fontSize: 26, fontWeight: "bold", color: "#2C3E50" },
  tombolTambah: { backgroundColor: "#4A6FA5", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  teksTombolTambah: { color: "#fff", fontWeight: "600", fontSize: 13 },
  subjudul: { fontSize: 14, color: "#7F8C8D", marginBottom: 32 },
  tombolUtama: { backgroundColor: "#4A6FA5", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  teksTombolUtama: { color: "#fff", fontSize: 16, fontWeight: "600" },
  teksLoading: { marginTop: 12, color: "#7F8C8D" },
  daftarRiwayat: { paddingHorizontal: 16, paddingBottom: 16 },
  itemRiwayat: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  ikonBuku: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: "#4A6FA5",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  teksIkonBuku: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  infoRiwayat: { flex: 1 },
  namaRiwayat: { fontSize: 15, fontWeight: "600", color: "#2C3E50" },
  subRiwayat: { fontSize: 12, color: "#7F8C8D", marginTop: 2 },
  tombolHapus: { padding: 8 },
  teksHapus: { color: "#B0B0B0", fontSize: 16 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#E5E5E5", backgroundColor: "#fff",
  },
  tombolKembali: { marginRight: 12 },
  tombolHeaderKanan: { marginLeft: 16 },
  teksKembali: { color: "#4A6FA5", fontSize: 16, fontWeight: "600" },
  namaFileHeader: { flex: 1, fontSize: 15, fontWeight: "500", color: "#2C3E50" },
  pdf: { flex: 1, width: "100%", height: "100%" },
  navigasi: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#E5E5E5",
  },
  teksNavigasi: { color: "#2C3E50" },
  indikatorLatar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 6, backgroundColor: "#F0F2F5",
  },
  teksIndikatorLatar: { fontSize: 11, color: "#7F8C8D", marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  panelPengaturan: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, maxHeight: "80%" },
  judulPanel: { fontSize: 18, fontWeight: "bold", color: "#2C3E50", marginBottom: 20 },
  labelPanel: { fontSize: 15, color: "#2C3E50", marginBottom: 10 },
  barisFont: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  tombolFont: { backgroundColor: "#F0F2F5", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  teksTombolFont: { fontSize: 16, fontWeight: "600", color: "#4A6FA5" },
  angkaFont: { marginHorizontal: 20, fontSize: 16, fontWeight: "600", color: "#2C3E50", minWidth: 30, textAlign: "center" },
  barisModeGelap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  saklar: { width: 50, height: 28, borderRadius: 14, backgroundColor: "#D0D0D0", padding: 3 },
  saklarAktif: { backgroundColor: "#4A6FA5" },
  bulatSaklar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  bulatSaklarAktif: { marginLeft: 22 },
  blokBahasa: { marginTop: 12, marginBottom: 8 },
  barisChip: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipBahasa: {
    borderWidth: 1, borderColor: "#D0D0D0", borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  chipBahasaAktif: { backgroundColor: "#4A6FA5", borderColor: "#4A6FA5" },
  teksChip: { color: "#2C3E50", fontSize: 13 },
  teksChipAktif: { color: "#fff", fontWeight: "600" },
  catatanMetode: { fontSize: 12, color: "#B0730E", marginTop: 8, lineHeight: 17 },
  barisCari: {
    flexDirection: "row", alignItems: "center", padding: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: "#E5E5E5",
  },
  inputCari: {
    flex: 1, borderWidth: 1, borderColor: "#D0D0D0", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 15,
  },
  tombolCariAksi: { backgroundColor: "#4A6FA5", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  teksTombolCariAksi: { color: "#fff", fontWeight: "600" },
  daftarHasilCari: { padding: 12 },
  itemHasilCari: {
    backgroundColor: "#F7F8FA", borderRadius: 10, padding: 12, marginBottom: 8,
  },
  labelBabHasil: { fontSize: 12, fontWeight: "700", color: "#4A6FA5", marginBottom: 4 },
  cuplikanHasil: { fontSize: 14, color: "#2C3E50", lineHeight: 20 },
  teksKosongCari: { textAlign: "center", color: "#7F8C8D", marginTop: 40 },
  isiTerjemahanPdf: { padding: 16 },
  teksTerjemahanPdf: { fontSize: 16, lineHeight: 24, color: "#2C3E50" },
  panelTerjemahanPdfBawah: {
    flex: 0.45,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#F7F8FA",
  },
  headerTerjemahanPdfKecil: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#fff",
  },
  labelTerjemahanPdfKecil: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3E50",
  },
});