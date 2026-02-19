# Draft: MuMuAINovel 占位符替换 + 作者信息清理 + UI人体工程学优化

## Requirements (confirmed)
- 目标1：替换项目中的「赞助/打赏/捐赠」占位符为 `{sponsor_config}`，并保留赞助模块逻辑与UI布局。
- 目标2：移除原作者与原仓库标识信息（作者名、仓库地址、致谢/介绍/更新日志中的原项目识别信息）。
- 目标3：在不破坏运行的前提下完成修改，并输出按文件分类的修改代码片段与修改清单。
- 目标4：基于人体工程学优化UI，且风格遵循 macOS Sequoia/Sonoma 质感（玻璃材质、层次光影、动画物理感）。
- 品牌命名：前台展示名统一改为 **喵喵小说家**（替代 MuMuAINovel）。

## Technical Decisions
- 当前阶段采用“先全量检索→再收敛范围→再生成执行计划”的策略。
- 优先聚焦源码目录（frontend/src、backend/app、README.md），排除 node_modules / venv / .git / build产物。
- Sponsor 页面预计保留路由与功能入口，不做功能删除，仅做内容占位与配置化替换。
- 更新日志策略：**保留功能并改为可配置数据源**（不再硬编码原作者仓库）。
- 赞助配置策略：**后端 `config.py` 统一配置 sponsor_config，并下发前端使用**。
- 测试策略：**实现后补测**（非TDD），但每个任务保留可执行QA场景。
- 导航策略：项目详情页默认子路由 **保持 sponsor**（不切换到 chapters/world-setting）。

## Research Findings
- 已发现高风险命中点（示例）：
  - `frontend/src/pages/Sponsor.tsx`：含赞助文案与项目名称绑定。
  - `frontend/src/config/version.ts`：含 `githubUrl` 与 `author` 明文。
  - `frontend/src/services/versionService.ts`：release badge/release URL 绑定原仓库。
  - `frontend/src/services/changelogService.ts` 与 `backend/app/api/changelog.py`：REPO_OWNER/REPO_NAME 绑定原作者仓库。
  - `frontend/src/components/AppFooter.tsx`：显示 `by {VERSION_INFO.author}`。
  - `README.md`：大量原仓库URL、贡献者、致谢、星标历史等内容。
- 外部UI研究结果（librarian）已回收：
  - macOS化Web实现关键：分层半透明材质、0.5px hairline、顶边高光、受控阴影深度、layoutId 分段控件动画。
  - 阅读型编辑场景建议：正文 65-80ch、15-17px、1.55-1.75行高、降低高频动态干扰。

## Scope Boundaries
- INCLUDE:
  - 业务源码中与赞助占位符、原作者标识、原仓库链接相关内容。
  - About/设置/README/更新日志入口等“非核心功能性身份信息”。
  - UI人体工程学方案（布局/交互/视觉/适配）与关键样式实现建议。
- EXCLUDE:
  - 第三方依赖与生成文件（`node_modules/`, `backend/venv/`, `.git/`, `backend/static/assets/`）。
  - 核心功能逻辑（AI去味、文本处理、编辑器核心流程）的大改。

## Open Questions
- 是否保留 `MuMuAINovel` 作为产品显示名（仅品牌名）？还是统一替换为中性名称（如“AI 小说创作助手”）以满足“移除原项目信息”的要求。
- 项目详情页当前默认子路由为 `sponsor`：是否切换到更符合人体工程学的核心工作区（如 `chapters` 或 `world-setting`）。

## Resolved Decisions
- 品牌名替换：已确认改为 **喵喵小说家**。
- 默认子路由：已确认 **保持 sponsor 默认**。
- 更新日志数据源：已确认使用你的仓库 `https://github.com/zuiyi233/MuMuAINovel/tree/custom/main`。
  - 解析为仓库 owner/repo：`zuiyi233/MuMuAINovel`
  - 分支上下文：`custom/main`（在计划中按“可配置分支”处理，避免硬编码到旧仓库）

## Remaining Blocking Question
- 无（关键阻塞项已全部确认，可进入计划生成）

## Test Strategy Decision
- **Infrastructure exists**: YES（前后端均有可扩展测试入口与脚本体系，可在后续计划中补齐针对改动的回归测试）
- **Automated tests**: YES（实现后补测）
- **Agent-Executed QA**: ALWAYS（每个任务附带可执行的UI/API/回归场景）
