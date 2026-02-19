# Learnings

- For this repo, enforce minimal diffs by reverting target files first, then applying atomic contract changes only.
- Runtime config contract is best exposed via `/api/settings/runtime-config` to avoid touching persisted user settings schema.

## 2026-02-18 Task 1 runtime config contract
- Runtime config backend contract already existed (`/settings/runtime-config` + `AppRuntimeConfigResponse` + config defaults), so this task only needed frontend type wiring and API exposure.
- Added `AppRuntimeConfig` in `frontend/src/types/index.ts` and `settingsApi.getRuntimeConfig()` in `frontend/src/services/api.ts` to consume the existing backend endpoint via `/api/settings/runtime-config`.

## 2026-02-18 Task 2 清理基线
- 建立 denylist/allowlist 时，需要避免把 `author_name/author_display_name` 这类业务字段误判为作者署名残留。
- `README.md` 与 `version/changelog/footer/login` 是当前旧仓库标识的主要清理热点。

## 2026-02-19 changelog.py config-driven repo
- Replaced hardcoded `REPO_OWNER = "xiamuceer-j"` / `REPO_NAME = "MuMuAINovel"` with config-driven values from `app.config.settings`.
- Uses `settings.changelog_repo_owner`, `settings.changelog_repo_name`, and `settings.changelog_repo_branch` (as sha param when set).
- Added validation with clear 500 error if config missing.
- Kept same endpoint shape and cache behavior.

## 2026-02-19 Task 5 品牌名映射
- Frontend brand-display mapping started from `frontend/src/config/version.ts` and `frontend/src/pages/Login.tsx`, replacing visible `MuMuAINovel` labels with `喵喵小说家`.
- Build remains green after brand string updates, so mapping can continue incrementally in later tasks (Footer/Sponsor remain pending by plan).

## 2026-02-19 Tasks 7-11 执行结果
- Sponsor 页面已切换为 `settingsApi.getRuntimeConfig().sponsor_config` 配置驱动，默认回退到本地安全配置，并保留原有交互结构。
- Footer/Version 已改为新仓库链接与中性展示（移除 `by {VERSION_INFO.author}` 形式）。
- changelog 前后端均已改为新数据源链路：前端走 `/api/changelog`，后端从配置读取 owner/repo/branch。
- 为满足注释规范，删除了 Sponsor 新增的非必要注释，改用命名与逻辑自解释。

## 2026-02-19 Tasks 12-13 文档与全局清理
- `README.md` 已替换旧仓库地址并移除旧仓库贡献者/Star History/repobeats 区块，保留许可证合规说明。
- 对 `xiamuceer-j` 与旧仓库 URL 的全仓扫描已归零（业务代码与文档范围）。

## 2026-02-19 Tasks 14/16/17/18 Polish 人体工程学优化
- 主工作区改为上方快捷操作 + 下方双列编辑布局，核心按钮在视觉重心区首屏可达。
- 核心按钮统一 `minHeight: 44`，并补充快捷键提示与键盘触发（Ctrl+D 去味，Ctrl+C 复制）。
- 阅读区文本宽度控制在 `78ch`，行高设置到 `1.65/1.7`，并开启平滑滚动。
- 通过 `Grid.useBreakpoint` 实现移动端与桌面端间距/行数自适应。

## 2026-02-19 Tasks 20/21/22 联调与审计
- 使用项目 `backend/venv/Scripts/python.exe -m uvicorn` 启动服务后，`/api/settings/runtime-config` 与 `/api/changelog` 均返回 200。
- runtime-config 返回了预期字段：`app_display_name/sponsor_config/changelog_repo_*`。
- 前端全量 build 多次通过，旧作者与旧仓库关键串在代码与 README 范围内扫描为 0 命中。

## 2026-02-19 Task 19 深色对比修正
- Sponsor 页面将浅色硬编码文字色（`#666/#999`）改为主题变量（`--color-text-secondary/tertiary`），避免暗色模式下对比不足。
- 同时将浅色描边值替换为主题边框变量，减少暗色背景可读性风险。
