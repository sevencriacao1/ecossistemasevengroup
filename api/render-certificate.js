import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const WIDTH = 1600;
const HEIGHT = 1100;
const BLACK = '#111111';
const GOLD = '#C8A46B';
const OFF_WHITE = '#F8F6F2';

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
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
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

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  return lines.length ? lines : [''];
}

function fitRecipientName(name) {
  const normalized = String(name || '').trim() || 'Aluno';
  if (normalized.length <= 28) return { text: normalized, fontSize: 116 };
  if (normalized.length <= 38) return { text: normalized, fontSize: 98 };
  if (normalized.length <= 50) return { text: normalized, fontSize: 82 };
  return { text: `${normalized.slice(0, 58).trim()}...`, fontSize: 70 };
}

function mimeFromContentType(contentType = '') {
  return contentType.split(';')[0].trim().toLowerCase();
}

async function fetchAsset(url) {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = mimeFromContentType(response.headers.get('content-type') || '');
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) return null;

    if (contentType.includes('svg') || url.toLowerCase().endsWith('.svg')) {
      return {
        dataUri: `data:image/svg+xml;base64,${buffer.toString('base64')}`,
        type: 'svg',
      };
    }

    const png = await sharp(buffer).png().toBuffer();
    return {
      dataUri: `data:image/png;base64,${png.toString('base64')}`,
      type: 'image',
    };
  } catch {
    return null;
  }
}

function renderLogo(logoAsset) {
  if (!logoAsset) {
    return `
      <text x="800" y="222" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" letter-spacing="10" fill="${BLACK}">ARQO</text>
    `;
  }

  return `
    <image href="${logoAsset.dataUri}" x="693" y="154" width="214" height="86" preserveAspectRatio="xMidYMid meet" opacity="0.94" />
  `;
}

function renderSignature(signatureAsset) {
  if (!signatureAsset) return '';

  return `
    <image href="${signatureAsset.dataUri}" x="1124" y="789" width="300" height="126" preserveAspectRatio="xMidYMid meet" opacity="0.94" />
  `;
}

function renderMultilineText(lines, { x, y, lineHeight, fontSize, fill, fontWeight = 400, anchor = 'middle', family = 'Arial, Helvetica, sans-serif' }) {
  return lines
    .map((line, index) => `
      <text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-family="${family}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">
        ${escapeXml(line)}
      </text>
    `)
    .join('');
}

async function buildCertificateSvg(values) {
  const recipient = fitRecipientName(values.userName);
  const courseTitle = String(values.courseName || 'Curso').trim();
  const workload = String(values.workload || '').trim();
  const city = String(values.city || 'Dourados - MS').trim();
  const completionDate = String(values.completionDate || '').trim();
  const validationCode = String(values.validationCode || createValidationCode(values.userName, values.courseName, values.completedAt));
  const courseStatement = `por ter concluido com exito o curso ${courseTitle}, com carga horaria total de ${workload}, realizado em ${completionDate}, na cidade de ${city}.`;
  const courseLines = splitText(courseStatement, 88, 3);
  const [logoAsset, signatureAsset] = await Promise.all([
    fetchAsset(values.logoUrl),
    fetchAsset(values.signatureUrl),
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="goldPattern" patternUnits="userSpaceOnUse" width="44" height="44" patternTransform="rotate(45)">
      <rect width="11" height="44" fill="rgba(200,164,107,0.018)" />
    </pattern>
    <linearGradient id="topAccent" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0" />
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="1" />
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="bottomAccent" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0" />
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="0.72" />
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${OFF_WHITE}" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#goldPattern)" opacity="0.55" />
  <rect x="56" y="56" width="1488" height="988" fill="none" stroke="${GOLD}" stroke-width="1.5" />
  <rect x="78" y="78" width="1444" height="944" fill="none" stroke="${GOLD}" stroke-opacity="0.28" stroke-width="1" />

  <path d="M92 204 V92 H204" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.82" />
  <path d="M1396 92 H1508 V204" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.82" />
  <path d="M92 896 V1008 H204" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.82" />
  <path d="M1396 1008 H1508 V896" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.82" />

  <rect x="448" y="134" width="704" height="1" fill="url(#topAccent)" />
  <rect x="494" y="922" width="612" height="1" fill="url(#bottomAccent)" />

  ${renderLogo(logoAsset)}

  <text x="800" y="354" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="108" font-weight="400" fill="${BLACK}">Certificado</text>

  ${renderMultilineText(['O Founder & CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,', 'confere o presente certificado a'], {
    x: 800,
    y: 448,
    lineHeight: 36,
    fontSize: 22,
    fill: 'rgba(17,17,17,0.72)',
  })}

  <text x="800" y="606" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${recipient.fontSize}" font-weight="500" fill="${BLACK}">
    ${escapeXml(recipient.text)}
  </text>
  <rect x="420" y="656" width="760" height="1" fill="${GOLD}" />

  ${renderMultilineText(courseLines, {
    x: 800,
    y: 720,
    lineHeight: 40,
    fontSize: 25,
    fill: 'rgba(17,17,17,0.74)',
  })}

  ${renderSignature(signatureAsset)}

  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <line x1="230" y1="900" x2="540" y2="900" stroke="${GOLD}" stroke-width="1" />
    <text x="385" y="879" font-size="20" fill="${BLACK}">${escapeXml(completionDate)}</text>
    <text x="385" y="930" font-size="18" fill="rgba(17,17,17,0.72)">Data</text>

    <line x1="645" y1="900" x2="955" y2="900" stroke="${BLACK}" stroke-width="1" />
    <text x="800" y="930" font-size="18" fill="rgba(17,17,17,0.72)">Assinatura do aluno</text>

    <line x1="1060" y1="900" x2="1370" y2="900" stroke="${BLACK}" stroke-width="1" />
    <text x="1215" y="930" font-size="18" fill="rgba(17,17,17,0.72)">Gilson Nogueira - CEO &amp; Founder</text>
  </g>

  <text x="800" y="1048" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="rgba(17,17,17,0.48)">
    Codigo de validacao: ${escapeXml(validationCode)}
  </text>
</svg>`;
}

async function renderCertificatePng(values) {
  const svg = await buildCertificateSvg(values);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function assertAuthenticated(request) {
  const headers = request.headers || {};
  const authorization = typeof headers.get === 'function'
    ? headers.get('authorization')
    : headers.authorization || headers.Authorization;

  if (!authorization) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw Object.assign(new Error('Supabase environment variables are missing.'), { statusCode: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
}

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
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : 500;
    response.status(Number.isFinite(statusCode) ? statusCode : 500).json({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' });
  }
}
