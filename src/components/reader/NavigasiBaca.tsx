import { ModalLompatHalaman } from "@/components/reader/ModalLompatHalaman";
import { styles } from "@/styles/reader";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function NavigasiBaca({
  halamanSekarang,
  totalHalaman,
  labelSatuan,
  onPindahKe,
}: {
  halamanSekarang: number;
  totalHalaman: number;
  labelSatuan: string;
  onPindahKe: (halaman: number) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const diAwal = halamanSekarang <= 1;
  const diAkhir = halamanSekarang >= totalHalaman;

  return (
    <View style={styles.navigasiBaru}>
      <TouchableOpacity disabled={diAwal} onPress={() => onPindahKe(1)} style={styles.tombolNavKecil}>
        <Text style={[styles.teksTombolNavKecil, diAwal && styles.teksNavNonaktif]}>{"|<"}</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={diAwal} onPress={() => onPindahKe(halamanSekarang - 1)} style={styles.tombolNav}>
        <Text style={[styles.teksTombolNav, diAwal && styles.teksNavNonaktif]}>{"<"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.indikatorHalamanTombol}>
        <Text style={styles.teksIndikatorHalamanTombol}>
          {labelSatuan} {halamanSekarang} / {totalHalaman}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity disabled={diAkhir} onPress={() => onPindahKe(halamanSekarang + 1)} style={styles.tombolNav}>
        <Text style={[styles.teksTombolNav, diAkhir && styles.teksNavNonaktif]}>{">"}</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={diAkhir} onPress={() => onPindahKe(totalHalaman)} style={styles.tombolNavKecil}>
        <Text style={[styles.teksTombolNavKecil, diAkhir && styles.teksNavNonaktif]}>{">|"}</Text>
      </TouchableOpacity>

      <ModalLompatHalaman
        visible={modalVisible}
        onTutup={() => setModalVisible(false)}
        totalHalaman={totalHalaman}
        labelSatuan={labelSatuan}
        onPilih={(h) => {
          onPindahKe(h);
          setModalVisible(false);
        }}
      />
    </View>
  );
}