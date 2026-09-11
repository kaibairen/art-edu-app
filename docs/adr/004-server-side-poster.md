# ADR 004：服务端生成海报

- 状态：已采纳
- 日期：2026-09-11

## 决策

海报在 API 内用 **sharp 栅格化 SVG** 合成，强制叠加学员姓名、创作时间、LOGO、平铺水印。提供 `classic` / `gallery` / `festival` 三套模板。

## 理由

- 产品要求「服务端生成优先」，避免客户端绕过 LOGO/水印。
- sharp 是 Node 图像处理事实标准：<https://sharp.pixelplumbing.com/>
- SVG 文本便于嵌入中文（系统字体 WenQuanYi / Noto CJK）。
- 生成结果写入 `Poster.recipe`，e2e 可断言 overlays。

## 非目标

客户端实时滤镜、视频封面、批量导出（二期）。
