# liubai-pdf

将 Markdown 排版为适合阅读和分享的 PDF。样式参考 [留白 Liubai](https://github.com/echoVic/liubai) 的导出：A4 纸张、舒展的行距、清晰的标题层级与分页规则。

## 安装

需要 Node.js 22.12 或更新版本，以及 Google Chrome、Chromium 或 Microsoft Edge。

```bash
git clone https://github.com/hyskr/liubai-pdf.git
cd liubai-pdf
npm install
npm link
```

## 使用

```bash
liubai-pdf article.md
liubai-pdf article.md -o output.pdf
liubai-pdf article.md --browser /path/to/chrome
liubai-pdf article.md --compact
liubai-pdf article.md --margin 15 --line-height 1.7 --paragraph-spacing 10 --font-size 15
```

默认在输入文件旁生成同名 PDF。可用 `--browser` 或 `CHROME_PATH` 指定浏览器可执行文件。输入中的相对图片路径以 Markdown 文件所在目录为基准；无法读取的图片会报错。支持常见 Markdown、表格、脚注、LaTeX 数学公式和 Mermaid 图表，YAML front matter 不会显示。

### 排版选项

| 选项 | 作用 | 默认值 | 紧凑模式 |
| --- | --- | --- | --- |
| `--compact` | 缩小边距、间距和表格内边距 | 关闭 | — |
| `--margin` | 四周页边距，单位 mm（0–80） | 18 | 12 |
| `--line-height` | 正文行距倍数（1–3） | 1.9 | 1.55 |
| `--paragraph-spacing` | 段落上下间距，单位 px（0–80） | 14 | 8 |
| `--font-size` | 正文字号，单位 px（8–32） | 16 | 16 |

单独指定的选项会覆盖紧凑模式的对应值。页面固定为 A4。

## 许可

MIT。排版样式参考并移植自 [echoVic/liubai](https://github.com/echoVic/liubai)，原项目许可见 [THIRD_PARTY_LICENSE](THIRD_PARTY_LICENSE)。
