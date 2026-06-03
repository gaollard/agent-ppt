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

- **AI 生成**：调用后端生成 JSON 内容与配图
- **自由画布编辑**：拖拽、缩放、旋转、对齐、锁定元素
- **元素类型**：文本框、图片、矩形、椭圆
- **撤销/重做**：⌘Z / ⌘⇧Z
- **复制粘贴**：⌘C / ⌘V / ⌘D 快速复制元素
- **演示模式**：全屏放映，方向键翻页
- **本地草稿**：自动保存到 localStorage
- **导出 PPTX**：保留自由布局

## 构建

```bash
pnpm build
pnpm preview
```
