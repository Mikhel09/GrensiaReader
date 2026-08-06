import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";

export async function bukaDocx(fileUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64, { base64: true });

  const documentXml = await zip.file("word/document.xml")?.async("text");
  if (!documentXml) throw new Error("word/document.xml tidak ditemukan");

  // Pisahkan per paragraf (<w:p>...</w:p>)
  const paragrafRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  const paragrafList = documentXml.match(paragrafRegex) || [];

  const teksParagraf: string[] = [];

  for (const paragraf of paragrafList) {
    // Ambil semua teks di dalam <w:t>...</w:t> pada paragraf ini
    const teksRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let teksGabungan = "";
    let match;
    while ((match = teksRegex.exec(paragraf)) !== null) {
      teksGabungan += match[1];
    }
    teksParagraf.push(teksGabungan);
  }

  // Gabungkan jadi HTML sederhana, tiap paragraf jadi elemen <p>
  const html = teksParagraf
    .map((p) => `<p>${p || "&nbsp;"}</p>`)
    .join("");

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; padding: 16px; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;
}