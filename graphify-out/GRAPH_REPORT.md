# Graph Report - smart-ppt  (2026-06-02)

## Corpus Check
- 30 files · ~6,237 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 194 nodes · 304 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `270845b0`
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
2. `FileLogger` - 12 edges
3. `AiService` - 10 edges
4. `addBullets()` - 9 edges
5. `LayoutContext` - 8 edges
6. `addImageIfPresent()` - 8 edges
7. `ImageService` - 7 edges
8. `PptService` - 7 edges
9. `WanxProvider` - 6 edges
10. `PptController` - 6 edges

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

## Communities (16 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (28): code:block1 (POST /ppt/generate { topic, slideCount }), code:typescript (@Post('generate')), code:yaml (PORT: 3000), code:typescript (const DEFAULT_THEME: PresentationTheme = {), code:json ({), code:mermaid (sequenceDiagram), code:block4 (src/), Controller 编排 (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (16): GeneratePptDto, PptService, parseOutline(), PresentationOutline, SlideOutline, DEFAULT_THEME, mergeTheme(), normalizeContent() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (16): CHART_TYPES, renderChart(), renderCover(), renderFullImage(), addBullets(), addImageIfPresent(), effectiveLayout(), IMAGE_LAYOUTS (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (6): ImageModule, ImageService, FALLBACK_PNG, PlaceholderProvider, WanxProvider, WanxTaskResponse

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (9): AiModule, DEFAULT_CONFIG_PATH, loadYamlConfig(), createFileLogger(), LogLevel, resolveLogDir(), PptModule, AppModule (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (10): API, code:bash (npm install), code:json ({), code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:block4 (src/), ppt-agent, 功能, 快速开始 (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (11): code:yaml (image_provider: wanx          # wanx | unsplash | placeholde), code:typescript (// 推荐：本地路径（ImageService 下载后）), code:typescript (// 上传后得到 https://tx-res-01.oss-cn-guangzhou.aliyuncs.com/pro), code:typescript (// src/image/image.service.ts), code:block9 (POST /api/v1/services/aigc/text2image/image-synthesis), ImageService 接口（推荐）, OSS 上传（可选）, pptxgenjs 嵌入方式 (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (10): code:block13 (cover                 image-right              two-column), code:typescript (// src/ppt/layouts/index.ts), code:typescript (export function renderImageRight({ slide, page, theme }: Lay), code:typescript (page.addImage({ path: slide.imagePath, x: 0, y: 0, w: 10, h:), full-image 半透明遮罩, image-right 示例, layout 调度（推荐）, 坐标表 (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (8): code:mermaid (flowchart LR), code:bash (curl -X POST http://localhost:3000/ppt/generate \), 代价与注意, 内容不够丰富, 方案（已实现）, 根因, 现象, 验证

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (7): code:typescript (// src/ai/types/slide-content.ts), code:json ({), code:block7 (Return JSON with this shape:), LLM 输出示例（8 页）, Prompt 改造要点, TypeScript 类型（目标）, 完整 JSON Schema

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (6): code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:bash (# 只测 LLM JSON 输出（临时在 controller 打日志）), 图文并茂验收清单, 开发阶段调试技巧, 当前 API 冒烟（纯文字）, 测试与验收

## Knowledge Gaps
- **59 isolated node(s):** `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG`, `SLIDE_LAYOUTS`, `SlideChart` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `如何生成图文并茂的 PPT` connect `Community 0` to `Community 8`, `Community 11`, `Community 12`, `Community 7`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `FileLogger` connect `Community 5` to `Community 4`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `AiService` connect `Community 10` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._