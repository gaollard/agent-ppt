curl -X POST http://localhost:3000/ppt/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"大模型 Agent 开发入门","slideCount":30}' \
  -o nestjs-intro.pptx