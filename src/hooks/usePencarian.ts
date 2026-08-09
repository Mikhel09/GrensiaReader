import { HasilCariTampil, TipeFile } from "@/types/reader";
import { BabEpub } from "@/utils/epubReader";
import { cariDalamTeks } from "@/utils/pencarian";
import { ambilTeksPolos } from "@/utils/terjemahan";
import { useState } from "react";

export function usePencarian() {
  const [terbuka, setTerbuka] = useState(false);
  const [kueri, setKueri] = useState("");
  const [hasil, setHasil] = useState<HasilCariTampil[]>([]);
  const [sedangMencari, setSedangMencari] = useState(false);

  function jalankan(
    tipeFile: TipeFile,
    data: { babEpub?: BabEpub[]; htmlDokumen?: string; teksTxt?: string; pdfTeksPerHalaman?: string[] | null }
  ) {
    if (!kueri.trim()) {
      setHasil([]);
      return;
    }
    setSedangMencari(true);
    try {
      if (tipeFile === "epub" && data.babEpub) {
        const semuaHasil: HasilCariTampil[] = [];
        data.babEpub.forEach((bab, i) => {
          const teksPolos = ambilTeksPolos(bab.html);
          cariDalamTeks(teksPolos, kueri, 5).forEach((h) => semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan }));
        });
        setHasil(semuaHasil);
      } else if (tipeFile === "docx" && data.htmlDokumen !== undefined) {
        const teksPolos = ambilTeksPolos(data.htmlDokumen);
        setHasil(cariDalamTeks(teksPolos, kueri, 30).map((h) => ({ babIndex: null, cuplikan: h.cuplikan })));
      } else if (tipeFile === "txt" && data.teksTxt !== undefined) {
        setHasil(cariDalamTeks(data.teksTxt, kueri, 30).map((h) => ({ babIndex: null, cuplikan: h.cuplikan })));
      } else if (tipeFile === "pdf" && data.pdfTeksPerHalaman) {
        const semuaHasil: HasilCariTampil[] = [];
        data.pdfTeksPerHalaman.forEach((teksHalaman, i) => {
          cariDalamTeks(teksHalaman, kueri, 5).forEach((h) => semuaHasil.push({ babIndex: i, cuplikan: h.cuplikan }));
        });
        setHasil(semuaHasil);
      }
    } finally {
      setSedangMencari(false);
    }
  }

  return { terbuka, setTerbuka, kueri, setKueri, hasil, sedangMencari, jalankan };
}