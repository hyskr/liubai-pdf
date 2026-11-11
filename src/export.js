import { readFile, access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function renderMarkdown(source) {
  const md = new MarkdownIt({ html: true, linkify: true }).use(footnote).use(texmath, { engine: katex, delimiters: 'dollars', katexOptions: { throwOnError: false } });
  const fence = md.renderer.rules.fence.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, i, options, env, self) => tokens[i].info.trim() === 'mermaid'
    ? `<div class="mermaid">${escape(tokens[i].content)}</div>\n`
    : fence(tokens, i, options, env, self);
  return md.render(source.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, ''));
}

async function findBrowser(explicit) {
  const candidates = explicit ? [explicit] : [process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && join(process.env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')].filter(Boolean);
  for (const candidate of candidates) { try { await access(candidate); return candidate; } catch {} }
  throw new Error('找不到 Chrome、Chromium 或 Edge。请安装浏览器或使用 --browser 指定可执行文件。');
}

export function layoutCss(options = {}) {
  const compact = options.compact;
  function number(value, fallback, name, min, max) {
    if (value === undefined) return fallback;
    const n = Number(value);
    if (typeof value === 'string' && !value.trim() || !Number.isFinite(n) || n < min || n > max)
      throw new Error(`${name} 必须是 ${min} 到 ${max} 之间的数字。`);
    return n;
  }
  const margin = number(options.margin, compact ? 12 : 18, '页边距', 0, 80);
  const lineHeight = number(options.lineHeight, compact ? 1.55 : 1.9, '行距', 1, 3);
  const paragraphSpacing = number(options.paragraphSpacing, compact ? 8 : 14, '段落间距', 0, 80);
  const fontSize = number(options.fontSize, 16, '字号', 8, 32);
  return `@page { margin: ${margin}mm; }
body { font-size: ${fontSize}px; line-height: ${lineHeight}; }
p { line-height: ${lineHeight}; margin: ${paragraphSpacing}px 0; }
${compact ? `h1 { margin: 16px 0 10px; } h2 { margin: 16px 0 8px; }
h3, h4, h5, h6 { margin: 12px 0 6px; } table { margin: 12px 0; }
th, td { padding: 6px; } pre { padding: 10px; } hr { margin: 16px 0; }
h1::after, h2::after, h3::after, h4::after, h5::after, h6::after { height: 70px; margin-bottom: -70px; }` : ''}`;
}

export async function exportPdf(input, output, browserPath, options = {}) {
  const source = await readFile(input, 'utf8');
  const css = (await readFile(join(here, 'style.css'), 'utf8')) + '\n' + layoutCss(options);
  const katexCss = pathToFileURL(require.resolve('katex/dist/katex.min.css')).href;
  const base = pathToFileURL(dirname(input) + '/').href;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(basename(input, extname(input)))}</title><base href="${escape(base)}"><link rel="stylesheet" href="${escape(katexCss)}"><style>${css}</style></head><body>${renderMarkdown(source)}</body></html>`;
  const dir = await mkdtemp(join(tmpdir(), 'liubai-pdf-'));
  let browser;
  try {
    const htmlPath = join(dir, 'document.html');
    await writeFile(htmlPath, html);
    browser = await puppeteer.launch({ executablePath: await findBrowser(browserPath), headless: true, args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
    const missing = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
      document.querySelectorAll('details').forEach(el => { el.open = true; });
      return [...document.images].filter(img => !img.naturalWidth).map(img => img.getAttribute('src'));
    });
    if (missing.length) throw new Error(`图片无法读取：${missing.join(', ')}`);
    if (await page.$('.mermaid')) {
      await page.addScriptTag({ path: require.resolve('mermaid/dist/mermaid.min.js') });
      await page.evaluate(async () => { mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' }); await mermaid.run({ querySelector: '.mermaid' }); });
    }
    await page.pdf({ path: resolve(output), printBackground: true, preferCSSPageSize: true });
  } finally {
    if (browser) await browser.close();
    await rm(dir, { recursive: true, force: true });
  }
}
