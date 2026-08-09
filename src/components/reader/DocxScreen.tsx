import { Header } from "@/components/reader/Header";
import { styles } from "@/styles/reader";
import { bungkusHtml } from "@/utils/tampilan";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export function DocxScreen({
  namaFile, onKembali, htmlAsli, htmlTerjemahan, modeTerjemahan, sedangMenerjemahkan,
  onToggleTerjemahan, onBukaPengaturan, onBukaPencarian, ukuranFont, modeGelap,
}: {
  namaFile: string;
  onKembali: () => void;
  htmlAsli: string;
  htmlTerjemahan: string | null;
  modeTerjemahan: boolean;
  sedangMenerjemahkan: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
  ukuranFont: number;
  modeGelap: boolean;
}) {
  const htmlDitampilkan = modeTerjemahan ? htmlTerjemahan || htmlAsli : htmlAsli;
  return (
    <SafeAreaView style={[styles.containerBaca, modeGelap && styles.containerGelap]} edges={["top"]}>
      <Header
        namaFile={namaFile}
        onKembali={onKembali}
        tampilkanFiturDokumen
        labelTombolTerjemahan={modeTerjemahan ? "Teks Asli" : "Terjemahkan"}
        sedangMenerjemahkan={sedangMenerjemahkan}
        onToggleTerjemahan={onToggleTerjemahan}
        onBukaPengaturan={onBukaPengaturan}
        onBukaPencarian={onBukaPencarian}
      />
      <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap) }} />
    </SafeAreaView>
  );
}