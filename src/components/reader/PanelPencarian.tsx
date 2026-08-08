import { styles } from "@/styles/reader";
import { HasilCariTampil } from "@/types/reader";
import { ActivityIndicator, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function PanelPencarian({
  visible,
  onTutup,
  kueri,
  setKueri,
  onCari,
  sedangMencari,
  hasil,
  labelSatuan,
  onTekanHasil,
}: {
  visible: boolean;
  onTutup: () => void;
  kueri: string;
  setKueri: (s: string) => void;
  onCari: () => void;
  sedangMencari: boolean;
  hasil: HasilCariTampil[];
  labelSatuan: string | null;
  onTekanHasil: (item: HasilCariTampil) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.containerBaca}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onTutup} style={styles.tombolKembali}>
            <Text style={styles.teksKembali}>‹ Tutup</Text>
          </TouchableOpacity>
          <Text style={styles.namaFileHeader}>Cari dalam Buku</Text>
        </View>
        <View style={styles.barisCari}>
          <TextInput
            style={styles.inputCari}
            placeholder="Ketik kata yang dicari..."
            value={kueri}
            onChangeText={setKueri}
            onSubmitEditing={onCari}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.tombolCariAksi} onPress={onCari}>
            <Text style={styles.teksTombolCariAksi}>Cari</Text>
          </TouchableOpacity>
        </View>

        {sedangMencari ? (
          <ActivityIndicator size="large" color="#4A6FA5" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={hasil}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.daftarHasilCari}
            ListEmptyComponent={
              kueri.trim() ? <Text style={styles.teksKosongCari}>Tidak ada hasil ditemukan.</Text> : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.itemHasilCari} onPress={() => onTekanHasil(item)}>
                {labelSatuan && item.babIndex !== null && (
                  <Text style={styles.labelBabHasil}>
                    {labelSatuan} {item.babIndex + 1}
                  </Text>
                )}
                <Text style={styles.cuplikanHasil}>{item.cuplikan}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}