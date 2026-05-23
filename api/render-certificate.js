import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');

// A4 landscape in PDF points (72pt = 1 inch)
const W = 841.89;
const H = 595.28;
const CX = W / 2;

// Scale pixel values from the original 1754×1240px design
const S = W / 1754;
const p = (n) => n * S;

const BLACK = '#1a1a1a';
const GOLD = '#B8913F';
const GOLD_LIGHT = '#D4A853';

// ── Utilities ──────────────────────────────────────────────────────────────────
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

async function fetchAssetPng(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
      return await sharp(buf, { density: 300 }).png().toBuffer();
    }
    return await sharp(buf).png().toBuffer();
  } catch {
    return null;
  }
}

// ── Drawing helpers ────────────────────────────────────────────────────────────
function hGradLine(doc, topPx, leftPx, widthPx) {
  const x = p(leftPx), y = p(topPx), w = p(widthPx);
  const grad = doc.linearGradient(x, y, x + w, y);
  grad.stop(0, GOLD, 0).stop(0.5, GOLD, 1).stop(1, GOLD, 0);
  doc.rect(x, y, w, p(2)).fill(grad);
}

function centerGradLine(doc, topPx, widthPx, color, opacity) {
  const w = p(widthPx), x = CX - w / 2, y = p(topPx);
  const grad = doc.linearGradient(x, y, x + w, y);
  grad.stop(0, color, 0).stop(0.5, color, opacity).stop(1, color, 0);
  doc.rect(x, y, w, p(2)).fill(grad);
}

