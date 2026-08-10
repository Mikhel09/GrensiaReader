import { Header } from "@/components/reader/Header";
import { ReaderWebView } from "@/components/reader/ReaderWebView";
import { styles } from "@/styles/reader";
import { EkstrakPdfTeks } from "@/utils/pdfEkstrak";
import { bungkusHtml, teksParagrafKeHtml } from "@/utils/tampilan";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Button, Text, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";

function PdfInnerView({
  pdfRef,
  fileUri,
  initialPage,
  onPageChanged,
}: {
  pdfRef: React.RefObject<any>;
  fileUri: string;
  initialPage: number;
  onPageChanged: (halaman: number, total: number) => void;
}) {
  // "Dibekukan" sekali saat komponen ini pertama kali muncul di layar,
  // supaya navigasi selanjutnya (lewat ref) tidak bentrok dengan prop ini.
  const [halamanAwal] = useState(initialPage);

  return (
    <Pdf
      ref={pdfRef}
      source={{ uri: fileUri, cache: true }}
      style={styles.pdf}
      page={halamanAwal}
      onPageChanged={onPageChanged}
      onError={(error) => console.log("Error membuka PDF:", error)}
    />
  );
}

export function PdfScreen({
  namaFile, onKembali, fileUri,
  pdfBase64, pdfTeksPerHalaman, pdfSedangEkstrak, pdfErrorEkstrak, pdfRetryKey,
  onSelesaiEkstrak, onGagalEkstrak, onCobaLagiEkstrak,
  pdfHalaman, pdfTotalHalaman, onPageChanged, onPindahHalaman,
  pdfJumpTarget, pdfJumpToken,
  htmlTerjemahan, modeTerjemahan, sedangMenerjemahkan, sedangProsesLatar,
  onToggleTerjemahan, onBukaPengaturan, onBukaPencarian, ukuranFont, modeGelap,
}: {
  namaFile: string;
  onKembali: () => void;
  fileUri: string;
  pdfBase64: string | null;
  pdfTeksPerHalaman: string[] | null;
  pdfSedangEkstrak: boolean;
  pdfErrorEkstrak: string | null;
  pdfRetryKey: number;
  onSelesaiEkstrak: (hasil: string[]) => void;
  onGagalEkstrak: (pesan: string) => void;
  onCobaLagiEkstrak: () => void;
  pdfHalaman: number;
  pdfTotalHalaman: number;
  onPageChanged: (halaman: number, total: number) => void;
  onPindahHalaman: (arah: 1 | -1) => void;
  pdfJumpTarget: number;
  pdfJumpToken: number;
  htmlTerjemahan: string | undefined;
  modeTerjemahan: boolean;
  sedangMenerjemahkan: boolean;
  sedangProsesLatar: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
  ukuranFont: number;
  modeGelap: boolean;
}) {
  const pdfSiap = !!pdfTeksPerHalaman;
  const totalTampil = pdfTotalHalaman || pdfTeksPerHalaman?.length || 0;
  const pdfRef = useRef<any>(null);

  // Lompatan halaman dari hasil pencarian (bukan navigasi tombol biasa)
  useEffect(() => {
    if (pdfJumpToken > 0 && !modeTerjemahan) {
      pdfRef.current?.setPage(pdfJumpTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfJumpToken]);

  function handlePindah(arah: 1 | -1) {
    if (!modeTerjemahan) {
      pdfRef.current?.setPage(pdfHalaman + arah);
    }
    onPindahHalaman(arah);
  }

  return (
    <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
      <Header
        namaFile={namaFile}
        onKembali={onKembali}
        tampilkanFiturDokumen={pdfSiap}
        labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
        sedangMenerjemahkan={sedangMenerjemahkan && !modeTerjemahan}
        onToggleTerjemahan={onToggleTerjemahan}
        onBukaPengaturan={onBukaPengaturan}
        onBukaPencarian={onBukaPencarian}
      />

      {modeTerjemahan ? (
        sedangMenerjemahkan ? (
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#4A6FA5" />
            <Text style={styles.teksLoading}>Menerjemahkan halaman ini...</Text>
          </View>
       ) : (
          <ReaderWebView html={bungkusHtml(teksParagrafKeHtml(htmlTerjemahan || ""), ukuranFont, modeGelap)} resetKey={`pdf-${pdfHalaman}`} />
        )
      ) : (
        <PdfInnerView pdfRef={pdfRef} fileUri={fileUri} initialPage={pdfHalaman} onPageChanged={onPageChanged} />
      )}

      {pdfSedangEkstrak && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menyiapkan pencarian & terjemahan...</Text>
        </View>
      )}
      {pdfErrorEkstrak && (
        <View style={styles.indikatorLatar}>
          <Text style={styles.teksIndikatorLatar}>{pdfErrorEkstrak}</Text>
          <TouchableOpacity onPress={onCobaLagiEkstrak} style={{ marginLeft: 10 }}>
            <Text style={[styles.teksIndikatorLatar, { color: "#4A6FA5", fontWeight: "700" }]}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}
      {pdfBase64 && !pdfTeksPerHalaman && !pdfErrorEkstrak && (
        <EkstrakPdfTeks key={pdfRetryKey} base64={pdfBase64} onSelesai={onSelesaiEkstrak} onError={onGagalEkstrak} />
      )}
      {sedangProsesLatar && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menerjemahkan halaman lainnya di latar belakang...</Text>
        </View>
      )}

      {pdfSiap && (
        <View style={styles.navigasi}>
          <Button title="‹ Sebelumnya" disabled={pdfHalaman <= 1} onPress={() => handlePindah(-1)} />
          <Text style={styles.teksNavigasi}>Halaman {pdfHalaman} / {totalTampil || "?"}</Text>
          <Button title="Selanjutnya ›" disabled={pdfHalaman >= totalTampil} onPress={() => handlePindah(1)} />
        </View>
      )}
    </SafeAreaView>
  );
}