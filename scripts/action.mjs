import { appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, parse, resolve, join } from 'node:path';

const env = process.env;
if (!env.TOOL_INPUT) throw new Error('请指定 input。');
if (!['true', 'false'].includes(env.TOOL_COMPACT || 'false')) throw new Error('compact 必须为 true 或 false。');
const input = resolve(env.TOOL_INPUT);
const parsed = parse(input);
const output = resolve(env.TOOL_OUTPUT || join(parsed.dir, `${parsed.name}.pdf`));
const args = [join(env.TOOL_ACTION_PATH, 'bin/liubai-pdf.js'), input, '--output', output];
if (env.TOOL_COMPACT === 'true') args.push('--compact');
for (const [key, flag] of [['TOOL_MARGIN', '--margin'], ['TOOL_LINE_HEIGHT', '--line-height'], ['TOOL_PARAGRAPH_SPACING', '--paragraph-spacing'], ['TOOL_FONT_SIZE', '--font-size'], ['TOOL_BROWSER', '--browser']]) {
  if (env[key]) args.push(flag, env[key]);
}
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `pdf=${output}\n`);
