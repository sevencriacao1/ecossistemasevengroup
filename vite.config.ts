import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ babel: { plugins: [
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
