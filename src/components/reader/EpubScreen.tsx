import { Header } from "@/components/reader/Header";
import { NavigasiBaca } from "@/components/reader/NavigasiBaca";
import { ReaderWebView } from "@/components/reader/ReaderWebView";
import { styles } from "@/styles/reader";
import { BabEpub, cariIndexBabDariUrl } from "@/utils/epubReader";
import { bungkusHtml } from "@/utils/tampilan";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function EpubScreen({
  namaFile, onKembali, babEpub, babKe, onPindahBab,
  htmlAsli, htmlTerjemahan, modeTerjemahan, sedangMenerjemahkan, sedangProsesLatar,
  onToggleTerjemahan, onBukaPengaturan, onBukaPencarian, onEkspor, ukuranFont, modeGelap,
}: {
  namaFile: string;
  onKembali: () => void;
  babEpub: BabEpub[];
  babKe: number;
  onPindahBab: (babBaru: number) => void;
  htmlAsli: string;
  htmlTerjemahan: string | undefined;
  modeTerjemahan: boolean;
  sedangMenerjemahkan: boolean;
  sedangProsesLatar: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
  onEkspor: () => void;
  ukuranFont: number;
  modeGelap: boolean;
}) {
  const htmlDitampilkan = modeTerjemahan ? htmlTerjemahan || htmlAsli : htmlAsli;

  function tanganiLinkInternal(url: string): boolean {
    // Abaikan link kosong/javascript, cukup blokir tanpa aksi
    if (!url || url.startsWith("javascript:") || url === "about:blank") return true;

    const indexTarget = cariIndexBabDariUrl(babEpub, url);
    if (indexTarget !== -1) {
      setTimeout(() => onPindahBab(indexTarget), 50);
      return true;
    }
    // Link tidak dikenali (mungkin link luar/website) -> abaikan saja, jangan biarkan blank
    return true;
  }

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
        onEkspor={onEkspor}
      />
      <ReaderWebView
        html={bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap)}
        resetKey={`bab-${babKe}-${modeTerjemahan ? "terj" : "asli"}`}
        onTekanLinkInternal={tanganiLinkInternal}
      />
      {sedangProsesLatar && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menerjemahkan bab lainnya di latar belakang...</Text>
        </View>
      )}
      <NavigasiBaca
        halamanSekarang={babKe + 1}
        totalHalaman={babEpub.length}
        labelSatuan="Halaman"
        onPindahKe={(h) => onPindahBab(h - 1)}
      />
    </SafeAreaView>
  );
}