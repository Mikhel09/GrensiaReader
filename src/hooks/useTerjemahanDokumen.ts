import { Bahasa, MetodeTerjemahan, terjemahkanHtml, terjemahkanTeksPolos } from "@/utils/terjemahan";
import { useEffect, useRef, useState } from "react";

export function useTerjemahanDokumen(
  konten: string,
  tipe: "html" | "teks",
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
) {
  const [hasil, setHasil] = useState<string | null>(null);
  const [modeTerjemahan, setModeTerjemahan] = useState(false);
  const [sedangMenerjemahkan, setSedangMenerjemahkan] = useState(false);
  const tokenRef = useRef(0);

  useEffect(() => {
    tokenRef.current += 1;
    setHasil(null);
    setModeTerjemahan(false);
  }, [konten, bahasaSumber, bahasaTujuan, metode]);

  async function toggle() {
    if (modeTerjemahan) {
      setModeTerjemahan(false);
      return;
    }
    if (hasil) {
      setModeTerjemahan(true);
      return;
    }
    const token = tokenRef.current;
    setSedangMenerjemahkan(true);
    try {
      const hasilBaru =
        tipe === "html"
          ? await terjemahkanHtml(konten, bahasaSumber, bahasaTujuan, metode)
          : await terjemahkanTeksPolos(konten, bahasaSumber, bahasaTujuan, metode);
      if (token === tokenRef.current) {
        setHasil(hasilBaru);
        setModeTerjemahan(true);
      }
    } catch (err) {
      console.log("Gagal menerjemahkan:", err);
    } finally {
      setSedangMenerjemahkan(false);
    }
  }

  return { hasil, modeTerjemahan, sedangMenerjemahkan, toggle };
}