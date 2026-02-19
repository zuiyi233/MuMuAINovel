# Issues

- Task 1 initially suffered scope creep from whole-file formatting churn in `api/settings.py` and `services/api.ts`; fixed by reverting and reapplying minimal contract-only diffs.
- Hands-on API QA requires project venv interpreter (`backend/venv/Scripts/python.exe`); system `python3` lacks uvicorn.
- No browser runtime was available for Playwright hands-on checks in this pass; user-facing verification is currently build + static/lsp level.
- LSP reported a transient stale hint after Card body style refactor in Polish page; final code uses `styles.body`, and build is green.
- Task 23/F3 browser replay is blocked in this environment: Playwright MCP expects `/opt/google/chrome/chrome`, while available browser binaries miss required system libs (`libnspr4.so`, `libnss3.so`, `libasound.so.2`, `libwebkitgtk-6.0.so.4`) and cannot be installed without elevated system setup.
- QA验收 Task 23 (2026-02-19 13:47:13): 后端用 `backend/venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000` 成功启动，`/health`=200；`/api/settings/runtime-config`=200 且包含 `app_display_name=喵喵小说家`；`/api/changelog`=200 返回 `commits:[]`（对应前端 Empty 文案“暂无更新日志”回退状态）。Playwright UI实测受阻：MCP要求 Chrome 位于 `/opt/google/chrome/chrome`，当前环境安装需 sudo 密码（不可交互），因此执行了 API+源码回退校验（Login 含品牌文案“喵喵小说家 · AI 驱动的智能小说创作平台”；Sponsor 页面含“赞助专属权益/选择金额”卡片结构；Polish 页面输入框与“开始去味 (Ctrl+D)”触发按钮存在）。
