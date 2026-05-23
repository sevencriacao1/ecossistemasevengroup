import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');

const WIDTH = 1754;
const HEIGHT = 1240;
const BLACK = '#1a1a1a';
const GOLD = '#B8913F';
const GOLD_LIGHT = '#D4A853';
const BG_TOP = '#FDFBF7';
const BG_BOT = '#F4F0E8';

// ── Font loading ───────────────────────────────────────────────────────────────
function buildSatoriFonts() {
  const entries = [
    { name: 'Playfair Display', weight: 400, file: 'playfair-400.ttf' },
    { name: 'Playfair Display', weight: 500, file: 'playfair-500.ttf' },
    { name: 'Playfair Display', weight: 700, file: 'playfair-700.ttf' },
    { name: 'Space Grotesk',    weight: 300, file: 'space-grotesk-300.ttf' },
    { name: 'Space Grotesk',    weight: 400, file: 'space-grotesk-400.ttf' },
    { name: 'Space Grotesk',    weight: 500, file: 'space-grotesk-500.ttf' },
    { name: 'Space Grotesk',    weight: 600, file: 'space-grotesk-600.ttf' },
    { name: 'Space Grotesk',    weight: 700, file: 'space-grotesk-700.ttf' },
  ];
  console.log('[cert] FONTS_DIR:', FONTS_DIR, '| exists:', existsSync(FONTS_DIR));
  const fonts = entries
    .map(({ name, weight, file }) => {
      const p = join(FONTS_DIR, file);
      const found = existsSync(p);
      console.log('[cert] font', file, found ? 'OK' : 'MISSING');
      if (!found) return null;
      const data = readFileSync(p);
      const sig = data.slice(0, 4).toString('hex');
      console.log('[cert] font', file, 'sig:', sig, 'size:', data.length);
      return { name, weight, style: 'normal', data };
    })
    .filter(Boolean);
  console.log('[cert] fonts loaded:', fonts.length);
  return fonts;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function createValidationCode(userName, courseName, completedAt) {
  const source = `${userName}-${courseName}-${completedAt}`;
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  return `ARQO-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)}`;
}

function splitText(value, maxCharsPerLine, maxLines = 3) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  for (const word of words) {
    const lastIdx = lines.length - 1;
    const current = lines[lastIdx] || '';
    const next = current ? `${current} ${word}` : word;
    if (!current || next.length <= maxCharsPerLine) {
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
      return `data:image/svg+xml;base64,${buf.toString('base64')}`;
    }
    const png = await sharp(buf).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

// ── Layout helpers ─────────────────────────────────────────────────────────────
const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.flat().filter(c => c != null && c !== false) },
});

// Satori requires display on all elements
const abs = (style, ...children) =>
  h('div', { style: { position: 'absolute', display: 'flex', ...style } }, ...children);

const hGold = (top, left, width) =>
  abs({
    top, left, width, height: 2,
    background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
  });

