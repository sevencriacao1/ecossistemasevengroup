import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');

const WIDTH = 1754;
const HEIGHT = 1240;
const BLACK = '#1a1a1a';
const GOLD = '#B8913F';
const GOLD_LIGHT = '#D4A853';
const OFF_WHITE = '#F9F7F3';

// ── Font loading ───────────────────────────────────────────────────────────────
function getFontFiles() {
  if (!existsSync(FONTS_DIR)) return [];
  return readdirSync(FONTS_DIR)
    .filter(f => /\.(ttf|otf)$/i.test(f))
    .map(f => join(FONTS_DIR, f));
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
    const lastIdx = lines.length - 1;
    const current = lines[lastIdx] || '';
    const next = current ? `${current} ${word}` : word;
    if (!current || next.length <= maxLineLength) {
      lines[lastIdx < 0 ? 0 : lastIdx] = next;
    } else if (lines.length < maxLines) {
      lines.push(word);
    } else {
      lines[lastIdx] = `${lines[lastIdx]} ${word}`;
    }
  }
  return lines.length ? lines.slice(0, maxLines) : [''];
}

function fitRecipientName(name) {
  const n = String(name || '').trim() || 'Aluno';
  if (n.length <= 20) return { text: n, fontSize: 96 };
  if (n.length <= 28) return { text: n, fontSize: 80 };
  if (n.length <= 36) return { text: n, fontSize: 68 };
  if (n.length <= 48) return { text: n, fontSize: 56 };
  return { text: `${n.slice(0, 48).trim()}...`, fontSize: 48 };
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
  const bodyLines = splitText(statement, 85, 3);

  const [logoAsset, signatureAsset] = await Promise.all([
    fetchAsset(values.logoUrl),
    fetchAsset(values.signatureUrl),
  ]);

  const SERIF = 'Playfair Display, Georgia, serif';
  const SANS = 'Space Grotesk, Arial, sans-serif';

  // Vertical layout
  const logoY = 100;
  const rule1Y = 88;
  const rule2Y = 230;
  const certTitleY = 340;
  const introY1 = 415;
  const introY2 = 455;
  const nameY = recipient.fontSize <= 68 ? 600 : 586;
  const nameRuleY = 640;
  const bodyY0 = 720;
  const bodyLineH = 48;
  const sigImgY = 820;
  const footerLineY = 980;
  const footerLabelY = 1010;
  const validationY = 1130;

  const CX = WIDTH / 2; // 877

  const logoSvg = logoAsset
    ? `<image href="${logoAsset.dataUri}" x="${CX - 120}" y="${logoY}" width="240" height="100" preserveAspectRatio="xMidYMid meet" opacity="0.95" />`
    : `<text x="${CX}" y="${logoY + 80}" text-anchor="middle" font-family="${SERIF}" font-size="72" font-weight="700" letter-spacing="16" fill="${BLACK}">ARQO</text>`;

  const signatureSvg = signatureAsset
    ? `<image href="${signatureAsset.dataUri}" x="1180" y="${sigImgY}" width="340" height="140" preserveAspectRatio="xMidYMid meet" opacity="0.90" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="hGold" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="0" />
      <stop offset="50%"  stop-color="${GOLD}" stop-opacity="1" />
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="hGoldSoft" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%"   stop-color="${GOLD_LIGHT}" stop-opacity="0" />
      <stop offset="50%"  stop-color="${GOLD_LIGHT}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${GOLD_LIGHT}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%"   stop-color="#FDFBF7" />
      <stop offset="100%" stop-color="#F4F0E8" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${GOLD}" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />

  <!-- Outer gold border -->
  <rect x="44" y="44" width="${WIDTH - 88}" height="${HEIGHT - 88}" fill="none" stroke="${GOLD}" stroke-width="2" />
  <!-- Inner soft border -->
  <rect x="62" y="62" width="${WIDTH - 124}" height="${HEIGHT - 124}" fill="none" stroke="${GOLD}" stroke-opacity="0.28" stroke-width="1" />

  <!-- Corner ornaments TL -->
  <path d="M80 220 V80 H220"  fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.85" />
  <!-- Corner ornaments TR -->
  <path d="M${WIDTH - 80} 220 V80 H${WIDTH - 220}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.85" />
  <!-- Corner ornaments BL -->
  <path d="M80 ${HEIGHT - 220} V${HEIGHT - 80} H220" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.85" />
  <!-- Corner ornaments BR -->
  <path d="M${WIDTH - 80} ${HEIGHT - 220} V${HEIGHT - 80} H${WIDTH - 220}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.85" />

  <!-- Corner dots -->
  <circle cx="120" cy="120" r="3" fill="${GOLD}" opacity="0.5" />
  <circle cx="${WIDTH - 120}" cy="120" r="3" fill="${GOLD}" opacity="0.5" />
  <circle cx="120" cy="${HEIGHT - 120}" r="3" fill="${GOLD}" opacity="0.5" />
  <circle cx="${WIDTH - 120}" cy="${HEIGHT - 120}" r="3" fill="${GOLD}" opacity="0.5" />

  <!-- Rules around logo area -->
  <rect x="480" y="${rule1Y}" width="794" height="1.2" fill="url(#hGold)" />
  <rect x="480" y="${rule2Y}" width="794" height="1.2" fill="url(#hGold)" />

  <!-- Logo -->
  ${logoSvg}

  <!-- "CERTIFICADO" title -->
  <text x="${CX}" y="${certTitleY}" text-anchor="middle"
    font-family="${SERIF}" font-size="88" font-weight="400"
    fill="${BLACK}" letter-spacing="6">Certificado</text>

  <!-- Gold underline for title -->
  <rect x="${CX - 180}" y="${certTitleY + 14}" width="360" height="2" fill="url(#hGoldSoft)" />

  <!-- Intro lines -->
  <text x="${CX}" y="${introY1}" text-anchor="middle"
    font-family="${SANS}" font-size="21" font-weight="300"
    fill="rgba(26,26,26,0.60)" letter-spacing="0.4">O Founder e CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,</text>
  <text x="${CX}" y="${introY2}" text-anchor="middle"
    font-family="${SANS}" font-size="21" font-weight="300"
    fill="rgba(26,26,26,0.60)" letter-spacing="0.4">confere o presente certificado a</text>

  <!-- Ornamental small divider -->
  <rect x="${CX - 40}" y="${introY2 + 20}" width="80" height="1" fill="${GOLD}" opacity="0.6" />

  <!-- Recipient name -->
  <text x="${CX}" y="${nameY}" text-anchor="middle"
    font-family="${SERIF}" font-size="${recipient.fontSize}" font-weight="500"
    fill="${BLACK}" letter-spacing="1">${escapeXml(recipient.text)}</text>

  <!-- Rule under name -->
  <rect x="420" y="${nameRuleY}" width="${CX * 2 - 840}" height="1.5" fill="url(#hGold)" />

  <!-- Body statement -->
  ${bodyLines.map((line, i) => `<text x="${CX}" y="${bodyY0 + i * bodyLineH}" text-anchor="middle"
    font-family="${SANS}" font-size="22" font-weight="300"
    fill="rgba(26,26,26,0.68)" letter-spacing="0.3">${escapeXml(line)}</text>`).join('\n  ')}

  <!-- Signature image -->
  ${signatureSvg}

  <!-- Footer horizontal rule (full width faded) -->
  <rect x="120" y="${footerLineY - 60}" width="${WIDTH - 240}" height="1" fill="url(#hGoldSoft)" />

  <!-- Date column -->
  <text x="330" y="${footerLineY - 20}" text-anchor="middle"
    font-family="${SANS}" font-size="20" font-weight="400"
    fill="${BLACK}">${escapeXml(completionDate)}</text>
  <line x1="160" y1="${footerLineY}" x2="500" y2="${footerLineY}" stroke="${GOLD}" stroke-width="1.2" />
  <text x="330" y="${footerLabelY}" text-anchor="middle"
    font-family="${SANS}" font-size="15" font-weight="300"
    fill="rgba(26,26,26,0.50)" letter-spacing="1.5">DATA</text>

  <!-- Student signature line -->
  <line x1="620" y1="${footerLineY}" x2="1070" y2="${footerLineY}" stroke="rgba(26,26,26,0.22)" stroke-width="1" />
  <text x="845" y="${footerLabelY}" text-anchor="middle"
    font-family="${SANS}" font-size="15" font-weight="300"
    fill="rgba(26,26,26,0.50)" letter-spacing="1.5">ASSINATURA DO ALUNO</text>

  <!-- CEO signature line -->
  <line x1="1140" y1="${footerLineY}" x2="1594" y2="${footerLineY}" stroke="rgba(26,26,26,0.22)" stroke-width="1" />
  <text x="1367" y="${footerLabelY}" text-anchor="middle"
    font-family="${SANS}" font-size="15" font-weight="300"
    fill="rgba(26,26,26,0.50)" letter-spacing="1.5">GILSON NOGUEIRA - CEO &amp; FOUNDER</text>

  <!-- Validation code -->
  <text x="${CX}" y="${validationY}" text-anchor="middle"
    font-family="${SANS}" font-size="12" font-weight="300"
    fill="rgba(26,26,26,0.35)" letter-spacing="1.5">CODIGO DE VALIDACAO: ${escapeXml(validationCode)}</text>
</svg>`;
}

// ── PNG renderer ──────────────────────────────────────────────────────────────
async function renderCertificatePng(values) {
  const svg = await buildCertificateSvg(values);
  const fontFiles = getFontFiles();

  console.log('[cert] font files loaded:', fontFiles.length);

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      loadSystemFonts: true,
      fontFiles,
      fontDirs: [FONTS_DIR],
    },
  });

  const rendered = resvg.render();
  return rendered.asPng();
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
