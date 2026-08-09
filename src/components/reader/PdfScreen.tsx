import { Header } from "@/components/reader/Header";
import { styles } from "@/styles/reader";
import { EkstrakPdfTeks } from "@/utils/pdfEkstrak";
import { bungkusHtml, teksParagrafKeHtml } from "@/utils/tampilan";
import { ActivityIndicator, Button, Text, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export function PdfScreen({
  namaFile, onKembali, fileUri,
  pdfBase64, pdfTeksPerHalaman, pdfSedangEkstrak, pdfErrorEkstrak, pdfRetryKey,
  onSelesaiEkstrak, onGagalEkstrak, onCobaLagiEkstrak,
  pdfHalaman, pdfTotalHalaman, onPageChanged, onPindahHalaman,
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

  return (
    <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
      <Header
        namaFile={namaFile}
        onKembali={onKembali}
        tampilkanFiturDokumen={pdfSiap}
        labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
        sedangMenerjemahkan={sedangMenerjemahkan}
        onToggleTerjemahan={onToggleTerjemahan}
        onBukaPengaturan={onBukaPengaturan}
        onBukaPencarian={onBukaPencarian}
      />

      {modeTerjemahan ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html: bungkusHtml(teksParagrafKeHtml(htmlTerjemahan || ""), ukuranFont, modeGelap) }}
        />
      ) : (
        <Pdf
          source={{ uri: fileUri, cache: true }}
          style={styles.pdf}
          page={pdfHalaman}
          onPageChanged={onPageChanged}
          onError={(error) => console.log("Error membuka PDF:", error)}
        />
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
          <Button title="‹ Sebelumnya" disabled={pdfHalaman <= 1} onPress={() => onPindahHalaman(-1)} />
          <Text style={styles.teksNavigasi}>Halaman {pdfHalaman} / {totalTampil || "?"}</Text>
          <Button title="Selanjutnya ›" disabled={pdfHalaman >= totalTampil} onPress={() => onPindahHalaman(1)} />
        </View>
      )}
    </SafeAreaView>
  );
}