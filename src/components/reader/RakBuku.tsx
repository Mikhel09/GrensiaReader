import { styles } from "@/styles/reader";
import { BukuRiwayat } from "@/utils/riwayat";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WARNA_TIPE: Record<string, string> = {
  epub: "#4A6FA5",
  pdf: "#C0503E",
  docx: "#2F6FDE",
  txt: "#6B7280",
};

export function RakBuku({
  daftarRiwayat,
  onPilihFile,
  onBukaDariRiwayat,
  onHapusDariRiwayat,
}: {
  daftarRiwayat: BukuRiwayat[];
  onPilihFile: () => void;
  onBukaDariRiwayat: (buku: BukuRiwayat) => void;
  onHapusDariRiwayat: (uri: string) => void;
}) {
  return (
    <SafeAreaView style={styles.containerRak}>
      <View style={styles.headerRak}>
        <Text style={styles.judul}>GrensiaReader</Text>
        <Text style={styles.subjudulRak}>
          {daftarRiwayat.length > 0 ? `${daftarRiwayat.length} buku tersimpan` : "Rak bukumu masih kosong"}
        </Text>
        <TouchableOpacity style={styles.tombolTambah} onPress={onPilihFile}>
          <Text style={styles.teksTombolTambah}>+  Buka File Baru</Text>
        </TouchableOpacity>
      </View>

      {daftarRiwayat.length === 0 ? (
        <View style={styles.container}>
          <Text style={styles.subjudul}>Belum ada buku yang dibuka</Text>
          <TouchableOpacity style={styles.tombolUtama} onPress={onPilihFile}>
            <Text style={styles.teksTombolUtama}>Pilih File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={daftarRiwayat}
          keyExtractor={(item) => item.uri}
          numColumns={2}
          columnWrapperStyle={styles.gridBaris}
          contentContainerStyle={styles.daftarRiwayat}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemRiwayat} onPress={() => onBukaDariRiwayat(item)} activeOpacity={0.85}>
              <View style={[styles.ikonBuku, { backgroundColor: WARNA_TIPE[item.tipe] || "#4A6FA5" }]}>
                <Text style={styles.teksIkonBuku}>{item.tipe.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => onHapusDariRiwayat(item.uri)} style={styles.tombolHapus}>
                <Text style={styles.teksHapus}>x</Text>
              </TouchableOpacity>
              <View style={styles.infoRiwayat}>
                <Text style={styles.namaRiwayat} numberOfLines={2}>{item.nama}</Text>
                {item.tipe === "epub" && <Text style={styles.subRiwayat}>Bab {item.babTerakhir + 1}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}