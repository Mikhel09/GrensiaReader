import { bukaDocx } from "@/utils/docxReader";
import { BabEpub, bukaEpub } from "@/utils/epubReader";
import { ambilRiwayat, BukuRiwayat, hapusRiwayat, simpanRiwayat } from "@/utils/riwayat";
import { bungkusHtml } from "@/utils/tampilan";
import { terjemahkanHtml, terjemahkanTeksPolos } from "@/utils/terjemahan";
import { TranslateLanguage } from "@react-native-ml-kit/translate-text";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type TipeFile = "pdf" | "epub" | "txt" | "docx" | null;

// Daftar bahasa yang didukung aplikasi ini
const DAFTAR_BAHASA: { kode: TranslateLanguage; label: string }[] = [
  { kode: TranslateLanguage.CHINESE, label: "Cina" },
  { kode: TranslateLanguage.JAPANESE, label: "Jepang" },
  { kode: TranslateLanguage.KOREAN, label: "Korea" },
  { kode: TranslateLanguage.INDONESIAN, label: "Indonesia" },
];

function labelBahasa(kode: TranslateLanguage): string {
  return DAFTAR_BAHASA.find((b) => b.kode === kode)?.label || kode;
}

function Header({
  namaFile,
  onKembali,
  tampilkanTombolTerjemahan,
  modeTerjemahan,
  sedangMenerjemahkan,
  onToggleTerjemahan,
  onBukaPengaturan,
}: {
  namaFile: string;
  onKembali: () => void;
  tampilkanTombolTerjemahan: boolean;
  modeTerjemahan: boolean;
  sedangMenerjemahkan: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onKembali} style={styles.tombolKembali}>
        <Text style={styles.teksKembali}>‹ Kembali</Text>
      </TouchableOpacity>
      <Text style={styles.namaFileHeader} numberOfLines={1}>
        {namaFile}
      </Text>
      {tampilkanTombolTerjemahan && (
        <TouchableOpacity onPress={onToggleTerjemahan} disabled={sedangMenerjemahkan} style={styles.tombolHeaderKanan}>
          {sedangMenerjemahkan ? (
            <ActivityIndicator size="small" color="#4A6FA5" />
          ) : (
            <Text style={styles.teksKembali}>{modeTerjemahan ? "Teks Asli" : "Terjemahkan"}</Text>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onBukaPengaturan} style={styles.tombolHeaderKanan}>
        <Text style={styles.teksKembali}>Aa</Text>
      </TouchableOpacity>
    </View>
  );
}

function PilihanBahasa({
  label,
  terpilih,
  onPilih,
}: {
  label: string;
  terpilih: TranslateLanguage;
  onPilih: (kode: TranslateLanguage) => void;
}) {
  return (
    <View style={styles.blokBahasa}>
      <Text style={styles.labelPanel}>{label}</Text>
      <View style={styles.barisChip}>
        {DAFTAR_BAHASA.map((bahasa) => (
          <TouchableOpacity
            key={bahasa.kode}
            style={[styles.chipBahasa, terpilih === bahasa.kode && styles.chipBahasaAktif]}
            onPress={() => onPilih(bahasa.kode)}
          >
            <Text style={[styles.teksChip, terpilih === bahasa.kode && styles.teksChipAktif]}>
              {bahasa.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PanelPengaturan({
  visible, onTutup, ukuranFont, setUkuranFont, modeGelap, setModeGelap,
  bahasaSumber, setBahasaSumber, bahasaTujuan, setBahasaTujuan,
}: {
  visible: boolean; onTutup: () => void; ukuranFont: number; setUkuranFont: (n: number) => void;
  modeGelap: boolean; setModeGelap: (b: boolean) => void;
  bahasaSumber: TranslateLanguage; setBahasaSumber: (b: TranslateLanguage) => void;
  bahasaTujuan: TranslateLanguage; setBahasaTujuan: (b: TranslateLanguage) => void;
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

  const [htmlDokumen, setHtmlDokumen] = useState("");
  const [htmlDokumenTerjemahan, setHtmlDokumenTerjemahan] = useState<string | null>(null);

  const [teksTxt, setTeksTxt] = useState("");
  const [teksTxtTerjemahan, setTeksTxtTerjemahan] = useState<string | null>(null);

  const [modeTerjemahan, setModeTerjemahan] = useState(false);
  const [sedangMenerjemahkan, setSedangMenerjemahkan] = useState(false);

  const [ukuranFont, setUkuranFont] = useState(18);
  const [modeGelap, setModeGelap] = useState(false);
  const [panelPengaturanTerbuka, setPanelPengaturanTerbuka] = useState(false);

  // Pengaturan bahasa terjemahan
  const [bahasaSumber, setBahasaSumberAsli] = useState<TranslateLanguage>(TranslateLanguage.CHINESE);
  const [bahasaTujuan, setBahasaTujuanAsli] = useState<TranslateLanguage>(TranslateLanguage.INDONESIAN);

  // Kalau bahasa diganti, cache terjemahan lama sudah tidak relevan -> kosongkan
  function setBahasaSumber(kode: TranslateLanguage) {
    setBahasaSumberAsli(kode);
    setCacheTerjemahanEpub({});
    setHtmlDokumenTerjemahan(null);
    setTeksTxtTerjemahan(null);
    setModeTerjemahan(false);
  }
  function setBahasaTujuan(kode: TranslateLanguage) {
    setBahasaTujuanAsli(kode);
    setCacheTerjemahanEpub({});
    setHtmlDokumenTerjemahan(null);
    setTeksTxtTerjemahan(null);
    setModeTerjemahan(false);
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

  function kembaliKeAwal() {
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
  }

  async function bukaFileDenganUri(uri: string, nama: string, babAwal: number = 0) {
    const namaLower = nama.toLowerCase();
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

  function pindahBab(arah: 1 | -1) {
    setBabKe((b) => b + arah);
    setModeTerjemahan(false);
  }

  async function toggleTerjemahan() {
    if (modeTerjemahan) {
      setModeTerjemahan(false);
      return;
    }
    if (tipeFile === "epub" && cacheTerjemahanEpub[babKe]) {
      setModeTerjemahan(true);
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
      if (tipeFile === "epub") {
        const asli = babEpub[babKe]?.html || "";
        const hasil = await terjemahkanHtml(asli, bahasaSumber, bahasaTujuan);
        setCacheTerjemahanEpub((prev) => ({ ...prev, [babKe]: hasil }));
      } else if (tipeFile === "docx") {
        const hasil = await terjemahkanHtml(htmlDokumen, bahasaSumber, bahasaTujuan);
        setHtmlDokumenTerjemahan(hasil);
      } else if (tipeFile === "txt") {
        const hasil = await terjemahkanTeksPolos(teksTxt, bahasaSumber, bahasaTujuan);
        setTeksTxtTerjemahan(hasil);
      }
      setModeTerjemahan(true);
    } catch (err) {
      console.log("Gagal menerjemahkan:", err);
    } finally {
      setSedangMenerjemahkan(false);
    }
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
    />
  );

  if (tipeFile === "epub") {
    const htmlAsli = babEpub[babKe]?.html || "";
    const htmlDitampilkan = modeTerjemahan ? cacheTerjemahanEpub[babKe] || htmlAsli : htmlAsli;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header namaFile={namaFile} onKembali={kembaliKeAwal} tampilkanTombolTerjemahan modeTerjemahan={modeTerjemahan} sedangMenerjemahkan={sedangMenerjemahkan} onToggleTerjemahan={toggleTerjemahan} onBukaPengaturan={() => setPanelPengaturanTerbuka(true)} />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap) }} />
        <View style={styles.navigasi}>
          <Button title="‹ Sebelumnya" disabled={babKe === 0} onPress={() => pindahBab(-1)} />
          <Text style={styles.teksNavigasi}>Bab {babKe + 1} / {babEpub.length}</Text>
          <Button title="Selanjutnya ›" disabled={babKe === babEpub.length - 1} onPress={() => pindahBab(1)} />
        </View>
        {panel}
      </SafeAreaView>
    );
  }

  if (tipeFile === "docx") {
    const htmlDitampilkan = modeTerjemahan ? htmlDokumenTerjemahan || htmlDokumen : htmlDokumen;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header namaFile={namaFile} onKembali={kembaliKeAwal} tampilkanTombolTerjemahan modeTerjemahan={modeTerjemahan} sedangMenerjemahkan={sedangMenerjemahkan} onToggleTerjemahan={toggleTerjemahan} onBukaPengaturan={() => setPanelPengaturanTerbuka(true)} />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap) }} />
        {panel}
      </SafeAreaView>
    );
  }

  if (tipeFile === "txt") {
    const teksDitampilkan = modeTerjemahan ? teksTxtTerjemahan || teksTxt : teksTxt;
    const htmlTxt = `<pre style="white-space: pre-wrap; margin: 0;">${teksDitampilkan}</pre>`;
    return (
      <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
        <Header namaFile={namaFile} onKembali={kembaliKeAwal} tampilkanTombolTerjemahan modeTerjemahan={modeTerjemahan} sedangMenerjemahkan={sedangMenerjemahkan} onToggleTerjemahan={toggleTerjemahan} onBukaPengaturan={() => setPanelPengaturanTerbuka(true)} />
        <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlTxt, ukuranFont, modeGelap) }} />
        {panel}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
      <Header namaFile={namaFile} onKembali={kembaliKeAwal} tampilkanTombolTerjemahan={false} modeTerjemahan={false} sedangMenerjemahkan={false} onToggleTerjemahan={() => {}} onBukaPengaturan={() => setPanelPengaturanTerbuka(true)} />
      <Pdf source={{ uri: fileUri, cache: true }} style={styles.pdf} onError={(error) => console.log("Error membuka PDF:", error)} />
      {panel}
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  panelPengaturan: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
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
  blokBahasa: { marginTop: 12 },
  barisChip: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipBahasa: {
    borderWidth: 1, borderColor: "#D0D0D0", borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  chipBahasaAktif: { backgroundColor: "#4A6FA5", borderColor: "#4A6FA5" },
  teksChip: { color: "#2C3E50", fontSize: 13 },
  teksChipAktif: { color: "#fff", fontWeight: "600" },
});