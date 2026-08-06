export function bungkusHtml(
  htmlIsi: string,
  ukuranFont: number,
  modeGelap: boolean
): string {
  const warnaLatar = modeGelap ? "#1A1A1A" : "#FFFFFF";
  const warnaTeks = modeGelap ? "#E5E5E5" : "#1A1A1A";

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            background-color: ${warnaLatar};
            color: ${warnaTeks};
            font-size: ${ukuranFont}px;
            line-height: 1.6;
            padding: 16px;
            font-family: sans-serif;
          }
          img { max-width: 100%; height: auto; }
          a { color: ${modeGelap ? "#8AB4F8" : "#4A6FA5"}; }
        </style>
      </head>
      <body>${htmlIsi}</body>
    </html>
  `;
}