// ── PDF renderer ───────────────────────────────────────────────────────────────
async function renderCertificatePdf(values) {
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

  console.log('[cert] fetching assets');
  const [logoBuf, sigBuf] = await Promise.all([
    fetchAssetPng(values.logoUrl),
    fetchAssetPng(values.signatureUrl),
  ]);
  console.log('[cert] logo:', logoBuf ? logoBuf.length : 'null', 'sig:', sigBuf ? sigBuf.length : 'null');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [W, H], margin: 0, autoFirstPage: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log('[cert] PDF size:', buf.length);
      resolve(buf);
    });
    doc.on('error', reject);

    try {
      // Fonts
      console.log('[cert] FONTS_DIR:', FONTS_DIR, 'exists:', existsSync(FONTS_DIR));
      doc.registerFont('Playfair', join(FONTS_DIR, 'playfair-400.ttf'));
      doc.registerFont('Playfair-Medium', join(FONTS_DIR, 'playfair-500.ttf'));
      doc.registerFont('Playfair-Bold', join(FONTS_DIR, 'playfair-700.ttf'));
      doc.registerFont('SpaceGrotesk-Light', join(FONTS_DIR, 'space-grotesk-300.ttf'));
      doc.registerFont('SpaceGrotesk', join(FONTS_DIR, 'space-grotesk-400.ttf'));
      doc.registerFont('SpaceGrotesk-Medium', join(FONTS_DIR, 'space-grotesk-500.ttf'));
      doc.registerFont('SpaceGrotesk-SemiBold', join(FONTS_DIR, 'space-grotesk-600.ttf'));
      doc.registerFont('SpaceGrotesk-Bold', join(FONTS_DIR, 'space-grotesk-700.ttf'));

      // ── Background ──────────────────────────────────────────────────────────
      const bgGrad = doc.linearGradient(0, 0, 0, H);
      bgGrad.stop(0, '#FDFBF7').stop(1, '#F4F0E8');
      doc.rect(0, 0, W, H).fill(bgGrad);

      // ── Outer border (gold) ─────────────────────────────────────────────────
      doc.save().strokeColor(GOLD).lineWidth(p(2))
         .rect(p(44), p(44), W - p(88), H - p(88)).stroke().restore();

      // ── Inner border (gold, faint) ──────────────────────────────────────────
      doc.save().strokeColor(GOLD).strokeOpacity(0.27).lineWidth(p(1))
         .rect(p(62), p(62), W - p(124), H - p(124)).stroke().restore();

      // ── Corner ornaments ────────────────────────────────────────────────────
      const co = p(80), cl = p(140), clw = p(1.5);
      // top-left
      doc.save().strokeColor(GOLD).lineWidth(clw)
         .moveTo(co, co + cl).lineTo(co, co).lineTo(co + cl, co).stroke().restore();
      // top-right
      doc.save().strokeColor(GOLD).lineWidth(clw)
         .moveTo(W - co - cl, co).lineTo(W - co, co).lineTo(W - co, co + cl).stroke().restore();
      // bottom-left
      doc.save().strokeColor(GOLD).lineWidth(clw)
         .moveTo(co, H - co - cl).lineTo(co, H - co).lineTo(co + cl, H - co).stroke().restore();
      // bottom-right
      doc.save().strokeColor(GOLD).lineWidth(clw)
         .moveTo(W - co - cl, H - co).lineTo(W - co, H - co).lineTo(W - co, H - co - cl).stroke().restore();

      // ── Gold rules around logo ──────────────────────────────────────────────
      hGradLine(doc, 88, 480, 794);
      hGradLine(doc, 230, 480, 794);

      // ── Logo ────────────────────────────────────────────────────────────────
      if (logoBuf) {
        const imgW = p(240), imgH = p(100);
        doc.image(logoBuf, CX - imgW / 2, p(104), { fit: [imgW, imgH], align: 'center', valign: 'center' });
      } else {
        doc.font('Playfair-Bold').fontSize(p(72)).fillColor(GOLD).fillOpacity(1)
           .text('ARQO', 0, p(140), { width: W, align: 'center', lineBreak: false });
      }

      // ── "Certificado" title ─────────────────────────────────────────────────
      doc.font('Playfair').fontSize(p(88)).fillColor(BLACK).fillOpacity(1)
         .text('Certificado', 0, p(268), { width: W, align: 'center', lineBreak: false });

      // Gold underline
      centerGradLine(doc, 360, 360, GOLD_LIGHT, 1);

      // ── Intro text ──────────────────────────────────────────────────────────
      doc.font('SpaceGrotesk-Light').fontSize(p(21)).fillColor(BLACK).fillOpacity(0.60)
         .text('O Founder e CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes,',
               0, p(394), { width: W, align: 'center', lineBreak: false });
      doc.font('SpaceGrotesk-Light').fontSize(p(21)).fillColor(BLACK).fillOpacity(0.60)
         .text('confere o presente certificado a',
               0, p(430), { width: W, align: 'center', lineBreak: false });

      // Small gold divider line
      doc.save().strokeColor(GOLD).strokeOpacity(0.7).lineWidth(p(1))
         .moveTo(CX - p(36), p(458)).lineTo(CX + p(36), p(458)).stroke().restore();

      // ── Recipient name ──────────────────────────────────────────────────────
      const nameTop = recipient.fontSize <= 68 ? p(490) : p(476);
      doc.font('Playfair-Medium').fontSize(p(recipient.fontSize)).fillColor(BLACK).fillOpacity(1)
         .text(recipient.text, 0, nameTop, { width: W, align: 'center', lineBreak: false });

      // Rule under name
      hGradLine(doc, 630, 420, 1754 - 840);

      // ── Body statement ──────────────────────────────────────────────────────
      bodyLines.forEach((line, i) => {
        doc.font('SpaceGrotesk-Light').fontSize(p(22)).fillColor(BLACK).fillOpacity(0.68)
           .text(line, 0, p(688) + i * p(50), { width: W, align: 'center', lineBreak: false });
      });

      // ── Signature image ─────────────────────────────────────────────────────
      if (sigBuf) {
        const sw = p(330), sh = p(130);
        doc.image(sigBuf, p(1190), p(820), { fit: [sw, sh], align: 'center', valign: 'center' });
      }

      // ── Footer separator ────────────────────────────────────────────────────
      const fsY = p(920);
      const fsGrad = doc.linearGradient(p(120), fsY, W - p(120), fsY);
      fsGrad.stop(0, GOLD_LIGHT, 0).stop(0.5, GOLD_LIGHT, 0.53).stop(1, GOLD_LIGHT, 0);
      doc.rect(p(120), fsY, W - p(240), p(1)).fill(fsGrad);

      // ── Date column ─────────────────────────────────────────────────────────
      const dtX = p(160), dtW = p(340), dtY = p(950);
      doc.font('SpaceGrotesk').fontSize(p(20)).fillColor(BLACK).fillOpacity(1)
         .text(completionDate, dtX, dtY, { width: dtW, align: 'center', lineBreak: false });
      doc.save().strokeColor(GOLD).lineWidth(p(1))
         .moveTo(dtX, dtY + p(32)).lineTo(dtX + dtW, dtY + p(32)).stroke().restore();
      doc.font('SpaceGrotesk-Light').fontSize(p(14)).fillColor(BLACK).fillOpacity(0.50)
         .text('DATA', dtX, dtY + p(48), { width: dtW, align: 'center', lineBreak: false, characterSpacing: p(2) });

      // ── Student signature line ──────────────────────────────────────────────
      doc.save().strokeColor(BLACK).strokeOpacity(0.22).lineWidth(p(1))
         .moveTo(p(620), p(982)).lineTo(p(1070), p(982)).stroke().restore();
      doc.font('SpaceGrotesk-Light').fontSize(p(14)).fillColor(BLACK).fillOpacity(0.50)
         .text('ASSINATURA DO ALUNO', p(620), p(998), { width: p(450), align: 'center', lineBreak: false, characterSpacing: p(2) });

      // ── CEO signature line ──────────────────────────────────────────────────
      doc.save().strokeColor(BLACK).strokeOpacity(0.22).lineWidth(p(1))
         .moveTo(p(1140), p(982)).lineTo(p(1594), p(982)).stroke().restore();
      doc.font('SpaceGrotesk-Light').fontSize(p(14)).fillColor(BLACK).fillOpacity(0.50)
         .text('GILSON NOGUEIRA - CEO & FOUNDER', p(1140), p(998), { width: p(454), align: 'center', lineBreak: false, characterSpacing: p(2) });

      // ── Validation code ─────────────────────────────────────────────────────
      doc.font('SpaceGrotesk-Light').fontSize(p(12)).fillColor(BLACK).fillOpacity(0.35)
         .text(`CODIGO DE VALIDACAO: ${validationCode}`, 0, H - p(60), { width: W, align: 'center', lineBreak: false, characterSpacing: p(2) });

    } catch (err) {
      return reject(err);
    }

    doc.end();
  });
}

// ── Auth ───────────────────────────────────────────────────────────────────────
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

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).send('Method not allowed');
    return;
  }

  try {
    await assertAuthenticated(request);
    const pdf = await renderCertificatePdf(request.body || {});
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(pdf);
  } catch (error) {
    const statusCode =
      typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 500;
    response
      .status(Number.isFinite(statusCode) ? statusCode : 500)
      .json({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' });
  }
}
