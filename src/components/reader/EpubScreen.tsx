import { Header } from "@/components/reader/Header";
import { ReaderWebView } from "@/components/reader/ReaderWebView";
import { styles } from "@/styles/reader";
import { BabEpub } from "@/utils/epubReader";
import { bungkusHtml } from "@/utils/tampilan";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function EpubScreen({
  namaFile, onKembali, babEpub, babKe, onPindahBab,
  htmlAsli, htmlTerjemahan, modeTerjemahan, sedangMenerjemahkan, sedangProsesLatar,
  onToggleTerjemahan, onBukaPengaturan, onBukaPencarian, ukuranFont, modeGelap,
}: {
  namaFile: string;
  onKembali: () => void;
  babEpub: BabEpub[];
  babKe: number;
  onPindahBab: (arah: 1 | -1) => void;
  htmlAsli: string;
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
      <ReaderWebView html={bungkusHtml(htmlDitampilkan, ukuranFont, modeGelap)} resetKey={`bab-${babKe}`} />
      {sedangProsesLatar && (
        <View style={styles.indikatorLatar}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Text style={styles.teksIndikatorLatar}>Menerjemahkan bab lainnya di latar belakang...</Text>
        </View>
      )}
      <View style={styles.navigasi}>
        <Button title="‹ Sebelumnya" disabled={babKe === 0} onPress={() => onPindahBab(-1)} />
        <Text style={styles.teksNavigasi}>Bab {babKe + 1} / {babEpub.length}</Text>
        <Button title="Selanjutnya ›" disabled={babKe === babEpub.length - 1} onPress={() => onPindahBab(1)} />
      </View>
    </SafeAreaView>
  );
}