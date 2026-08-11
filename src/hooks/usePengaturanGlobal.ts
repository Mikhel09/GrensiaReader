import { Bahasa, DAFTAR_BAHASA, MetodeTerjemahan } from "@/utils/terjemahan";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

const KUNCI_PENGATURAN = "pengaturan_global";

type PengaturanTersimpan = {
  ukuranFont: number;
  modeGelap: boolean;
  bahasaSumberLabel: string;
  bahasaTujuanLabel: string;
  metode: MetodeTerjemahan;
};

export function usePengaturanGlobal() {
  const [siap, setSiap] = useState(false);
  const [ukuranFont, setUkuranFont] = useState(18);
  const [modeGelap, setModeGelap] = useState(false);
  const [bahasaSumber, setBahasaSumber] = useState<Bahasa>(
    DAFTAR_BAHASA.find((b) => b.label === "Inggris") ?? DAFTAR_BAHASA[0]
  );
  const [bahasaTujuan, setBahasaTujuan] = useState<Bahasa>(
    DAFTAR_BAHASA.find((b) => b.label === "Indonesia") ?? DAFTAR_BAHASA[DAFTAR_BAHASA.length - 1]
  );
  const [metode, setMetode] = useState<MetodeTerjemahan>("google");

  const sudahMuatRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(KUNCI_PENGATURAN);
        if (data) {
          const p: PengaturanTersimpan = JSON.parse(data);
          setUkuranFont(p.ukuranFont);
          setModeGelap(p.modeGelap);
          const bs = DAFTAR_BAHASA.find((b) => b.label === p.bahasaSumberLabel);
          const bt = DAFTAR_BAHASA.find((b) => b.label === p.bahasaTujuanLabel);
          if (bs) setBahasaSumber(bs);
          if (bt) setBahasaTujuan(bt);
          if (p.metode) setMetode(p.metode);
        }
      } catch (err) {
        console.log("Gagal memuat pengaturan:", err);
      } finally {
        sudahMuatRef.current = true;
        setSiap(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sudahMuatRef.current) return;
    const p: PengaturanTersimpan = {
      ukuranFont,
      modeGelap,
      bahasaSumberLabel: bahasaSumber.label,
      bahasaTujuanLabel: bahasaTujuan.label,
      metode,
    };
    AsyncStorage.setItem(KUNCI_PENGATURAN, JSON.stringify(p)).catch((err) =>
      console.log("Gagal menyimpan pengaturan:", err)
    );
  }, [ukuranFont, modeGelap, bahasaSumber, bahasaTujuan, metode]);

  return {
    siap,
    ukuranFont, setUkuranFont,
    modeGelap, setModeGelap,
    bahasaSumber, setBahasaSumber,
    bahasaTujuan, setBahasaTujuan,
    metode, setMetode,
  };
}