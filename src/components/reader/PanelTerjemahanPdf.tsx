import { styles } from "@/styles/reader";
import { bungkusHtml } from "@/utils/tampilan";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";

function teksKeHtmlParagraf(teks: string): string {
  const paragraf = teks
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraf.length === 0) return "<p>Belum ada terjemahan untuk halaman ini.</p>";
  return paragraf.map((p) => `<p>${p}</p>`).join("");
}

export function PanelTerjemahanPdf({
  halaman,
  totalHalaman,
  sedangProses,
  teksTerjemahan,
  sedangProsesLatar,
  ukuranFont,
  modeGelap,
}: {
  halaman: number;
  totalHalaman: number;
  sedangProses: boolean;
  teksTerjemahan: string;
  sedangProsesLatar: boolean;
  ukuranFont: number;
  modeGelap: boolean;
}) {
  return (
    <View style={styles.panelTerjemahanPdfBawah}>
      <View style={styles.headerTerjemahanPdfKecil}>
        <Text style={styles.labelTerjemahanPdfKecil}>
          Terjemahan — Halaman {halaman}
          {totalHalaman ? ` / ${totalHalaman}` : ""}
        </Text>
      </View>
      {sedangProses ? (
        <View style={styles.container}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksLoading}>Menerjemahkan halaman ini...</Text>
        </View>
      ) : (
        <WebView
          originWhitelist={["*"]}
          style={styles.webviewTerjemahanPdf}
          source={{ html: bungkusHtml(teksKeHtmlParagraf(teksTerjemahan), ukuranFont, modeGelap) }}
        />
      )}
      {sedangProsesLatar && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menerjemahkan halaman lainnya di latar belakang...</Text>
        </View>
      )}
    </View>
  );
}