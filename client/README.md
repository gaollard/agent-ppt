# Smart PPT Client

React 客户端：AI 生成、幻灯片预览与编辑、导出 PPTX。

## 前置条件

后端 API 需在 `http://localhost:3000` 运行（见 `../api`）。

## 开发

```bash
cd client
pnpm install
pnpm dev
```

浏览器打开 http://localhost:5173。Vite 会将 `/ppt/*` 代理到后端。

## 功能

- **AI 生成**：调用 `POST /ppt/generate-content` 获取 JSON 内容与配图
- **预览**：按后端 layout 渲染封面、要点、图文、双栏、图表等版式
- **编辑**：修改标题、版式、要点、图片、图表数据；增删与排序幻灯片
- **导出**：调用 `POST /ppt/export` 下载 `.pptx`

## 构建

```bash
pnpm build
pnpm preview
```
