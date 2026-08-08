import { WebView } from "react-native-webview";

const templateHtml = (base64: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  async function mulai() {
    try {
      var raw = atob("${base64}");
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      var pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      var hasil = [];
      for (var i = 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var teks = content.items.map(function(it){ return it.str; }).join(' ');
        hasil.push(teks);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ sukses: true, data: hasil }));
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ sukses: false, error: String(e) }));
    }
  }
  mulai();
</script>
</body>
</html>
`;

export function EkstrakPdfTeks({
  base64,
  onSelesai,
  onError,
}: {
  base64: string;
  onSelesai: (teksPerHalaman: string[]) => void;
  onError: (pesan: string) => void;
}) {
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: templateHtml(base64) }}
      style={{ width: 0, height: 0 }}
      onMessage={(e) => {
        try {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.sukses) onSelesai(data.data);
          else onError(data.error || "Gagal mengekstrak teks PDF");
        } catch {
          onError("Gagal membaca hasil ekstraksi PDF");
        }
      }}
    />
  );
}