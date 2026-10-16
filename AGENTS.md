# Antigravity cho dân luật

Trang tĩnh (HTML/CSS/JS thuần, GitHub Pages: https://ph56jk.github.io/antigravity-cho-dan-luat/, remote `pages`, nhánh `main`).

## Cấu trúc
- `index.html` hướng dẫn, `prompts.html` + `prompts.js` thư viện prompt (tải `prompts.json`), `mcp.html` hướng dẫn kết nối MCP.
- `prompts.json` là file SINH RA, không sửa tay. Nguồn: `tools/curated.js` (30 prompt viết tay), `tools/data.js` (danh sách chủ đề), `tools/build-prompts.js` (mẫu prompt theo từng việc).
- `mcp/server.js`: MCP server stdio, Node 18+, không phụ thuộc thư viện. Đọc `prompts.json` đi kèm hoặc cache `~/.prompt-luat/prompts.json`, rồi tự tải bản mới từ trang web. Tools: `search_prompts`, `get_prompt`, `list_categories`; MCP prompts: 30 prompt chọn lọc + `tim-prompt-luat`.

## Lệnh
- Sinh lại thư viện sau khi sửa `tools/*`: `node tools/build-prompts.js`
- Xem trang: `python3 -m http.server 8765` rồi mở http://localhost:8765/prompts.html (mở file trực tiếp sẽ không tải được `prompts.json`).
- Thử MCP: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | PROMPT_LUAT_OFFLINE=1 node mcp/server.js`
- Thử bằng client chính thức: `npx -y @modelcontextprotocol/inspector@2.10.1 --cli node mcp/server.js --method tools/list`

## Quy ước nội dung
- Prompt không ghi cứng số điều luật; luôn bắt AI dẫn căn cứ để người dùng tra lại (hằng `R` trong `curated.js`).
- id prompt phải ổn định (dùng cho link `prompts.html#<id>` và MCP); build sẽ báo lỗi nếu trùng id.
