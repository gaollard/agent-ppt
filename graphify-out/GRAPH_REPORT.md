# Graph Report - smart-ppt  (2026-06-03)

## Corpus Check
- 59 files · ~21,106 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 405 nodes · 716 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30626f7f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `如何生成图文并茂的 PPT` - 17 edges
2. `AiService` - 14 edges
3. `FileLogger` - 12 edges
4. `addBullets()` - 11 edges
5. `normalizeTable()` - 11 edges
6. `LayoutContext` - 9 edges
7. `normalizeContent()` - 8 edges
8. `PptController` - 8 edges
9. `addImageIfPresent()` - 8 edges
10. `SlideContent` - 8 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --calls--> `createFileLogger()`  [EXTRACTED]
  api/src/main.ts → api/src/log/file-logger.ts
- `bootstrap()` --calls--> `resolveLogDir()`  [EXTRACTED]
  api/src/main.ts → api/src/log/resolve-log-dir.ts
- `renderTitleBullets()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/title-bullets.layout.ts → api/src/ppt/layouts/helpers.ts
- `renderFreeform()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/freeform.layout.ts → api/src/ppt/layouts/helpers.ts
- `renderSlide()` --calls--> `renderFreeform()`  [EXTRACTED]
  api/src/ppt/layouts/index.ts → api/src/ppt/layouts/freeform.layout.ts

## Communities (27 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (44): downloadBlob(), exportPptx(), generateContent(), FreeformCanvas, FreeformCanvasHandle, sortElements(), GeneratePanel(), Props (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (43): CanvasElement, ClickClearState, clientToCanvasPct(), DragState, MarqueeState, PendingTableDrag, Props, rectFromDrag() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (34): GeneratePptDto, ChartDto, ColumnDto, ElementStyleDto, PresentationContentDto, SlideDto, SlideElementDto, TableCellDataDto (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (18): CHART_TYPES, renderChart(), renderCover(), renderFreeform(), toInches(), renderFullImage(), addBullets(), addImageIfPresent() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (19): 1. 用户输入要求, 2. LLM 生成大纲, 3. 对每一个章节补充详细内容, 4. PPT 润色 + 图片补充, 4a 全文润色, 4b 图片补充, 4c 渲染 pptx, code:block1 (用户输入 → LLM 生成大纲 → 逐页补充详细内容 → 全文润色 → 图片补充 → 渲染 pptx) (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (10): AiModule, DEFAULT_CONFIG_PATH, loadYamlConfig(), ImageModule, createFileLogger(), LogLevel, resolveLogDir(), PptModule (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (16): ElementInspector(), Props, SlideElement, alignElement(), readImageFile(), createImageElement(), createShapeElement(), createTableCells() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (5): ImageService, FALLBACK_PNG, PlaceholderProvider, WanxProvider, WanxTaskResponse

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (12): effectiveLayout(), hexColor(), themeVars(), EditableBullets(), EditableBulletsProps, EditableText(), EditableTextProps, ChartPreview() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): code:typescript (@Post('generate')), code:yaml (PORT: 3000), code:typescript (const DEFAULT_THEME: PresentationTheme = {), Controller 编排, 参考链接, 如何生成图文并茂的 PPT, 实施路线图, 常见问题 (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (10): API, code:bash (npm install), code:json ({), code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:block4 (src/), ppt-agent, 功能, 快速开始 (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (11): code:yaml (image_provider: wanx          # wanx | unsplash | placeholde), code:typescript (// 推荐：本地路径（ImageService 下载后）), code:typescript (// 上传后得到 https://tx-res-01.oss-cn-guangzhou.aliyuncs.com/pro), code:typescript (// src/image/image.service.ts), code:block9 (POST /api/v1/services/aigc/text2image/image-synthesis), ImageService 接口（推荐）, OSS 上传（可选）, pptxgenjs 嵌入方式 (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (10): code:block13 (cover                 image-right              two-column), code:typescript (// src/ppt/layouts/index.ts), code:typescript (export function renderImageRight({ slide, page, theme }: Lay), code:typescript (page.addImage({ path: slide.imagePath, x: 0, y: 0, w: 10, h:), full-image 半透明遮罩, image-right 示例, layout 调度（推荐）, 坐标表 (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (8): code:mermaid (flowchart LR), code:bash (curl -X POST http://localhost:3000/ppt/generate \), 代价与注意, 内容不够丰富, 方案（已实现）, 根因, 现象, 验证

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (7): code:bash (cd client), code:bash (pnpm build), Smart PPT Client, 前置条件, 功能, 开发, 构建

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (7): code:typescript (// src/ai/types/slide-content.ts), code:json ({), code:block7 (Return JSON with this shape:), LLM 输出示例（8 页）, Prompt 改造要点, TypeScript 类型（目标）, 完整 JSON Schema

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (6): Step 1 — 扩展类型与 Prompt（P0）, Step 2 — 新增 ImageService（P1）, Step 3 — 拆分 layout 渲染（P2）, Step 4 — 串联 Controller（P2）, Step 5 — 主题色与图表（P3）, 改造步骤

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): code:block1 (POST /ppt/generate { topic, slideCount }), code:json ({), 差距一览, 当前 JSON 结构, 当前流程, 现状与差距

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:bash (# 只测 LLM JSON 输出（临时在 controller 打日志）), 图文并茂验收清单, 开发阶段调试技巧, 当前 API 冒烟（纯文字）, 测试与验收

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (3): code:mermaid (sequenceDiagram), code:block4 (src/), 目标架构

## Knowledge Gaps
- **112 isolated node(s):** `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG`, `SlideChart`, `SlideColumn` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PptService` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **Why does `resolve()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **Why does `FileLogger` connect `Community 11` to `Community 5`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._