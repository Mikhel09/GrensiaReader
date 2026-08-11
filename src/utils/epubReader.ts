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

function gabungPath(folder: string, relatif: string): string {
  const gabungan = folder.split("/").filter(Boolean);
  const bagianRelatif = relatif.split("/");
  for (const bagian of bagianRelatif) {
    if (bagian === "..") gabungan.pop();
    else if (bagian !== ".") gabungan.push(bagian);
  }
  return gabungan.join("/");
}

async function tanamGambar(html: string, folderBab: string, zip: JSZip): Promise<string> {
  const imgRegex = /(src|xlink:href)="([^"]+)"/g;
  const daftarMatch: { atribut: string; srcAsli: string }[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (!match[2].startsWith("http") && !match[2].startsWith("data:")) {
      daftarMatch.push({ atribut: match[1], srcAsli: match[2] });
    }
  }

  const hasilProses = await Promise.all(
    daftarMatch.map(async ({ atribut, srcAsli }) => {
      const pathGambar = gabungPath(folderBab, srcAsli);
      const fileGambar = zip.file(pathGambar);
      if (!fileGambar) return null;
      try {
        const base64 = await fileGambar.async("base64");
        const mime = tebakMimeType(pathGambar);
        return { asli: `${atribut}="${srcAsli}"`, baru: `${atribut}="data:${mime};base64,${base64}"` };
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

type InfoOpf = {
  opfContent: string;
  opfFolder: string;
  manifestMap: Record<string, string>;
  manifestProperties: Record<string, string>;
  zip: JSZip;
};

async function bacaOpf(fileUri: string): Promise<InfoOpf> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  const zip = await JSZip.loadAsync(base64, { base64: true });

  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) throw new Error("container.xml tidak ditemukan");

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) throw new Error("Lokasi file .opf tidak ditemukan");
  const opfPath = opfPathMatch[1];
  const opfFolder = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";

  const opfContent = await zip.file(opfPath)?.async("text");
  if (!opfContent) throw new Error("File .opf gagal dibaca");

  const manifestMap: Record<string, string> = {};
  const manifestProperties: Record<string, string> = {};
  const itemRegex = /<item\s+([^>]*)\/?>/g;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const atribut = match[1];
    const idMatch = atribut.match(/id="([^"]+)"/);
    const hrefMatch = atribut.match(/href="([^"]+)"/);
    const propMatch = atribut.match(/properties="([^"]+)"/);
    if (idMatch && hrefMatch) {
      manifestMap[idMatch[1]] = hrefMatch[1];
      if (propMatch) manifestProperties[idMatch[1]] = propMatch[1];
    }
  }

  return { opfContent, opfFolder, manifestMap, manifestProperties, zip };
}

export async function bukaEpub(fileUri: string): Promise<BabEpub[]> {
  const { opfContent, opfFolder, manifestMap, zip } = await bacaOpf(fileUri);

  const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"/g;
  const urutanId: string[] = [];
  let match;
  while ((match = spineRegex.exec(opfContent)) !== null) urutanId.push(match[1]);

  const babList: BabEpub[] = [];
  for (const id of urutanId) {
    const href = manifestMap[id];
    if (!href) continue;
    const fullPath = opfFolder + href;
    const babFile = zip.file(fullPath);
    if (!babFile) continue;
    const folderBab = fullPath.includes("/") ? fullPath.substring(0, fullPath.lastIndexOf("/") + 1) : "";
    let html = await babFile.async("text");
    html = await tanamGambar(html, folderBab, zip);
    babList.push({ judul: href, html });
  }

  return babList;
}

// Cari gambar sampul (cover), kembalikan sebagai data URI base64, atau null kalau tidak ada
export async function ambilCoverEpub(fileUri: string): Promise<string | null> {
  try {
    const { opfContent, opfFolder, manifestMap, manifestProperties, zip } = await bacaOpf(fileUri);

    let idCover: string | null = null;
    for (const id in manifestProperties) {
      if (manifestProperties[id].includes("cover-image")) {
        idCover = id;
        break;
      }
    }
    if (!idCover) {
      const metaMatch = opfContent.match(/<meta\s+name="cover"\s+content="([^"]+)"/);
      if (metaMatch) idCover = metaMatch[1];
    }
    if (!idCover) {
      idCover = Object.keys(manifestMap).find((id) => id.toLowerCase().includes("cover")) || null;
    }

    let hrefCover = idCover ? manifestMap[idCover] : null;
    if (!hrefCover) {
      const imgItemMatch = opfContent.match(/<item\s+[^>]*media-type="image\/[^"]+"[^>]*href="([^"]+)"/);
      if (imgItemMatch) hrefCover = imgItemMatch[1];
    }
    if (!hrefCover) return null;

    const fullPath = opfFolder + hrefCover;
    const fileGambar = zip.file(fullPath);
    if (!fileGambar) return null;

    const base64 = await fileGambar.async("base64");
    return `data:${tebakMimeType(fullPath)};base64,${base64}`;
  } catch (err) {
    console.log("Gagal mengambil cover EPUB:", err);
    return null;
  }
}