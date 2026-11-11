#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve, parse } from 'node:path';
import { exportPdf } from '../src/export.js';

const help = `用法: liubai-pdf <文件.md> [-o 输出.pdf] [--browser 浏览器路径]

将 Markdown 排版为 A4 PDF。需要安装 Chrome、Chromium 或 Microsoft Edge。

  -o, --output    输出路径（默认与输入文件同名）
  --browser       Chrome/Chromium/Edge 可执行文件路径
  -h, --help      显示帮助
  -v, --version   显示版本`;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    output: { type: 'string', short: 'o' }, browser: { type: 'string' },
    help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' }
  }});
  if (values.help) console.log(help);
  else if (values.version) console.log('1.0.0');
  else {
    if (positionals.length !== 1) throw new Error('请指定一个 Markdown 文件。使用 --help 查看用法。');
    const input = resolve(positionals[0]);
    const parsed = parse(input);
    const output = resolve(values.output || `${parsed.dir}/${parsed.name}.pdf`);
    if (input === output) throw new Error('输出路径不能与输入文件相同。');
    await exportPdf(input, output, values.browser);
    console.log(`已导出：${output}`);
  }
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exitCode = 1;
}
