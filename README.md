# ppt-agent

基于 NestJS 的 AI 演示文稿生成 API：输入主题与页数，调用大模型生成结构化内容，再用 pptxgenjs 输出 `.pptx` 文件。

## 功能

- **AI 内容生成**：通过 OpenAI 兼容接口（OpenAI、Mistral、DeepSeek 等）生成标题与要点
- **PPT 生成**：解析 JSON 结构，逐页渲染封面与内容页，返回文件流

## 快速开始

```bash
npm install
cp config.example.yaml dev.config.yaml
# 编辑 dev.config.yaml，填入 LLM_API_KEY 或 llm_token
npm run start:dev
```

可通过环境变量 `CONFIG_PATH` 指定其它配置文件路径。

## API

`POST /ppt/generate`

```json
{
  "topic": "2025 年人工智能发展趋势",
  "slideCount": 8
}
```

响应为 `application/vnd.openxmlformats-officedocument.presentationml.presentation` 附件。

示例：

```bash
curl -X POST http://localhost:3000/ppt/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"NestJS 入门","slideCount":6}' \
  --output nestjs-intro.pptx
```

## 配置（YAML）

默认读取项目根目录 `dev.config.yaml`，模板见 `config.example.yaml`。

| 键 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `LLM_API_KEY` / `llm_token` | API 密钥 | 必填其一 |
| `LLM_BASE_URL` / `llm_url` | API 基础地址 | `https://api.openai.com/v1` |
| `LLM_MODEL` / `llm_model` | 模型名称 | `gpt-4o-mini` |

嵌套配置（如 `mysql.host`、`redis.port`）可通过 `ConfigService.get('mysql.host')` 读取。

## 项目结构

```
src/
├── config/      # YAML 配置加载
├── ai/          # 大模型调用与 Prompt
├── ppt/         # 幻灯片渲染与 HTTP 接口
├── app.module.ts
└── main.ts
```
