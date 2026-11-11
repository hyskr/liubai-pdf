import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportPdf, renderMarkdown } from '../src/export.js';

test('渲染标题、公式、脚注并隐藏 front matter', () => {
  const html = renderMarkdown('---\ntitle: hidden\n---\n# 标题\n\n公式 $x^2$ 和脚注[^a]。\n\n[^a]: 内容');
  assert.match(html, /<h1>标题<\/h1>/);
  assert.match(html, /class="katex"/);
  assert.match(html, /class="footnotes"/);
  assert.doesNotMatch(html, /title: hidden/);
});

test('导出相对图片并报告缺失图片', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'liubai-test-'));
  try {
    const input = join(dir, 'test.md');
    const output = join(dir, 'test.pdf');
    await writeFile(join(dir, 'image.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><rect width="30" height="30" fill="red"/></svg>');
    await writeFile(input, '# 图片\n\n![图](image.svg)');
    await exportPdf(input, output);
    assert.equal((await readFile(output)).subarray(0, 5).toString(), '%PDF-');
    await writeFile(input, '![缺失](missing.png)');
    await assert.rejects(exportPdf(input, output), /图片无法读取：missing.png/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
