import { BabEpub } from "@/utils/epubReader";
import { Bahasa, MetodeTerjemahan, terjemahkanHtml } from "@/utils/terjemahan";
import { useEffect, useRef, useState } from "react";

export function useTerjemahanEpub(
  babEpub: BabEpub[],
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

  // Setiap file baru dibuka, atau bahasa/metode diganti, cache lama tidak relevan lagi
  useEffect(() => {
    tokenRef.current += 1;
    cacheRef.current = {};
    setCache({});
    setModeTerjemahan(false);
    setSedangProsesLatar(false);
  }, [babEpub, bahasaSumber, bahasaTujuan, metode]);

  function updateCache(index: number, html: string) {
    cacheRef.current = { ...cacheRef.current, [index]: html };
    setCache(cacheRef.current);
  }

  async function pastikanBab(index: number) {
    if (cacheRef.current[index]) return;
    const token = tokenRef.current;
    const asli = babEpub[index]?.html || "";
    const hasil = await terjemahkanHtml(asli, bahasaSumber, bahasaTujuan, metode);
    if (token === tokenRef.current) updateCache(index, hasil);
  }

  function mulaiLatar(babAwal: number) {
    if (latarRef.current) return;
    latarRef.current = true;
    setSedangProsesLatar(true);
    const token = tokenRef.current;

    const urutan: number[] = [];
    for (let i = babAwal + 1; i < babEpub.length; i++) urutan.push(i);
    for (let i = 0; i < babAwal; i++) urutan.push(i);

    (async () => {
      for (const i of urutan) {
        if (token !== tokenRef.current) break;
        if (cacheRef.current[i]) continue;
        try {
          await pastikanBab(i);
        } catch (err) {
          console.log("Gagal menerjemahkan bab di latar (bab " + (i + 1) + "):", err);
        }
      }
      latarRef.current = false;
      if (token === tokenRef.current) setSedangProsesLatar(false);
    })();
  }

  async function toggle(babKe: number) {
    if (modeTerjemahan) {
      setModeTerjemahan(false);
      return;
    }
    const token = tokenRef.current;
    if (!cacheRef.current[babKe]) {
      setSedangMenerjemahkan(true);
      try {
        await pastikanBab(babKe);
      } catch (err) {
        console.log("Gagal menerjemahkan:", err);
        setSedangMenerjemahkan(false);
        return;
      }
      setSedangMenerjemahkan(false);
    }
    if (token === tokenRef.current) {
      setModeTerjemahan(true);
      mulaiLatar(babKe);
    }
  }

  function pindahBab(babBaru: number) {
    if (modeTerjemahan && !cacheRef.current[babBaru]) {
      const token = tokenRef.current;
      setSedangMenerjemahkan(true);
      pastikanBab(babBaru).finally(() => {
        if (token === tokenRef.current) setSedangMenerjemahkan(false);
      });
    }
  }

  return { cache, modeTerjemahan, sedangMenerjemahkan, sedangProsesLatar, toggle, pindahBab };
}