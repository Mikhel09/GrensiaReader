import { styles } from "@/styles/reader";
import { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

export function ModalLompatHalaman({
  visible,
  onTutup,
  totalHalaman,
  labelSatuan,
  onPilih,
}: {
  visible: boolean;
  onTutup: () => void;
  totalHalaman: number;
  labelSatuan: string;
  onPilih: (halaman: number) => void;
}) {
  const [input, setInput] = useState("");

  function kirim() {
    const angka = parseInt(input, 10);
    if (!Number.isNaN(angka) && angka >= 1 && angka <= totalHalaman) {
      onPilih(angka);
      setInput("");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onTutup}>
        <TouchableOpacity activeOpacity={1} style={styles.kotakLompatHalaman}>
          <Text style={styles.judulPanel}>Menuju {labelSatuan}</Text>
          <Text style={styles.labelLompatHalaman}>Masukkan nomor 1 - {totalHalaman}</Text>
          <TextInput
            style={styles.inputLompatHalaman}
            keyboardType="number-pad"
            value={input}
            onChangeText={setInput}
            placeholder={`1 - ${totalHalaman}`}
            autoFocus
            onSubmitEditing={kirim}
          />
          <View style={styles.barisTombolLompat}>
            <TouchableOpacity style={styles.tombolBatalLompat} onPress={onTutup}>
              <Text style={styles.teksTombolBatalLompat}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tombolKirimLompat} onPress={kirim}>
              <Text style={styles.teksTombolKirimLompat}>Menuju</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}