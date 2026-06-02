# Graph Report - ppt-agent  (2026-06-02)

## Corpus Check
- 24 files · ~5,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 159 nodes · 243 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `如何生成图文并茂的 PPT` - 17 edges
2. `addBullets()` - 9 edges
3. `LayoutContext` - 8 edges
4. `addImageIfPresent()` - 8 edges
5. `ImageService` - 7 edges
6. `AiService` - 7 edges
7. `PptService` - 7 edges
8. `WanxProvider` - 6 edges
9. `PptController` - 6 edges
10. `ppt-agent` - 6 edges

## Surprising Connections (you probably didn't know these)
- `renderTitleBullets()` --calls--> `addBullets()`  [EXTRACTED]
  src/ppt/layouts/title-bullets.layout.ts → src/ppt/layouts/helpers.ts
- `renderTwoColumn()` --calls--> `addBullets()`  [EXTRACTED]
  src/ppt/layouts/two-column.layout.ts → src/ppt/layouts/helpers.ts
- `renderImageLeft()` --calls--> `addBullets()`  [EXTRACTED]
  src/ppt/layouts/image-side.layout.ts → src/ppt/layouts/helpers.ts
- `renderImageRight()` --calls--> `addBullets()`  [EXTRACTED]
  src/ppt/layouts/image-side.layout.ts → src/ppt/layouts/helpers.ts
- `renderFullImage()` --calls--> `addImageIfPresent()`  [EXTRACTED]
  src/ppt/layouts/full-image.layout.ts → src/ppt/layouts/helpers.ts

## Communities (12 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (16): CHART_TYPES, renderChart(), renderCover(), renderFullImage(), addBullets(), addImageIfPresent(), effectiveLayout(), IMAGE_LAYOUTS (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (22): code:typescript (@Post('generate')), code:yaml (PORT: 3000), code:typescript (const DEFAULT_THEME: PresentationTheme = {), code:mermaid (sequenceDiagram), code:block4 (src/), Controller 编排, Step 1 — 扩展类型与 Prompt（P0）, Step 2 — 新增 ImageService（P1） (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): AiService, DEFAULT_THEME, mergeTheme(), normalizeContent(), normalizeLayout(), normalizeSlide(), PresentationContent, PresentationTheme (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (5): ImageService, FALLBACK_PNG, PlaceholderProvider, WanxProvider, WanxTaskResponse

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (6): AiModule, DEFAULT_CONFIG_PATH, loadYamlConfig(), ImageModule, PptModule, AppModule

### Community 5 - "Community 5"
Cohesion: 0.23
Nodes (3): GeneratePptDto, PptController, PptService

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
Cohesion: 0.29
Nodes (7): code:typescript (// src/ai/types/slide-content.ts), code:json ({), code:block7 (Return JSON with this shape:), LLM 输出示例（8 页）, Prompt 改造要点, TypeScript 类型（目标）, 完整 JSON Schema

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): code:block1 (POST /ppt/generate { topic, slideCount }), code:json ({), 差距一览, 当前 JSON 结构, 当前流程, 现状与差距

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (6): code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:bash (# 只测 LLM JSON 输出（临时在 controller 打日志）), 图文并茂验收清单, 开发阶段调试技巧, 当前 API 冒烟（纯文字）, 测试与验收

## Knowledge Gaps
- **52 isolated node(s):** `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG`, `SLIDE_LAYOUTS`, `SlideChart` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `如何生成图文并茂的 PPT` connect `Community 1` to `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `图片服务` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `版式与坐标` connect `Community 8` to `Community 1`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `DEFAULT_CONFIG_PATH`, `WanxTaskResponse`, `FALLBACK_PNG` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._