# Graph Report - smart-ppt  (2026-06-02)

## Corpus Check
- 31 files · ~6,927 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 219 nodes · 338 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8bdf2edd`
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

## God Nodes (most connected - your core abstractions)
1. `如何生成图文并茂的 PPT` - 17 edges
2. `AiService` - 14 edges
3. `FileLogger` - 12 edges
4. `addBullets()` - 9 edges
5. `LayoutContext` - 8 edges
6. `addImageIfPresent()` - 8 edges
7. `ImageService` - 7 edges
8. `PptService` - 7 edges
9. `PPT 生成流程` - 7 edges
10. `WanxProvider` - 6 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --calls--> `createFileLogger()`  [EXTRACTED]
  api/src/main.ts → api/src/log/file-logger.ts
- `bootstrap()` --calls--> `resolveLogDir()`  [EXTRACTED]
  api/src/main.ts → api/src/log/resolve-log-dir.ts
- `renderTitleBullets()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/title-bullets.layout.ts → api/src/ppt/layouts/helpers.ts
- `renderTwoColumn()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/two-column.layout.ts → api/src/ppt/layouts/helpers.ts
- `renderImageLeft()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/image-side.layout.ts → api/src/ppt/layouts/helpers.ts

## Communities (17 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): code:block1 (POST /ppt/generate { topic, slideCount }), code:typescript (@Post('generate')), code:yaml (PORT: 3000), code:typescript (const DEFAULT_THEME: PresentationTheme = {), code:json ({), code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:bash (# 只测 LLM JSON 输出（临时在 controller 打日志）), code:mermaid (sequenceDiagram) (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (15): GeneratePptDto, PptService, parseOutline(), PresentationOutline, SlideOutline, DEFAULT_THEME, mergeTheme(), normalizeLayout() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (16): CHART_TYPES, renderChart(), renderCover(), renderFullImage(), addBullets(), addImageIfPresent(), effectiveLayout(), IMAGE_LAYOUTS (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (19): 1. 用户输入要求, 2. LLM 生成大纲, 3. 对每一个章节补充详细内容, 4. PPT 润色 + 图片补充, 4a 全文润色, 4b 图片补充, 4c 渲染 pptx, code:block1 (用户输入 → LLM 生成大纲 → 逐页补充详细内容 → 全文润色 → 图片补充 → 渲染 pptx) (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (5): ImageService, FALLBACK_PNG, PlaceholderProvider, WanxProvider, WanxTaskResponse

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (6): AiModule, DEFAULT_CONFIG_PATH, loadYamlConfig(), ImageModule, PptController, PptModule

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (10): API, code:bash (npm install), code:json ({), code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:block4 (src/), ppt-agent, 功能, 快速开始 (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (11): code:yaml (image_provider: wanx          # wanx | unsplash | placeholde), code:typescript (// 推荐：本地路径（ImageService 下载后）), code:typescript (// 上传后得到 https://tx-res-01.oss-cn-guangzhou.aliyuncs.com/pro), code:typescript (// src/image/image.service.ts), code:block9 (POST /api/v1/services/aigc/text2image/image-synthesis), ImageService 接口（推荐）, OSS 上传（可选）, pptxgenjs 嵌入方式 (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (10): code:block13 (cover                 image-right              two-column), code:typescript (// src/ppt/layouts/index.ts), code:typescript (export function renderImageRight({ slide, page, theme }: Lay), code:typescript (page.addImage({ path: slide.imagePath, x: 0, y: 0, w: 10, h:), full-image 半透明遮罩, image-right 示例, layout 调度（推荐）, 坐标表 (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.39
Nodes (5): createFileLogger(), LogLevel, resolveLogDir(), AppModule, bootstrap()

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (8): code:mermaid (flowchart LR), code:bash (curl -X POST http://localhost:3000/ppt/generate \), 代价与注意, 内容不够丰富, 方案（已实现）, 根因, 现象, 验证

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (7): code:typescript (// src/ai/types/slide-content.ts), code:json ({), code:block7 (Return JSON with this shape:), LLM 输出示例（8 页）, Prompt 改造要点, TypeScript 类型（目标）, 完整 JSON Schema

## Knowledge Gaps
- **69 isolated node(s):** `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG`, `SLIDE_LAYOUTS`, `SlideChart` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `如何生成图文并茂的 PPT` connect `Community 0` to `Community 9`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `FileLogger` connect `Community 7` to `Community 11`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `AiService` connect `Community 6` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._