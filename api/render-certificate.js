import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');

const WIDTH = 1600;
const HEIGHT = 1130;
const BLACK = '#111111';
const GOLD = '#C8A46B';
const OFF_WHITE = '#F8F6F2';

// ── Font loading from disk ────────────────────────────────────────────────────
function loadFontDataUri(fileName) {
  const path = join(FONTS_DIR, fileName);
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  return `data:font/truetype;base64,${buf.toString('base64')}`;
}

function buildFontFaces() {
  const rules = [];

  const playfairWeights = [
    { weight: '400', file: 'playfair-400.ttf' },
    { weight: '500', file: 'playfair-500.ttf' },
    { weight: '700', file: 'playfair-700.ttf' },
  ];
  const latoWeights = [
    { weight: '300', file: 'lato-300.ttf' },
    { weight: '400', file: 'lato-400.ttf' },
    { weight: '700', file: 'lato-700.ttf' },
  ];

  for (const { weight, file } of playfairWeights) {
    const uri = loadFontDataUri(file);
    if (uri) {
      rules.push(`@font-face { font-family: 'Playfair Display'; src: url(${uri}) format('truetype'); font-weight: ${weight}; font-style: normal; }`);
    }
  }
  for (const { weight, file } of latoWeights) {
    const uri = loadFontDataUri(file);
    if (uri) {
      rules.push(`@font-face { font-family: 'Lato'; src: url(${uri}) format('truetype'); font-weight: ${weight}; font-style: normal; }`);
    }
  }

  return rules.join('\n    ');
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

function splitText(value, maxLineLength, maxLines = 3) {
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
  const n = String(name || '').trim() || 'Aluno';
  if (n.length <= 22) return { text: n, fontSize: 120 };
  if (n.length <= 30) return { text: n, fontSize: 100 };
  if (n.length <= 40) return { text: n, fontSize: 84 };
  if (n.length <= 52) return { text: n, fontSize: 70 };
  return { text: `${n.slice(0, 52).trim()}...`, fontSize: 62 };
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
      return { dataUri: `data:image/svg+xml;base64,${buf.toString('base64')}` };
    }
    const png = await sharp(buf).png().toBuffer();
    return { dataUri: `data:image/png;base64,${png.toString('base64')}` };
  } catch {
    return null;
  }
}

