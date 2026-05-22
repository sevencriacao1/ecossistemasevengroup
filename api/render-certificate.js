import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const WIDTH = 1600;
const HEIGHT = 1130;
const BLACK = '#111111';
const GOLD = '#C8A46B';
const OFF_WHITE = '#F8F6F2';

// ── Font loading ──────────────────────────────────────────────────────────────
const fontCache = new Map();

async function fetchFontBase64(family, weights = ['400'], italic = false) {
  const key = `${family}:${weights.join(',')}:${italic}`;
  if (fontCache.has(key)) return fontCache.get(key);

  try {
    const style = italic ? 'ital,wght@1,' : 'wght@';
    const weightStr = weights.join(';');
    const apiUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${style}${weightStr}`;

    // Old UA forces Google to return TTF (librsvg compatible), not WOFF2
    const cssRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322)' },
    });

    if (!cssRes.ok) return null;
    const css = await cssRes.text();

    // Collect all src URLs and their weights
    const rules = [...css.matchAll(/font-weight:\s*(\d+)[\s\S]*?src:\s*url\(([^)]+)\)/g)];
    if (!rules.length) return null;

    const entries = await Promise.all(
      rules.map(async ([, weight, url]) => {
        const fontRes = await fetch(url);
        if (!fontRes.ok) return null;
        const buf = Buffer.from(await fontRes.arrayBuffer());
        const ext = url.includes('.ttf') ? 'font/ttf' : 'font/truetype';
        return { weight, dataUri: `data:${ext};base64,${buf.toString('base64')}` };
      })
    );

    const result = entries.filter(Boolean);
    if (!result.length) return null;
    fontCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

function buildFontFaceBlock(familyName, entries = []) {
  return entries
    .map(
      ({ weight, dataUri }) => `
    @font-face {
      font-family: '${familyName}';
      src: url(${dataUri}) format('truetype');
      font-weight: ${weight};
      font-style: normal;
    }`
    )
    .join('\n');
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createValidationCode(userName, courseName, completedAt) {
  const source = `${userName}-${courseName}-${completedAt}`;
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  return `ARQO-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)}`;
}

function splitText(value, maxLineLength, maxLines = 2) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  for (const word of words) {
    const current = lines[lines.length - 1] || '';
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength || lines.length === 0) {
      lines[lines.length - 1] = next;
    } else if (lines.length < maxLines) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
    }
  }
  return lines.length ? lines.slice(0, maxLines) : [''];
}

function fitRecipientName(name) {
  const normalized = String(name || '').trim() || 'Aluno';
  if (normalized.length <= 22) return { text: normalized, fontSize: 120 };
  if (normalized.length <= 30) return { text: normalized, fontSize: 100 };
  if (normalized.length <= 40) return { text: normalized, fontSize: 84 };
  if (normalized.length <= 52) return { text: normalized, fontSize: 70 };
  return { text: `${normalized.slice(0, 52).trim()}...`, fontSize: 62 };
}

function mimeFromContentType(ct = '') {
  return ct.split(';')[0].trim().toLowerCase();
}

async function fetchAsset(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = mimeFromContentType(res.headers.get('content-type') || '');
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
      return { dataUri: `data:image/svg+xml;base64,${buf.toString('base64')}`, type: 'svg' };
    }
    const png = await sharp(buf).png().toBuffer();
    return { dataUri: `data:image/png;base64,${png.toString('base64')}`, type: 'image' };
  } catch {
    return null;
  }
}

// ── SVG parts ─────────────────────────────────────────────────────────────────
function renderLogo(asset) {
  if (!asset) {
    return `<text x="800" y="232" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
      font-size="64" font-weight="700" letter-spacing="14" fill="${BLACK}">ARQO</text>`;
  }
  return `<image href="${asset.dataUri}" x="680" y="148" width="240" height="96"
    preserveAspectRatio="xMidYMid meet" opacity="0.95" />`;
}

function renderSignature(asset) {
  if (!asset) return '';
  return `<image href="${asset.dataUri}" x="1100" y="804" width="320" height="130"
    preserveAspectRatio="xMidYMid meet" opacity="0.92" />`;
}

function textLine(x, y, content, { fontSize, fontFamily, fontWeight = '400', fill, anchor = 'middle', letterSpacing = '0' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fontFamily}" font-size="${fontSize}"
    font-weight="${fontWeight}" fill="${fill}" letter-spacing="${letterSpacing}">${escapeXml(content)}</text>`;
}