// ── Build satori element tree ──────────────────────────────────────────────────
async function buildCertificateElement(values) {
  const recipient = fitRecipientName(values.userName);
  const courseTitle = String(values.courseName || 'Curso').trim();
  const workload = String(values.workload || '').trim();
  const city = String(values.city || 'Dourados - MS').trim();
  const completionDate = String(values.completionDate || '').trim();
  const validationCode = String(
    values.validationCode || createValidationCode(values.userName, values.courseName, values.completedAt)
  );

  const statement = `por ter concluido com exito o curso ${courseTitle}, com carga horaria total de ${workload}, realizado em ${completionDate}, na cidade de ${city}.`;
  const bodyLines = splitText(statement, 82, 3);

  const [logoUri, signatureUri] = await Promise.all([
    fetchAsset(values.logoUrl),
    fetchAsset(values.signatureUrl),
  ]);

  const CX = WIDTH / 2;

  // Vertical positions
  const nameTop = recipient.fontSize <= 68 ? 490 : 476;

  return h(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        position: 'relative',
        background: `linear-gradient(to bottom, ${BG_TOP}, ${BG_BOT})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
    },

    // ── Borders ──────────────────────────────────────────────────────────────
    abs({ top: 44, left: 44, right: 44, bottom: 44, border: `2px solid ${GOLD}` }),
    abs({ top: 62, left: 62, right: 62, bottom: 62, border: `1px solid rgba(184,145,63,0.27)` }),

    // ── Corner ornaments ──────────────────────────────────────────────────────
    abs({ top: 80, left: 80, width: 140, height: 140, borderTop: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}` }),
    abs({ top: 80, right: 80, width: 140, height: 140, borderTop: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}` }),
    abs({ bottom: 80, left: 80, width: 140, height: 140, borderBottom: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}` }),
    abs({ bottom: 80, right: 80, width: 140, height: 140, borderBottom: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}` }),

    // ── Rules around logo ──────────────────────────────────────────────────────
    hGold(88, 480, 794),
    hGold(230, 480, 794),

    // ── Logo ──────────────────────────────────────────────────────────────────
    logoUri
      ? abs(
          { top: 104, left: CX - 120, width: 240, height: 100, alignItems: 'center', justifyContent: 'center' },
          h('img', { src: logoUri, width: 240, height: 100, style: { objectFit: 'contain' } })
        )
      : abs(
          { top: 140, left: 0, right: 0, justifyContent: 'center' },
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 72, fontWeight: 700, letterSpacing: 16, color: BLACK } }, 'ARQO')
        ),

    // ── "Certificado" title ────────────────────────────────────────────────────
    abs(
      { top: 268, left: 0, right: 0, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Playfair Display', fontSize: 88, fontWeight: 400, color: BLACK, letterSpacing: 6 } }, 'Certificado')
    ),

    // Gold underline for title
    abs({ top: 360, left: CX - 180, width: 360, height: 2, background: `linear-gradient(to right, transparent, ${GOLD_LIGHT}, transparent)` }),

    // ── Intro text ─────────────────────────────────────────────────────────────
    abs(
      { top: 394, left: 0, right: 0, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 21, fontWeight: 300, color: 'rgba(26,26,26,0.60)' } },
        'O Founder e CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,')
    ),
    abs(
      { top: 430, left: 0, right: 0, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 21, fontWeight: 300, color: 'rgba(26,26,26,0.60)' } },
        'confere o presente certificado a')
    ),

    // Small gold divider
    abs({ top: 458, left: CX - 36, width: 72, height: 1, background: GOLD, opacity: 0.7 }),

    // ── Recipient name ─────────────────────────────────────────────────────────
    abs(
      { top: nameTop, left: 0, right: 0, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Playfair Display', fontSize: recipient.fontSize, fontWeight: 500, color: BLACK } },
        recipient.text)
    ),

    // Rule under name
    hGold(630, 420, WIDTH - 840),

    // ── Body statement ─────────────────────────────────────────────────────────
    ...bodyLines.map((line, i) =>
      abs(
        { top: 688 + i * 50, left: 0, right: 0, justifyContent: 'center' },
        h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 300, color: 'rgba(26,26,26,0.68)' } }, line)
      )
    ),

    // ── Signature image ────────────────────────────────────────────────────────
    signatureUri
      ? abs(
          { top: 820, left: 1190, width: 330, height: 130, alignItems: 'center', justifyContent: 'center' },
          h('img', { src: signatureUri, width: 330, height: 130, style: { objectFit: 'contain' } })
        )
      : null,

    // ── Footer separator ───────────────────────────────────────────────────────
    abs({ top: 920, left: 120, width: WIDTH - 240, height: 1, background: `linear-gradient(to right, transparent, rgba(212,168,83,0.53), transparent)` }),

    // Date column
    abs({ top: 950, left: 160, width: 340, flexDirection: 'column', alignItems: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 400, color: BLACK } }, completionDate),
      abs({ top: 32, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }),
      abs({ top: 48, left: 0, right: 0, justifyContent: 'center' },
        h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 300, color: 'rgba(26,26,26,0.50)', letterSpacing: 2 } }, 'DATA')
      )
    ),

    // Student signature line
    abs({ top: 982, left: 620, width: 450, height: 1, background: 'rgba(26,26,26,0.22)' }),
    abs(
      { top: 998, left: 620, width: 450, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 300, color: 'rgba(26,26,26,0.50)', letterSpacing: 2 } }, 'ASSINATURA DO ALUNO')
    ),

    // CEO signature line
    abs({ top: 982, left: 1140, width: 454, height: 1, background: 'rgba(26,26,26,0.22)' }),
    abs(
      { top: 998, left: 1140, width: 454, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 300, color: 'rgba(26,26,26,0.50)', letterSpacing: 2 } }, 'GILSON NOGUEIRA - CEO & FOUNDER')
    ),

    // ── Validation code ────────────────────────────────────────────────────────
    abs(
      { bottom: 60, left: 0, right: 0, justifyContent: 'center' },
      h('span', { style: { fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 300, color: 'rgba(26,26,26,0.35)', letterSpacing: 2 } },
        `CODIGO DE VALIDACAO: ${validationCode}`)
    ),
  );
}

// ── PNG renderer ──────────────────────────────────────────────────────────────
async function renderCertificatePng(values) {
  const fonts = buildSatoriFonts();
  if (fonts.length === 0) {
    throw new Error(`No fonts loaded from ${FONTS_DIR}`);
  }

  const element = await buildCertificateElement(values);
  console.log('[cert] calling satori with', fonts.length, 'fonts');

  const svg = await satori(element, { width: WIDTH, height: HEIGHT, fonts });
  console.log('[cert] satori SVG length:', svg.length);

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  console.log('[cert] PNG size:', png.length);
  return png;
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