// ── SVG builder ───────────────────────────────────────────────────────────────
async function buildCertificateSvg(values) {
  const recipient = fitRecipientName(values.userName);
  const courseTitle = String(values.courseName || 'Curso').trim();
  const workload = String(values.workload || '').trim();
  const city = String(values.city || 'Dourados - MS').trim();
  const completionDate = String(values.completionDate || '').trim();
  const validationCode = String(
    values.validationCode || createValidationCode(values.userName, values.courseName, values.completedAt)
  );

  const statement = `por ter concluido com exito o curso ${courseTitle}, com carga horaria total de ${workload}, realizado em ${completionDate}, na cidade de ${city}.`;
  const bodyLines = splitText(statement, 90, 3);

  const [logoAsset, signatureAsset] = await Promise.all([
    fetchAsset(values.logoUrl),
    fetchAsset(values.signatureUrl),
  ]);

  const fontFaces = buildFontFaces();
  const SERIF = "Playfair Display, Georgia, 'Times New Roman', serif";
  const SANS = "Lato, Arial, Helvetica, sans-serif";

  const bodyY0 = 742;
  const bodyLineH = 44;
  const nameY = recipient.fontSize <= 84 ? 624 : 612;

  const logoSvg = logoAsset
    ? `<image href="${logoAsset.dataUri}" x="680" y="148" width="240" height="96" preserveAspectRatio="xMidYMid meet" opacity="0.95" />`
    : `<text x="800" y="232" text-anchor="middle" font-family="${SERIF}" font-size="64" font-weight="700" letter-spacing="14" fill="${BLACK}">ARQO</text>`;

  const signatureSvg = signatureAsset
    ? `<image href="${signatureAsset.dataUri}" x="1100" y="804" width="320" height="130" preserveAspectRatio="xMidYMid meet" opacity="0.92" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>
    ${fontFaces}
    </style>
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

  <!-- Borders -->
  <rect x="52" y="52" width="1496" height="1026" fill="none" stroke="${GOLD}" stroke-width="1.6" />
  <rect x="74" y="74" width="1452" height="982" fill="none" stroke="${GOLD}" stroke-opacity="0.30" stroke-width="1" />

  <!-- Corner ornaments -->
  <path d="M90 210 V90 H210"    fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M1510 210 V90 H1390" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M90 918 V1040 H210"  fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />
  <path d="M1510 918 V1040 H1390" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.8" />

  <!-- Rules around logo -->
  <rect x="440" y="130" width="720" height="1" fill="url(#hGold)" />
  <rect x="440" y="270" width="720" height="1" fill="url(#hGold)" />

  <!-- Logo -->
  ${logoSvg}

  <!-- Title -->
  <text x="800" y="380" text-anchor="middle"
    font-family="${SERIF}" font-size="112" font-weight="400"
    fill="${BLACK}" letter-spacing="2">Certificado</text>

  <!-- Intro -->
  <text x="800" y="454" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="300"
    fill="rgba(17,17,17,0.62)" letter-spacing="0.5">O Founder e CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,</text>
  <text x="800" y="490" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="300"
    fill="rgba(17,17,17,0.62)" letter-spacing="0.5">confere o presente certificado a</text>

  <!-- Recipient name -->
  <text x="800" y="${nameY}" text-anchor="middle"
    font-family="${SERIF}" font-size="${recipient.fontSize}" font-weight="500"
    fill="${BLACK}">${escapeXml(recipient.text)}</text>

  <!-- Rule under name -->
  <rect x="360" y="662" width="880" height="1.5" fill="url(#hGold)" />

  <!-- Body statement -->
  ${bodyLines.map((line, i) => `<text x="800" y="${bodyY0 + i * bodyLineH}" text-anchor="middle"
    font-family="${SANS}" font-size="24" font-weight="300"
    fill="rgba(17,17,17,0.70)" letter-spacing="0.3">${escapeXml(line)}</text>`).join('\n  ')}

  <!-- Signature -->
  ${signatureSvg}

  <!-- Footer -->
  <text x="355" y="893" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="400"
    fill="${BLACK}">${escapeXml(completionDate)}</text>
  <line x1="200" y1="912" x2="510" y2="912" stroke="${GOLD}" stroke-width="1.2" />
  <text x="355" y="940" text-anchor="middle"
    font-family="${SANS}" font-size="17" font-weight="300"
    fill="rgba(17,17,17,0.58)" letter-spacing="1">Data</text>

  <line x1="600" y1="912" x2="1000" y2="912" stroke="rgba(17,17,17,0.25)" stroke-width="1" />
  <text x="800" y="940" text-anchor="middle"
    font-family="${SANS}" font-size="17" font-weight="300"
    fill="rgba(17,17,17,0.58)" letter-spacing="1">Assinatura do aluno</text>

  <line x1="1090" y1="912" x2="1490" y2="912" stroke="rgba(17,17,17,0.25)" stroke-width="1" />
  <text x="1290" y="940" text-anchor="middle"
    font-family="${SANS}" font-size="17" font-weight="300"
    fill="rgba(17,17,17,0.58)" letter-spacing="1">Gilson Nogueira - CEO &amp; Founder</text>

  <!-- Validation -->
  <text x="800" y="1022" text-anchor="middle"
    font-family="${SANS}" font-size="13" font-weight="300"
    fill="rgba(17,17,17,0.38)" letter-spacing="1">Codigo de validacao: ${escapeXml(validationCode)}</text>
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
