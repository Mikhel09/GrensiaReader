import { useRef } from "react";
import { WebView } from "react-native-webview";

export function ReaderWebView({ html, resetKey }: { html: string; resetKey: string | number }) {
  return <ReaderWebViewInner key={resetKey} html={html} />;
}

function ReaderWebViewInner({ html }: { html: string }) {
  const scrollYRef = useRef(0);

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
    />
  );
}