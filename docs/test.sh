curl -sS -D - -o /dev/null \
  -X POST http://localhost:3000/ppt/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"NestJS 入门","slideCount":20}'