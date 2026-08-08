import { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";

const templateHtml = (base64: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
  function kirimHasil(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }
  window.onerror = function(msg) {
    kirimHasil({ sukses: false, error: String(msg) });
  };
</script>
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
  onerror="kirimHasil({ sukses: false, error: 'Gagal memuat pdf.js, cek koneksi internet' })"
></script>
<script>
  async function mulai() {
    try {
      if (typeof pdfjsLib === 'undefined') {
        kirimHasil({ sukses: false, error: 'Library pdf.js tidak berhasil dimuat' });
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      var raw = atob("${base64}");
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

      var pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      var hasil = [];

      for (var i = 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var teks = '';
        var lastY = null;

        for (var j = 0; j < content.items.length; j++) {
          var it = content.items[j];
          if (!it || typeof it.str !== 'string') continue;
          var y = (it.transform && typeof it.transform[5] === 'number') ? it.transform[5] : null;

          if (teks.length > 0) {
            if (lastY !== null && y !== null) {
              var deltaY = Math.abs(lastY - y);
              if (deltaY > 18) {
                teks += String.fromCharCode(10) + String.fromCharCode(10);
              } else if (deltaY > 4) {
                teks += String.fromCharCode(10);
              } else {
                teks += ' ';
              }
            } else {
              teks += ' ';
            }
          }

          teks += it.str;
          if (y !== null) lastY = y;
        }

        hasil.push(teks);
      }

      kirimHasil({ sukses: true, data: hasil });
    } catch (e) {
      kirimHasil({ sukses: false, error: e && e.message ? e.message : String(e) });
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
  const selesaiRef = useRef(false);

  useEffect(() => {
    selesaiRef.current = false;
    const timer = setTimeout(() => {
      if (!selesaiRef.current) {
        selesaiRef.current = true;
        onError("Waktu ekstraksi habis. Periksa koneksi internet lalu coba lagi.");
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [base64]);

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: templateHtml(base64) }}
      style={{ width: 0, height: 0 }}
      onMessage={(e) => {
        if (selesaiRef.current) return;
        try {
          const data = JSON.parse(e.nativeEvent.data);
          selesaiRef.current = true;
          if (data.sukses) onSelesai(data.data);
          else onError(data.error || "Gagal mengekstrak teks PDF");
        } catch {
          selesaiRef.current = true;
          onError("Gagal membaca hasil ekstraksi PDF");
        }
      }}
    />
  );
}