// ── Main builder ──────────────────────────────────────────────────────────────
async function buildCertificateSvg(values) {
  const recipient = fitRecipientName(values.userName);
  const courseTitle = String(values.courseName || 'Curso').trim();
  const workload = String(values.workload || '').trim();
  const city = String(values.city || 'Dourados - MS').trim();
  const completionDate = String(values.completionDate || '').trim();
  const validationCode = String(
    values.validationCode || createValidationCode(values.userName, values.courseName, values.completedAt)
  );

  const bodyStatement = `por ter concluido com exito o curso ${courseTitle}, com carga horaria total de ${workload}, realizado em ${completionDate}, na cidade de ${city}.`;
  const courseLines = splitText(bodyStatement, 90, 3);

  const [logoAsset, signatureAsset, playfairEntries, latoEntries] = await Promise.all([
    fetchAsset(values.logoUrl),
    fetchAsset(values.signatureUrl),
    fetchFontBase64('Playfair Display', ['400', '500', '700']),
    fetchFontBase64('Lato', ['300', '400', '700']),
  ]);

  const fontStyles = [
    playfairEntries ? buildFontFaceBlock('Playfair Display', playfairEntries) : '',
    latoEntries ? buildFontFaceBlock('Lato', latoEntries) : '',
  ].join('\n');

  const SERIF = "Playfair Display, Georgia, 'Times New Roman', serif";
  const SANS = "Lato, Arial, Helvetica, sans-serif";

  // Body text rows Y positions
  const bodyY0 = 738;
  const bodyLineH = 42;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>${fontStyles}</style>
    <pattern id="grain" patternUnits="userSpaceOnUse" width="44" height="44" patternTransform="rotate(45)">
      <rect width="11" height="44" fill="rgba(200,164,107,0.016)" />
    </pattern>
    <linearGradient id="hGold" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="0" />
      <stop offset="50%"  stop-color="${GOLD}" stop-opacity="1" />
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="hGoldSoft" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="0" />
      <stop offset="50%"  stop-color="${GOLD}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${OFF_WHITE}" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grain)" opacity="0.6" />

  <!-- Outer border -->
  <rect x="52" y="52" width="1496" height="1026" fill="none" stroke="${GOLD}" stroke-width="1.6" />
  <!-- Inner border -->
  <rect x="74" y="74" width="1452" height="982" fill="none" stroke="${GOLD}" stroke-opacity="0.30" stroke-width="1" />

  <!-- Corner ornaments -->
  <path d="M90 210 V90 H210"  fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M1510 210 V90 H1390" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M90 918 V1040 H210" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M1510 918 V1040 H1390" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />

  <!-- Top rule under logo -->
  <rect x="440" y="130" width="720" height="1" fill="url(#hGold)" />

  <!-- Logo -->
  ${renderLogo(logoAsset)}

  <!-- Section divider after logo -->
  <rect x="440" y="270" width="720" height="1" fill="url(#hGold)" />

  <!-- "Certificado" title -->
  <text x="800" y="380" text-anchor="middle"
    font-family="${SERIF}" font-size="112" font-weight="400"
    fill="${BLACK}" letter-spacing="2">Certificado</text>

  <!-- Intro text -->
  <text x="800" y="454" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="300"
    fill="rgba(17,17,17,0.62)" letter-spacing="0.5">
    O Founder e CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,
  </text>
  <text x="800" y="488" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="300"
    fill="rgba(17,17,17,0.62)" letter-spacing="0.5">
    confere o presente certificado a
  </text>

  <!-- Recipient name -->
  <text x="800" y="${recipient.fontSize <= 84 ? 622 : 610}" text-anchor="middle"
    font-family="${SERIF}" font-size="${recipient.fontSize}" font-weight="500"
    fill="${BLACK}">${escapeXml(recipient.text)}</text>

  <!-- Gold rule under name -->
  <rect x="360" y="660" width="880" height="1.5" fill="url(#hGold)" />

  <!-- Body statement -->
  ${courseLines.map((line, i) => `
  <text x="800" y="${bodyY0 + i * bodyLineH}" text-anchor="middle"
    font-family="${SANS}" font-size="24" font-weight="300"
    fill="rgba(17,17,17,0.70)" letter-spacing="0.3">${escapeXml(line)}</text>`).join('')}

  <!-- Signature image -->
  ${renderSignature(signatureAsset)}

  <!-- Footer section -->
  <g font-family="${SANS}" text-anchor="middle">
    <!-- Date column -->
    <text x="355" y="893" font-size="22" font-weight="400" fill="${BLACK}">${escapeXml(completionDate)}</text>
    <line x1="200" y1="912" x2="510" y2="912" stroke="${GOLD}" stroke-width="1.2" />
    <text x="355" y="940" font-size="17" font-weight="300" fill="rgba(17,17,17,0.58)" letter-spacing="1">Data</text>

    <!-- Student signature column -->
    <line x1="600" y1="912" x2="1000" y2="912" stroke="rgba(17,17,17,0.30)" stroke-width="1" />
    <text x="800" y="940" font-size="17" font-weight="300" fill="rgba(17,17,17,0.58)" letter-spacing="1">Assinatura do aluno</text>

    <!-- CEO column -->
    <line x1="1090" y1="912" x2="1490" y2="912" stroke="rgba(17,17,17,0.30)" stroke-width="1" />
    <text x="1290" y="940" font-size="17" font-weight="300" fill="rgba(17,17,17,0.58)" letter-spacing="1">Gilson Nogueira - CEO &amp; Founder</text>
  </g>

  <!-- Validation code -->
  <text x="800" y="1020" text-anchor="middle"
    font-family="${SANS}" font-size="13" font-weight="300"
    fill="rgba(17,17,17,0.38)" letter-spacing="1">
    Codigo de validacao: ${escapeXml(validationCode)}
  </text>
</svg>`;
}

// ── PNG renderer ──────────────────────────────────────────────────────────────
async function renderCertificatePng(values) {
  const svg = await buildCertificateSvg(values);
  return sharp(Buffer.from(svg)).png({ compressionLevel: 8 }).toBuffer();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function assertAuthenticated(request) {
  const headers = request.headers || {};
  const authorization =
    typeof headers.get === 'function'
      ? headers.get('authorization')
      : headers.authorization || headers.Authorization;

  if (!authorization) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey)
    throw Object.assign(new Error('Supabase env vars missing.'), { statusCode: 500 });

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).send('Method not allowed');
    return;
  }

  try {
    await assertAuthenticated(request);
    const png = await renderCertificatePng(request.body || {});
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(png);
  } catch (error) {
    const statusCode =
      typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 500;
    response
      .status(Number.isFinite(statusCode) ? statusCode : 500)
      .json({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' });
  }
}
