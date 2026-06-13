# Graph Report - smart-ppt  (2026-06-13)

## Corpus Check
- 76 files · ~31,784 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 673 nodes · 1905 edges · 33 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0661a94`
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
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `PresentationTheme` - 38 edges
2. `SlideElement` - 27 edges
3. `ElementStyle` - 25 edges
4. `SlideContent` - 22 edges
5. `LayoutContext` - 18 edges
6. `PresentationContent` - 18 edges
7. `如何生成图文并茂的 PPT` - 18 edges
8. `addBullets()` - 17 edges
9. `isLineLikeShape()` - 17 edges
10. `AiService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `clientToCanvasPct()` --calls--> `clamp()`  [EXTRACTED]
  client/src/components/FreeformCanvas/FreeformCanvas.tsx → /Users/xiong.gao/Desktop/smart-ppt/client/src/utils/slide-elements.ts
- `rectFromDrag()` --calls--> `clamp()`  [EXTRACTED]
  client/src/components/FreeformCanvas/FreeformCanvas.tsx → /Users/xiong.gao/Desktop/smart-ppt/client/src/utils/slide-elements.ts
- `renderFreeform()` --calls--> `addBullets()`  [EXTRACTED]
  api/src/ppt/layouts/freeform.layout.ts → /Users/xiong.gao/Desktop/smart-ppt/api/src/ppt/layouts/helpers.ts
- `renderSlide()` --calls--> `renderFreeform()`  [EXTRACTED]
  /Users/xiong.gao/Desktop/smart-ppt/api/src/ppt/layouts/index.ts → api/src/ppt/layouts/freeform.layout.ts
- `App()` --calls--> `restoreDraftOnMount()`  [EXTRACTED]
  client/src/App.tsx → /Users/xiong.gao/Desktop/smart-ppt/client/src/hooks/useLocalDraft.ts

## Communities (33 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (61): GeneratePptDto, ChartDto, ColumnDto, ElementStyleDto, PresentationContentDto, RichTextContentDto, SlideDto, SlideElementDto (+53 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (73): applyElementInsets(), applyTextAutoHeights(), clampElementPosition(), clampElementSize(), clientToCanvasPct(), elementsNeedInsetCorrection(), elementTransform(), escapeMeasureHtml() (+65 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (58): downloadBlob(), exportPptx(), generateContent(), EditorSidebar(), PanelTab, Props, FreeformCanvas, FreeformCanvasHandle (+50 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (39): ElementInspector(), Props, Props, ShapeToolbar(), Props, TextToolbar(), GeneratePanel(), Props (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (11): AiModule, AiService, DEFAULT_CONFIG_PATH, loadYamlConfig(), ImageModule, ImageService, PptModule, FALLBACK_PNG (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (14): ContextMenuDivider(), ContextMenuIconBtn(), ContextMenuItem(), ContextMenuShell(), ContextMenuShellProps, ContextMenuSub(), ContextMenuSubItem(), stopMenuEvent() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (21): FONT_FAMILIES, FONT_SIZES, Props, TableToolbar(), ToolBtn(), TableCellStyle, TableData, applyHeaderRow() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (23): applySelectionFormat(), colorToHex(), cssFromElement(), escapeHtml(), getActiveEditor(), hasRichInlineText(), hasTextSelection(), InlineFormatPatch (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (6): createFileLogger(), FileLogger, LogLevel, resolveLogDir(), AppModule, bootstrap()

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (20): DEFAULT_THEME, TableCellData, defaultShapeStyle(), applySlideLayout(), cloneSlide(), createImageElement(), createShapeElement(), createTableCells() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (19): 1. 用户输入要求, 2. LLM 生成大纲, 3. 对每一个章节补充详细内容, 4. PPT 润色 + 图片补充, 4a 全文润色, 4b 图片补充, 4c 渲染 pptx, code:block1 (用户输入 → LLM 生成大纲 → 逐页补充详细内容 → 全文润色 → 图片补充 → 渲染 pptx) (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (16): Border 字段（通用）, code:json ({), Fill 字段映射（按类型）, Font 字段（文本 / 表格）, 图片（`image`）, 形状（`shape`）, 待完善, 按类型的样式配置 (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (11): effectiveLayout(), hexColor(), themeVars(), EditableBullets(), EditableBulletsProps, EditableText(), EditableTextProps, ChartPreview() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (13): code:typescript (@Post('generate')), code:yaml (PORT: 3000), code:typescript (const DEFAULT_THEME: PresentationTheme = {), Controller 编排, 参考链接, 如何生成图文并茂的 PPT, 实施路线图, 常见问题 (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (10): API, code:bash (npm install), code:json ({), code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:block4 (src/), ppt-agent, 功能, 快速开始 (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (11): code:yaml (image_provider: wanx          # wanx | unsplash | placeholde), code:typescript (// 推荐：本地路径（ImageService 下载后）), code:typescript (// 上传后得到 https://tx-res-01.oss-cn-guangzhou.aliyuncs.com/pro), code:typescript (// src/image/image.service.ts), code:block9 (POST /api/v1/services/aigc/text2image/image-synthesis), ImageService 接口（推荐）, OSS 上传（可选）, pptxgenjs 嵌入方式 (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.2
Nodes (10): code:block13 (cover                 image-right              two-column), code:typescript (// src/ppt/layouts/index.ts), code:typescript (export function renderImageRight({ slide, page, theme }: Lay), code:typescript (page.addImage({ path: slide.imagePath, x: 0, y: 0, w: 10, h:), full-image 半透明遮罩, image-right 示例, layout 调度（推荐）, 坐标表 (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.2
Nodes (8): code:mermaid (flowchart LR), code:bash (curl -X POST http://localhost:3000/ppt/generate \), 代价与注意, 内容不够丰富, 方案（已实现）, 根因, 现象, 验证

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (7): code:bash (cd client), code:bash (pnpm build), Smart PPT Client, 前置条件, 功能, 开发, 构建

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (7): code:typescript (// src/ai/types/slide-content.ts), code:json ({), code:block7 (Return JSON with this shape:), LLM 输出示例（8 页）, Prompt 改造要点, TypeScript 类型（目标）, 完整 JSON Schema

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): code:bash (curl -X POST http://localhost:3000/ppt/generate \), code:bash (# 只测 LLM JSON 输出（临时在 controller 打日志）), 图文并茂验收清单, 开发阶段调试技巧, 当前 API 冒烟（纯文字）, 测试与验收

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (6): Step 1 — 扩展类型与 Prompt（P0）, Step 2 — 新增 ImageService（P1）, Step 3 — 拆分 layout 渲染（P2）, Step 4 — 串联 Controller（P2）, Step 5 — 主题色与图表（P3）, 改造步骤

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (6): code:block1 (POST /ppt/generate { topic, slideCount }), code:json ({), 差距一览, 当前 JSON 结构, 当前流程, 现状与差距

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (3): code:mermaid (sequenceDiagram), code:block4 (src/), 目标架构

## Knowledge Gaps
- **94 isolated node(s):** `RichTextContent`, `TextRunStyleDto`, `TextRunDto`, `RichTextContentDto`, `TextRunStyle` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolve()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.274) - this node is a cross-community bridge._
- **Why does `PptService` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Why does `SlideElement` connect `Community 3` to `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `RichTextContent`, `TextRunStyleDto`, `TextRunDto` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._