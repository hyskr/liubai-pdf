#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve, parse } from 'node:path';
import { exportPdf } from '../src/export.js';

const help = `用法: liubai-pdf <文件.md> [-o 输出.pdf] [--browser 浏览器路径]

将 Markdown 排版为 A4 PDF。需要安装 Chrome、Chromium 或 Microsoft Edge。

  -o, --output    输出路径（默认与输入文件同名）
  --browser       Chrome/Chromium/Edge 可执行文件路径
  --compact       紧凑排版（边距 12mm、行距 1.55）
  --margin        四周页边距，单位 mm（默认 18）
  --line-height   正文行距倍数（默认 1.9）
  --paragraph-spacing  段落上下间距，单位 px（默认 14）
  --font-size     正文字号，单位 px（默认 16）
  -h, --help      显示帮助
  -v, --version   显示版本`;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    output: { type: 'string', short: 'o' }, browser: { type: 'string' },
    help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
    compact: { type: 'boolean' }, margin: { type: 'string' },
    'line-height': { type: 'string' }, 'paragraph-spacing': { type: 'string' }, 'font-size': { type: 'string' }
  }});
  if (values.help) console.log(help);
  else if (values.version) console.log('1.1.0');
  else {
    if (positionals.length !== 1) throw new Error('请指定一个 Markdown 文件。使用 --help 查看用法。');
    const input = resolve(positionals[0]);
    const parsed = parse(input);
    const output = resolve(values.output || `${parsed.dir}/${parsed.name}.pdf`);
    if (input === output) throw new Error('输出路径不能与输入文件相同。');
    await exportPdf(input, output, values.browser, { compact: values.compact, margin: values.margin, lineHeight: values['line-height'], paragraphSpacing: values['paragraph-spacing'], fontSize: values['font-size'] });
    console.log(`已导出：${output}`);
  }
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exitCode = 1;
}
