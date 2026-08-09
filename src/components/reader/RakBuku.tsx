import { styles } from "@/styles/reader";
import { BukuRiwayat } from "@/utils/riwayat";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <TouchableOpacity style={styles.tombolTambah} onPress={onPilihFile}>
          <Text style={styles.teksTombolTambah}>+ Buka File</Text>
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
          contentContainerStyle={styles.daftarRiwayat}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemRiwayat} onPress={() => onBukaDariRiwayat(item)}>
              <View style={styles.ikonBuku}>
                <Text style={styles.teksIkonBuku}>{item.tipe.toUpperCase()}</Text>
              </View>
              <View style={styles.infoRiwayat}>
                <Text style={styles.namaRiwayat} numberOfLines={1}>{item.nama}</Text>
                {item.tipe === "epub" && <Text style={styles.subRiwayat}>Bab {item.babTerakhir + 1}</Text>}
              </View>
              <TouchableOpacity onPress={() => onHapusDariRiwayat(item.uri)} style={styles.tombolHapus}>
                <Text style={styles.teksHapus}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}