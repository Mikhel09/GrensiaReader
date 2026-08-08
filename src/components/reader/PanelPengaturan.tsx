import { styles } from "@/styles/reader";
import { Bahasa, DAFTAR_BAHASA, MetodeTerjemahan } from "@/utils/terjemahan";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const DAFTAR_METODE: { kode: MetodeTerjemahan; label: string }[] = [
  { kode: "mlkit", label: "ML Kit (Offline)" },
  { kode: "google", label: "Google (Online)" },
];

function PilihanBahasa({
  label,
  terpilih,
  onPilih,
}: {
  label: string;
  terpilih: Bahasa;
  onPilih: (bahasa: Bahasa) => void;
}) {
  return (
    <View style={styles.blokBahasa}>
      <Text style={styles.labelPanel}>{label}</Text>
      <View style={styles.barisChip}>
        {DAFTAR_BAHASA.map((bahasa) => (
          <TouchableOpacity
            key={bahasa.label}
            style={[styles.chipBahasa, terpilih.label === bahasa.label && styles.chipBahasaAktif]}
            onPress={() => onPilih(bahasa)}
          >
            <Text style={[styles.teksChip, terpilih.label === bahasa.label && styles.teksChipAktif]}>
              {bahasa.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PilihanMetode({
  terpilih,
  onPilih,
}: {
  terpilih: MetodeTerjemahan;
  onPilih: (metode: MetodeTerjemahan) => void;
}) {
  return (
    <View style={styles.blokBahasa}>
      <Text style={styles.labelPanel}>Mesin Terjemahan</Text>
      <View style={styles.barisChip}>
        {DAFTAR_METODE.map((m) => (
          <TouchableOpacity
            key={m.kode}
            style={[styles.chipBahasa, terpilih === m.kode && styles.chipBahasaAktif]}
            onPress={() => onPilih(m.kode)}
          >
            <Text style={[styles.teksChip, terpilih === m.kode && styles.teksChipAktif]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {terpilih === "google" && (
        <Text style={styles.catatanMetode}>
          Metode Google bersifat tidak resmi, butuh internet, dan sewaktu-waktu bisa berhenti bekerja.
        </Text>
      )}
    </View>
  );
}

export function PanelPengaturan({
  visible,
  onTutup,
  ukuranFont,
  setUkuranFont,
  modeGelap,
  setModeGelap,
  bahasaSumber,
  setBahasaSumber,
  bahasaTujuan,
  setBahasaTujuan,
  metode,
  setMetode,
}: {
  visible: boolean;
  onTutup: () => void;
  ukuranFont: number;
  setUkuranFont: (n: number) => void;
  modeGelap: boolean;
  setModeGelap: (b: boolean) => void;
  bahasaSumber: Bahasa;
  setBahasaSumber: (b: Bahasa) => void;
  bahasaTujuan: Bahasa;
  setBahasaTujuan: (b: Bahasa) => void;
  metode: MetodeTerjemahan;
  setMetode: (m: MetodeTerjemahan) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onTutup}>
        <View style={styles.panelPengaturan}>
          <Text style={styles.judulPanel}>Pengaturan Baca</Text>

          <Text style={styles.labelPanel}>Ukuran Teks</Text>
          <View style={styles.barisFont}>
            <TouchableOpacity style={styles.tombolFont} onPress={() => setUkuranFont(Math.max(12, ukuranFont - 2))}>
              <Text style={styles.teksTombolFont}>A-</Text>
            </TouchableOpacity>
            <Text style={styles.angkaFont}>{ukuranFont}</Text>
            <TouchableOpacity style={styles.tombolFont} onPress={() => setUkuranFont(Math.min(32, ukuranFont + 2))}>
              <Text style={styles.teksTombolFont}>A+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.barisModeGelap}>
            <Text style={styles.labelPanel}>Mode Gelap</Text>
            <TouchableOpacity style={[styles.saklar, modeGelap && styles.saklarAktif]} onPress={() => setModeGelap(!modeGelap)}>
              <View style={[styles.bulatSaklar, modeGelap && styles.bulatSaklarAktif]} />
            </TouchableOpacity>
          </View>

          <PilihanMetode terpilih={metode} onPilih={setMetode} />
          <PilihanBahasa label="Dari Bahasa" terpilih={bahasaSumber} onPilih={setBahasaSumber} />
          <PilihanBahasa label="Ke Bahasa" terpilih={bahasaTujuan} onPilih={setBahasaTujuan} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}