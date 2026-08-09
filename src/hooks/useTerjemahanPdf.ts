import { Bahasa, MetodeTerjemahan, terjemahkanTeksPanjang } from "@/utils/terjemahan";
import { useEffect, useRef, useState } from "react";

export function useTerjemahanPdf(
  pdfTeksPerHalaman: string[] | null,
  bahasaSumber: Bahasa,
  bahasaTujuan: Bahasa,
  metode: MetodeTerjemahan
) {
  const [cache, setCache] = useState<Record<number, string>>({});
  const [modeTerjemahan, setModeTerjemahan] = useState(false);
  const [sedangMenerjemahkan, setSedangMenerjemahkan] = useState(false);
  const [sedangProsesLatar, setSedangProsesLatar] = useState(false);

  const cacheRef = useRef<Record<number, string>>({});
  const tokenRef = useRef(0);
  const latarRef = useRef(false);

  useEffect(() => {
    tokenRef.current += 1;
    cacheRef.current = {};
    setCache({});
    setModeTerjemahan(false);
    setSedangProsesLatar(false);
  }, [pdfTeksPerHalaman, bahasaSumber, bahasaTujuan, metode]);

  function updateCache(index: number, teks: string) {
    cacheRef.current = { ...cacheRef.current, [index]: teks };
    setCache(cacheRef.current);
  }

  async function pastikanHalaman(index: number) {
    if (!pdfTeksPerHalaman) return;
    if (cacheRef.current[index]) return;
    const token = tokenRef.current;
    const asli = pdfTeksPerHalaman[index] || "";
    const hasil = await terjemahkanTeksPanjang(asli, bahasaSumber, bahasaTujuan, metode);
    if (token === tokenRef.current) updateCache(index, hasil);
  }

  function mulaiLatar(halamanAwal: number) {
    if (!pdfTeksPerHalaman || latarRef.current) return;
    latarRef.current = true;
    setSedangProsesLatar(true);
    const token = tokenRef.current;

    const urutan: number[] = [];
    for (let i = halamanAwal + 1; i < pdfTeksPerHalaman.length; i++) urutan.push(i);
    for (let i = 0; i < halamanAwal; i++) urutan.push(i);

    (async () => {
      for (const i of urutan) {
        if (token !== tokenRef.current) break;
        if (cacheRef.current[i]) continue;
        try {
          await pastikanHalaman(i);
        } catch (err) {
          console.log("Gagal menerjemahkan halaman PDF di latar (" + (i + 1) + "):", err);
        }
      }
      latarRef.current = false;
      if (token === tokenRef.current) setSedangProsesLatar(false);
    })();
  }

  async function toggle(halamanKe: number) {
    if (modeTerjemahan) {
      setModeTerjemahan(false);
      return;
    }
    if (!pdfTeksPerHalaman) return;
    const token = tokenRef.current;
    const idx = halamanKe - 1;
    if (!cacheRef.current[idx]) {
      setSedangMenerjemahkan(true);
      try {
        await pastikanHalaman(idx);
      } catch (err) {
        console.log("Gagal menerjemahkan halaman:", err);
        setSedangMenerjemahkan(false);
        return;
      }
      setSedangMenerjemahkan(false);
    }
    if (token === tokenRef.current) {
      setModeTerjemahan(true);
      mulaiLatar(idx);
    }
  }

  function pindahHalaman(halamanBaru: number) {
    const idx = halamanBaru - 1;
    if (modeTerjemahan && !cacheRef.current[idx]) {
      const token = tokenRef.current;
      setSedangMenerjemahkan(true);
      pastikanHalaman(idx).finally(() => {
        if (token === tokenRef.current) setSedangMenerjemahkan(false);
      });
    }
  }

  return { cache, modeTerjemahan, sedangMenerjemahkan, sedangProsesLatar, toggle, pindahHalaman };
}