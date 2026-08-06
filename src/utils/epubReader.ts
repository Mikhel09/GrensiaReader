import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";

export type BabEpub = {
  judul: string;
  html: string;
};

function tebakMimeType(namaFile: string): string {
  const ext = namaFile.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

// Menggabungkan path folder + path relatif (menangani "../")
function gabungPath(folder: string, relatif: string): string {
  const gabungan = folder.split("/").filter(Boolean);
  const bagianRelatif = relatif.split("/");

  for (const bagian of bagianRelatif) {
    if (bagian === "..") {
      gabungan.pop();
    } else if (bagian !== ".") {
      gabungan.push(bagian);
    }
  }
  return gabungan.join("/");
}

// Ganti semua src gambar di HTML jadi base64 data URI
async function tanamGambar(
  html: string,
  folderBab: string,
  zip: JSZip
): Promise<string> {
  const imgRegex = /(src|xlink:href)="([^"]+)"/g;
  const daftarMatch: { atribut: string; srcAsli: string }[] = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (!match[2].startsWith("http") && !match[2].startsWith("data:")) {
      daftarMatch.push({ atribut: match[1], srcAsli: match[2] });
    }
  }

  // Proses semua gambar secara paralel, bukan satu-satu
  const hasilProses = await Promise.all(
    daftarMatch.map(async ({ atribut, srcAsli }) => {
      const pathGambar = gabungPath(folderBab, srcAsli);
      const fileGambar = zip.file(pathGambar);
      if (!fileGambar) return null;
      try {
        const base64 = await fileGambar.async("base64");
        const mime = tebakMimeType(pathGambar);
        return {
          asli: `${atribut}="${srcAsli}"`,
          baru: `${atribut}="data:${mime};base64,${base64}"`,
        };
      } catch {
        return null;
      }
    })
  );

  let hasil = html;
  for (const item of hasilProses) {
    if (item) hasil = hasil.replace(item.asli, item.baru);
  }
  return hasil;
}

export async function bukaEpub(fileUri: string): Promise<BabEpub[]> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });

  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) throw new Error("container.xml tidak ditemukan");

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) throw new Error("Lokasi file .opf tidak ditemukan");
  const opfPath = opfPathMatch[1];

  const opfFolder = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";

  const opfContent = await zip.file(opfPath)?.async("text");
  if (!opfContent) throw new Error("File .opf gagal dibaca");

  const manifestMap: Record<string, string> = {};
  const itemRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*\/?>/g;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    manifestMap[match[1]] = match[2];
  }

  const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"/g;
  const urutanId: string[] = [];
  while ((match = spineRegex.exec(opfContent)) !== null) {
    urutanId.push(match[1]);
  }

  const babList: BabEpub[] = [];
  for (const id of urutanId) {
    const href = manifestMap[id];
    if (!href) continue;

    const fullPath = opfFolder + href;
    const babFile = zip.file(fullPath);
    if (!babFile) continue;

    const folderBab = fullPath.includes("/")
      ? fullPath.substring(0, fullPath.lastIndexOf("/") + 1)
      : "";

    let html = await babFile.async("text");
    html = await tanamGambar(html, folderBab, zip);

    babList.push({ judul: href, html });
  }

  return babList;
}