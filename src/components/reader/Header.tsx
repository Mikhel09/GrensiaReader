import { styles } from "@/styles/reader";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function Header({
  namaFile,
  onKembali,
  tampilkanFiturDokumen,
  labelTombolTerjemahan,
  sedangMenerjemahkan,
  onToggleTerjemahan,
  onBukaPengaturan,
  onBukaPencarian,
  onEkspor,
}: {
  namaFile: string;
  onKembali: () => void;
  tampilkanFiturDokumen: boolean;
  labelTombolTerjemahan: string;
  sedangMenerjemahkan: boolean;
  onToggleTerjemahan: () => void;
  onBukaPengaturan: () => void;
  onBukaPencarian: () => void;
  onEkspor?: () => void;
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
      {tampilkanFiturDokumen && onEkspor && (
        <TouchableOpacity onPress={onEkspor} style={styles.tombolHeaderKanan}>
          <Text style={styles.teksKembali}>⬇</Text>
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