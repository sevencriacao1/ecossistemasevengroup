/**
 * Downloads TTF font files from Google Fonts gstatic CDN to api/fonts/.
 * Runs during Netlify build so the certificate function can read fonts from disk
 * instead of fetching at runtime (which is unreliable in Lambda environments).
 */
import { mkdir, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = join(ROOT, 'api', 'fonts');

const FONTS = [
  {
    family: 'Playfair Display',
    weights: ['400', '500', '700'],
    outName: 'playfair',
  },
  {
    family: 'Lato',
    weights: ['300', '400', '700'],
    outName: 'lato',
  },
];

// Old IE User-Agent forces Google Fonts to return TTF format (not WOFF2).
// librsvg (used by sharp) supports TTF/OTF but not WOFF2.
const OLD_UA = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322)';

async function fetchFontUrl(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const res = await fetch(url, { headers: { 'User-Agent': OLD_UA } });
  if (!res.ok) throw new Error(`Google Fonts CSS fetch failed: ${res.status} for ${family}:${weight}`);
  const css = await res.text();

  // With old UA, CSS is a single @font-face block per request
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error(`No font URL found in CSS for ${family}:${weight}`);
  return urlMatch[1];
}

async function fetchFontUrls(family, weights) {
  const results = await Promise.allSettled(
    weights.map(async (weight) => {
      const url = await fetchFontUrl(family, weight);
      return { weight, url };
    })
  );
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
}

async function downloadFont(url, outPath) {
  // Skip if already downloaded
  try {
    await access(outPath);
    console.log(`  already exists: ${outPath}`);
    return;
  } catch {
    // doesn't exist, proceed
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  console.log(`  saved ${buf.length} bytes → ${outPath}`);
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });
  console.log(`Font output dir: ${FONTS_DIR}`);

  for (const font of FONTS) {
    console.log(`\nFetching ${font.family} (${font.weights.join(', ')})...`);
    const entries = await fetchFontUrls(font.family, font.weights);

    if (!entries.length) {
      console.warn(`  WARNING: no font URLs found for ${font.family}`);
      continue;
    }

    for (const { weight, url } of entries) {
      const ext = url.endsWith('.otf') ? 'otf' : 'ttf';
      const outPath = join(FONTS_DIR, `${font.outName}-${weight}.${ext}`);
      await downloadFont(url, outPath);
    }
  }

  console.log('\nFont download complete.');
}

main().catch((err) => {
  console.error('Font download failed:', err);
  process.exit(1);
});
