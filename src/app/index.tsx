import { DocxScreen } from "@/components/reader/DocxScreen";
import { EpubScreen } from "@/components/reader/EpubScreen";
import { PanelPencarian } from "@/components/reader/PanelPencarian";
import { PanelPengaturan } from "@/components/reader/PanelPengaturan";
import { PdfScreen } from "@/components/reader/PdfScreen";
import { RakBuku } from "@/components/reader/RakBuku";
import { TxtScreen } from "@/components/reader/TxtScreen";
import { useDokumen } from "@/hooks/useDokumen";
import { usePencarian } from "@/hooks/usePencarian";
import { useTerjemahanDokumen } from "@/hooks/useTerjemahanDokumen";
import { useTerjemahanEpub } from "@/hooks/useTerjemahanEpub";
import { useTerjemahanPdf } from "@/hooks/useTerjemahanPdf";
import { styles } from "@/styles/reader";
import { eksporTeksKeFile, susunEksporDokumen, susunEksporEpub, susunEksporPdf } from "@/utils/ekspor";
import { Bahasa, DAFTAR_BAHASA, MetodeTerjemahan } from "@/utils/terjemahan";
import { useState } from "react";
import { ActivityIndicator, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const dok = useDokumen();

  const [ukuranFont, setUkuranFont] = useState(18);
  const [modeGelap, setModeGelap] = useState(false);
  const [panelPengaturanTerbuka, setPanelPengaturanTerbuka] = useState(false);
  const [bahasaSumber, setBahasaSumber] = useState<Bahasa>(
    DAFTAR_BAHASA.find((b) => b.label === "Inggris") ?? DAFTAR_BAHASA[0]
  );
  const [bahasaTujuan, setBahasaTujuan] = useState<Bahasa>(
    DAFTAR_BAHASA.find((b) => b.label === "Indonesia") ?? DAFTAR_BAHASA[DAFTAR_BAHASA.length - 1]
  );
  const [metode, setMetode] = useState<MetodeTerjemahan>("google");

  const terjemahanEpub = useTerjemahanEpub(dok.babEpub, bahasaSumber, bahasaTujuan, metode);
  const terjemahanPdf = useTerjemahanPdf(dok.pdfTeksUntukTerjemahan, bahasaSumber, bahasaTujuan, metode);
  const terjemahanDocx = useTerjemahanDokumen(dok.htmlDokumen, "html", bahasaSumber, bahasaTujuan, metode);
  const terjemahanTxt = useTerjemahanDokumen(dok.teksTxt, "teks", bahasaSumber, bahasaTujuan, metode);

  const pencarian = usePencarian();

  async function eksporEpub() {
    if (Object.keys(terjemahanEpub.cache).length === 0) {
      Alert.alert("Belum ada terjemahan", "Terjemahkan minimal satu bab dulu sebelum mengekspor.");
      return;
    }
    const konten = susunEksporEpub(dok.namaFile, dok.babEpub.length, terjemahanEpub.cache);
    await eksporTeksKeFile(`${dok.namaFile}_terjemahan.txt`, konten);
  }

  async function eksporPdf() {
    if (Object.keys(terjemahanPdf.cache).length === 0) {
      Alert.alert("Belum ada terjemahan", "Terjemahkan minimal satu halaman dulu sebelum mengekspor.");
      return;
    }
    const jumlahHalaman = dok.pdfTeksPerHalaman?.length || 0;
    const konten = susunEksporPdf(dok.namaFile, jumlahHalaman, terjemahanPdf.cache);
    await eksporTeksKeFile(`${dok.namaFile}_terjemahan.txt`, konten);
  }

  async function eksporDocx() {
    if (!terjemahanDocx.hasil) {
      Alert.alert("Belum ada terjemahan", "Terjemahkan dokumen ini dulu sebelum mengekspor.");
      return;
    }
    const konten = susunEksporDokumen(dok.namaFile, terjemahanDocx.hasil, "html");
    await eksporTeksKeFile(`${dok.namaFile}_terjemahan.txt`, konten);
  }

  async function eksporTxt() {
    if (!terjemahanTxt.hasil) {
      Alert.alert("Belum ada terjemahan", "Terjemahkan dokumen ini dulu sebelum mengekspor.");
      return;
    }
    const konten = susunEksporDokumen(dok.namaFile, terjemahanTxt.hasil, "teks");
    await eksporTeksKeFile(`${dok.namaFile}_terjemahan.txt`, konten);
  }

  if (dok.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.teksLoading}>Membuka file...</Text>
      </SafeAreaView>
    );
  }

  if (!dok.fileUri) {
    return (
      <RakBuku
        daftarRiwayat={dok.daftarRiwayat}
        onPilihFile={dok.pilihFile}
        onBukaDariRiwayat={dok.bukaDariRiwayat}
        onHapusDariRiwayat={dok.hapusDariRiwayat}
      />
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

  const labelSatuan = dok.tipeFile === "epub" ? "Bab" : dok.tipeFile === "pdf" ? "Halaman" : null;

  const panelCari = (
    <PanelPencarian
      visible={pencarian.terbuka}
      onTutup={() => pencarian.setTerbuka(false)}
      kueri={pencarian.kueri}
      setKueri={pencarian.setKueri}
      onCari={() =>
        pencarian.jalankan(dok.tipeFile, {
          babEpub: dok.babEpub,
          htmlDokumen: dok.htmlDokumen,
          teksTxt: dok.teksTxt,
          pdfTeksPerHalaman: dok.pdfTeksPerHalaman,
        })
      }
      sedangMencari={pencarian.sedangMencari}
      hasil={pencarian.hasil}
      labelSatuan={labelSatuan}
      onTekanHasil={(item) => {
        if (dok.tipeFile === "epub" && item.babIndex !== null) {
          dok.setBabKe(item.babIndex);
        } else if (dok.tipeFile === "pdf" && item.babIndex !== null) {
          terjemahanPdf.keluarTerjemahan();
          dok.lompatKeHalamanPdf(item.babIndex + 1);
        }
        pencarian.setTerbuka(false);
      }}
    />
  );

  if (dok.tipeFile === "epub") {
    return (
      <>
        <EpubScreen
          namaFile={dok.namaFile}
          onKembali={dok.kembaliKeAwal}
          babEpub={dok.babEpub}
          babKe={dok.babKe}
          onPindahBab={(arah) => {
            const babBaru = dok.babKe + arah;
            dok.setBabKe(babBaru);
            terjemahanEpub.pindahBab(babBaru);
          }}
          htmlAsli={dok.babEpub[dok.babKe]?.html || ""}
          htmlTerjemahan={terjemahanEpub.cache[dok.babKe]}
          modeTerjemahan={terjemahanEpub.modeTerjemahan}
          sedangMenerjemahkan={terjemahanEpub.sedangMenerjemahkan}
          sedangProsesLatar={terjemahanEpub.sedangProsesLatar}
          onToggleTerjemahan={() => terjemahanEpub.toggle(dok.babKe)}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => pencarian.setTerbuka(true)}
          onEkspor={eksporEpub}
          ukuranFont={ukuranFont}
          modeGelap={modeGelap}
        />
        {panel}
        {panelCari}
      </>
    );
  }

  if (dok.tipeFile === "docx") {
    return (
      <>
        <DocxScreen
          namaFile={dok.namaFile}
          onKembali={dok.kembaliKeAwal}
          htmlAsli={dok.htmlDokumen}
          htmlTerjemahan={terjemahanDocx.hasil}
          modeTerjemahan={terjemahanDocx.modeTerjemahan}
          sedangMenerjemahkan={terjemahanDocx.sedangMenerjemahkan}
          onToggleTerjemahan={terjemahanDocx.toggle}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => pencarian.setTerbuka(true)}
          onEkspor={eksporDocx}
          ukuranFont={ukuranFont}
          modeGelap={modeGelap}
        />
        {panel}
        {panelCari}
      </>
    );
  }

  if (dok.tipeFile === "txt") {
    return (
      <>
        <TxtScreen
          namaFile={dok.namaFile}
          onKembali={dok.kembaliKeAwal}
          teksAsli={dok.teksTxt}
          teksTerjemahan={terjemahanTxt.hasil}
          modeTerjemahan={terjemahanTxt.modeTerjemahan}
          sedangMenerjemahkan={terjemahanTxt.sedangMenerjemahkan}
          onToggleTerjemahan={terjemahanTxt.toggle}
          onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
          onBukaPencarian={() => pencarian.setTerbuka(true)}
          onEkspor={eksporTxt}
          ukuranFont={ukuranFont}
          modeGelap={modeGelap}
        />
        {panel}
        {panelCari}
      </>
    );
  }

  return (
    <>
      <PdfScreen
        namaFile={dok.namaFile}
        onKembali={dok.kembaliKeAwal}
        fileUri={dok.fileUri}
        pdfBase64={dok.pdfBase64}
        pdfTeksPerHalaman={dok.pdfTeksPerHalaman}
        pdfSedangEkstrak={dok.pdfSedangEkstrak}
        pdfErrorEkstrak={dok.pdfErrorEkstrak}
        pdfRetryKey={dok.pdfRetryKey}
        onSelesaiEkstrak={dok.selesaiEkstrakPdf}
        onGagalEkstrak={dok.gagalEkstrakPdf}
        onCobaLagiEkstrak={dok.cobaLagiEkstrakPdf}
        pdfHalaman={dok.pdfHalaman}
        pdfTotalHalaman={dok.pdfTotalHalaman}
        onPageChanged={(halaman, total) => {
          dok.setPdfHalaman(halaman);
          dok.setPdfTotalHalaman(total);
        }}
        onPindahHalaman={(arah) => {
          const halamanBaru = dok.pdfHalaman + arah;
          dok.setPdfHalaman(halamanBaru);
          terjemahanPdf.pindahHalaman(halamanBaru);
        }}
        pdfJumpTarget={dok.pdfJumpTarget}
        pdfJumpToken={dok.pdfJumpToken}
        htmlTerjemahan={terjemahanPdf.cache[dok.pdfHalaman - 1]}
        modeTerjemahan={terjemahanPdf.modeTerjemahan}
        sedangMenerjemahkan={terjemahanPdf.sedangMenerjemahkan}
        sedangProsesLatar={terjemahanPdf.sedangProsesLatar}
        onToggleTerjemahan={() => terjemahanPdf.toggle(dok.pdfHalaman)}
        onBukaPengaturan={() => setPanelPengaturanTerbuka(true)}
        onBukaPencarian={() => pencarian.setTerbuka(true)}
        onEkspor={eksporPdf}
        ukuranFont={ukuranFont}
        modeGelap={modeGelap}
      />
      {panel}
      {panelCari}
    </>
  );
}