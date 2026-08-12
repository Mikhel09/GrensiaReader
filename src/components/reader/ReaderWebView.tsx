import { useRef } from "react";
import { WebView } from "react-native-webview";

export function ReaderWebView({
  html,
  resetKey,
  onTekanLinkInternal,
}: {
  html: string;
  resetKey: string | number;
  onTekanLinkInternal?: (url: string) => boolean;
}) {
  return <ReaderWebViewInner key={resetKey} html={html} onTekanLinkInternal={onTekanLinkInternal} />;
}

function ReaderWebViewInner({
  html,
  onTekanLinkInternal,
}: {
  html: string;
  onTekanLinkInternal?: (url: string) => boolean;
}) {
  const scrollYRef = useRef(0);
  const sudahMuatRef = useRef(false);

  const injectedJs = `
    (function() {
      window.scrollTo(0, ${scrollYRef.current});
      var timer = null;
      window.addEventListener('scroll', function() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(String(window.scrollY));
          }
        }, 100);
      });
    })();
    true;
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      injectedJavaScript={injectedJs}
      onMessage={(e) => {
        const y = Number(e.nativeEvent.data);
        if (!Number.isNaN(y)) scrollYRef.current = y;
      }}
      onShouldStartLoadWithRequest={(request) => {
        // Load pertama kali (konten HTML itu sendiri) selalu diizinkan
        if (!sudahMuatRef.current) {
          sudahMuatRef.current = true;
          return true;
        }
        // Setelah itu, ini pasti karena user menekan sebuah link -> jangan biarkan WebView
        // "pindah halaman" sungguhan (karena alamatnya tidak nyata dan bikin layar putih).
        if (onTekanLinkInternal) {
          const berhasilDitangani = onTekanLinkInternal(request.url);
          if (berhasilDitangani) return false;
        }
        return false;
      }}
    />
  );
}