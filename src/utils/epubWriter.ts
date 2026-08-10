import { BabEpub } from "@/utils/epubReader";
import JSZip from "jszip";

function buatUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeXml(teks: string): string {
  return teks.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function bangunEpub(
  judulBuku: string,
  babAsli: BabEpub[],
  cacheTerjemahan: Record<number, string>
): Promise<string> {
  const zip = new JSZip();
  const uuid = buatUuid();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navPoints: string[] = [];

  babAsli.forEach((bab, i) => {
    const isi = cacheTerjemahan[i] || bab.html;
    const namaFileBab = `chapter${i + 1}.xhtml`;
    const isiFinal = /<html[\s>]/i.test(isi)
      ? isi
      : `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8" /><title>Bab ${i + 1}</title></head><body>${isi}</body></html>`;

    zip.file(`OEBPS/${namaFileBab}`, isiFinal);
    manifestItems.push(`<item id="chap${i + 1}" href="${namaFileBab}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="chap${i + 1}"/>`);
    navPoints.push(
      `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}"><navLabel><text>Bab ${i + 1}</text></navLabel><content src="${namaFileBab}"/></navPoint>`
    );
  });

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(judulBuku)}</dc:title>
    <dc:language>id</dc:language>
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`
  );

  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${uuid}"/></head>
  <docTitle><text>${escapeXml(judulBuku)}</text></docTitle>
  <navMap>
    ${navPoints.join("\n    ")}
  </navMap>
</ncx>`
  );

  return await zip.generateAsync({ type: "base64" });
}