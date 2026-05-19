import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const WIDTH = 1600;
const HEIGHT = 1100;
const BLACK = '#111111';
const GOLD = '#C8A46B';
const OFF_WHITE = '#F8F6F2';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveBrowserExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

async function getBrowserLaunchOptions() {
  const executablePath = resolveBrowserExecutablePath();

  if (executablePath) {
    return {
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
  }

  return {
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  };
}

function createValidationCode(userName, courseName, completedAt) {
  const source = `${userName}-${courseName}-${completedAt}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `ARQO-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)}`;
}

function buildCertificateHtml(values) {
  const recipientName = escapeHtml(values.userName);
  const courseTitle = escapeHtml(values.courseName);
  const workload = escapeHtml(values.workload);
  const city = escapeHtml(values.city || 'Dourados - MS');
  const completionDate = escapeHtml(values.completionDate);
  const logoUrl = escapeHtml(values.logoUrl);
  const signatureUrl = escapeHtml(values.signatureUrl);
  const validationCode = escapeHtml(values.validationCode || createValidationCode(values.userName, values.courseName, values.completedAt));

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${WIDTH}, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      margin: 0;
      overflow: hidden;
      background: ${OFF_WHITE};
    }
    body {
      font-family: Inter, Montserrat, Lato, Arial, Helvetica, sans-serif;
      color: ${BLACK};
    }
    .sheet {
      position: relative;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      background:
        linear-gradient(45deg, rgba(200,164,107,.01) 25%, transparent 25%) 0 0 / 44px 44px,
        linear-gradient(-45deg, rgba(17,17,17,.006) 25%, transparent 25%) 0 0 / 44px 44px,
        ${OFF_WHITE};
    }
    .outer-frame {
      position: absolute;
      inset: 56px;
      border: 1.5px solid ${GOLD};
      pointer-events: none;
    }
    .inner-frame {
      position: absolute;
      inset: 78px;
      border: 1px solid rgba(200,164,107,.28);
      pointer-events: none;
    }
    .corner {
      position: absolute;
      width: 112px;
      height: 112px;
      border-color: ${GOLD};
      border-style: solid;
      opacity: .82;
    }
    .corner.top-left { left: 92px; top: 92px; border-width: 1px 0 0 1px; }
    .corner.top-right { right: 92px; top: 92px; border-width: 1px 1px 0 0; }
    .corner.bottom-left { left: 92px; bottom: 92px; border-width: 0 0 1px 1px; }
    .corner.bottom-right { right: 92px; bottom: 92px; border-width: 0 1px 1px 0; }
    .top-accent {
      position: absolute;
      top: 134px;
      left: 448px;
      right: 448px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
    }
    .bottom-accent {
      position: absolute;
      bottom: 178px;
      left: 494px;
      right: 494px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(200,164,107,.72), transparent);
    }
    .certificate-content {
      position: absolute;
      top: 148px;
      left: 205px;
      right: 205px;
      display: grid;
      justify-items: center;
      text-align: center;
    }
    .brand-logo {
      width: 214px;
      height: auto;
      display: block;
      margin-bottom: 50px;
      filter: grayscale(1) contrast(1.08);
    }
    .certificate-title {
      margin: 0;
      font-family: "Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 108px;
      font-weight: 400;
      line-height: .9;
      letter-spacing: .01em;
      color: ${BLACK};
    }
    .institutional-statement {
      width: 1000px;
      margin: 54px 0 0;
      font-size: 22px;
      line-height: 1.62;
      font-weight: 400;
      color: rgba(17,17,17,.72);
    }
    .recipient-name {
      max-width: 1220px;
      margin: 42px 0 26px;
      font-family: "Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif;
      font-size: 116px;
      font-weight: 500;
      line-height: .9;
      color: ${BLACK};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .recipient-rule {
      width: 760px;
      height: 1px;
      margin-bottom: 46px;
      background: linear-gradient(90deg, transparent, ${GOLD} 18%, ${GOLD} 82%, transparent);
    }
    .course-statement {
      width: 1060px;
      margin: 0;
      font-size: 25px;
      line-height: 1.58;
      font-weight: 400;
      color: rgba(17,17,17,.74);
    }
    .certificate-footer {
      position: absolute;
      left: 230px;
      right: 230px;
      bottom: 118px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 86px;
      align-items: end;
      z-index: 3;
    }
    .footer-field {
      min-height: 82px;
      border-top: 1px solid ${BLACK};
      padding-top: 15px;
      text-align: center;
      color: rgba(17,17,17,.72);
      font-size: 18px;
      font-weight: 400;
    }
    .date-field {
      border-color: ${GOLD};
    }
    .date-value {
      display: block;
      margin-bottom: 8px;
      color: ${BLACK};
      font-size: 20px;
    }
    .ceo-signature {
      position: relative;
    }
    .ceo-signature img {
      position: absolute;
      left: 50%;
      top: -112px;
      width: 300px;
      transform: translateX(-50%);
      opacity: .94;
    }
    .validation-code {
      position: absolute;
      left: 82px;
      right: 82px;
      bottom: 56px;
      color: rgba(17,17,17,.48);
      font-size: 12px;
      z-index: 4;
    }
  </style>
</head>
<body>
  <main class="sheet">
    <div class="outer-frame"></div>
    <div class="inner-frame"></div>
    <div class="corner top-left"></div>
    <div class="corner top-right"></div>
    <div class="corner bottom-left"></div>
    <div class="corner bottom-right"></div>
    <div class="top-accent"></div>
    <div class="bottom-accent"></div>

    <section class="certificate-content">
      <img class="brand-logo" src="${logoUrl}" alt="ARQO" />
      <h1 class="certificate-title">Certificado</h1>
      <p class="institutional-statement">O Founder &amp; CEO da ARQO, Gilson Nogueira, no uso de suas atribuições, confere o presente certificado a</p>
      <p class="recipient-name">${recipientName}</p>
      <div class="recipient-rule"></div>
      <p class="course-statement">por ter concluído com êxito o curso ${courseTitle}, com carga horária total de ${workload}, realizado em ${completionDate}, na cidade de ${city}.</p>
    </section>

    <section class="certificate-footer">
      <div class="footer-field date-field">
        <span class="date-value">${completionDate}</span>
        Data
      </div>
      <div class="footer-field">Assinatura do aluno</div>
      <div class="footer-field ceo-signature">
        <img src="${signatureUrl}" alt="Assinatura Gilson Nogueira" />
        Gilson Nogueira - CEO &amp; Founder
      </div>
    </section>

    <footer class="validation-code">Código de validação: ${validationCode}</footer>
  </main>
</body>
</html>`;
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

  let browser;
  try {
    await assertAuthenticated(request);
    const values = request.body || {};
    const html = buildCertificateHtml(values);
    browser = await puppeteer.launch(await getBrowserLaunchOptions());
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      omitBackground: false,
    });

    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(Buffer.from(png));
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : 500;
    response.status(Number.isFinite(statusCode) ? statusCode : 500).json({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' });
  } finally {
    if (browser) await browser.close();
  }
}
