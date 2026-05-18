import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pathToFileURL } from 'node:url';

function certificateApiDevPlugin() {
  return {
    name: 'certificate-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/render-certificate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Allow', 'POST');
          res.end('Method not allowed');
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          try {
            const bodyText = Buffer.concat(chunks).toString('utf8') || '{}';
            const certificateApiUrl = `${pathToFileURL(`${server.config.root}/api/render-certificate.js`).href}?t=${Date.now()}`;
            const { default: handler } = await import(certificateApiUrl);
            await handler(
              {
                method: 'POST',
                body: JSON.parse(bodyText),
                headers: {
                  authorization: req.headers.authorization,
                },
              },
              {
                setHeader: (name: string, value: string) => res.setHeader(name, value),
                status: (code: number) => {
                  res.statusCode = code;
                  return {
                    send: (value: string | Buffer) => res.end(value),
                    json: (value: unknown) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(value));
                    },
                  };
                },
              }
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [certificateApiDevPlugin(), react({ babel: { plugins: [
function __dualiteSourceLoc({ types: t }) {
  return { visitor: { JSXOpeningElement(path, state) {
    const fn = state.filename || '';
    if (!fn || fn.includes('node_modules')) return;
    const name = path.node.name;
    const reactSpecials = ['Fragment', 'StrictMode', 'Suspense', 'Profiler'];
    const isReactSpecial = (name.type === 'JSXIdentifier' && reactSpecials.indexOf(name.name) !== -1) ||
      (name.type === 'JSXMemberExpression' && name.object && name.object.name === 'React' && name.property && reactSpecials.indexOf(name.property.name) !== -1) ||
      (name.type === 'JSXMemberExpression' && name.property && (name.property.name === 'Provider' || name.property.name === 'Consumer'));
    if (isReactSpecial) return;
    const attrs = path.node.attributes;
    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].type === 'JSXAttribute' && attrs[i].name && attrs[i].name.name === 'data-ds') return;
    }
    const loc = path.node.loc;
    if (!loc) return;
    const wd = '/home/project/';
    const rel = fn.startsWith(wd) ? fn.slice(wd.length) : fn;
    attrs.push(t.jsxAttribute(t.jsxIdentifier('data-ds'), t.stringLiteral(rel + ':' + loc.start.line + ':' + loc.start.column)));
  } } };
}
] } })],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
