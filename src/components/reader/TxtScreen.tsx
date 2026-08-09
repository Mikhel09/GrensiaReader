import { Header } from "@/components/reader/Header";
import { styles } from "@/styles/reader";
import { bungkusHtml } from "@/utils/tampilan";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export function TxtScreen({
  namaFile, onKembali, teksAsli, teksTerjemahan, modeTerjemahan, sedangMenerjemahkan,
  onToggleTerjemahan, onBukaPengaturan, onBukaPencarian, ukuranFont, modeGelap,
}: {
  namaFile: string;
  onKembali: () => void;
  teksAsli: string;
  teksTerjemahan: string | null;
  modeTerjemahan: boolean;
  sedangMenerjemahkan: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
  ukuranFont: number;
  modeGelap: boolean;
}) {
  const teksDitampilkan = modeTerjemahan ? teksTerjemahan || teksAsli : teksAsli;
  const html = `<pre style="white-space: pre-wrap; margin: 0;">${teksDitampilkan}</pre>`;
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
      <WebView originWhitelist={["*"]} source={{ html: bungkusHtml(html, ukuranFont, modeGelap) }} />
    </SafeAreaView>
  );
}