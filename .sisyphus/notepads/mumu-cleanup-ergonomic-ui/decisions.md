# Decisions

## Task 2 - 清理白名单/黑名单基线

- denylist（需要逐步清理）
  - `xiamuceer-j`
  - `github.com/xiamuceer-j/MuMuAINovel`
  - `contrib.rocks/image?repo=xiamuceer-j/MuMuAINovel`
  - `star-history.com/#xiamuceer-j/MuMuAINovel`
  - `by {VERSION_INFO.author}`
  - `MuMuAINovel ·`（仅品牌展示位）

- allowlist（合规保留）
  - `LICENSE` 文件中的 GPL 标准版权与许可证文本
  - 业务域中 `author_*` 数据字段（提示词工坊作者数据，不属于原作者署名）

- 审计策略
  - 优先清理：`README.md`、`frontend/src/config/version.ts`、`frontend/src/services/versionService.ts`、`frontend/src/services/changelogService.ts`、`backend/app/api/changelog.py`、`frontend/src/components/AppFooter.tsx`、`frontend/src/pages/Login.tsx`。
  - 清理后再次执行全仓匹配，仅允许 allowlist 命中。

## Task 6 - 人体工程学基线规格（布局/交互/视觉/适配）

- 布局阈值
  - 核心操作区位于首屏中上区域（1366x768 下无需滚动即可触达主要按钮与输入区）。
  - 常用操作按钮与主文本区保持近邻布局，避免跨屏移动。

- 交互阈值
  - 关键按钮点击热区 >= 44x44 px。
  - 主操作必须具备即时视觉反馈（按压/加载态）。
  - 核心快捷键在按钮旁有可见提示。

- 视觉阈值
  - 阅读区行宽约 60-80 字符。
  - 行高 1.5-1.8，默认字体尺寸 16px（可配置）。
  - 维持低饱和对比和足量留白（模块间距 >= 16px）。

- 适配阈值
  - 至少覆盖 375 / 768 / 1440 三个断点。
  - 窗口缩放时核心功能区始终可见，不出现主操作丢失。
