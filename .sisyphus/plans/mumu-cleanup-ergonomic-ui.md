# MuMuAINovel 占位符替换 + 作者信息清理 + macOS人体工程学UI优化工作计划

## TL;DR

> **Quick Summary**: 在不破坏核心功能（AI去味、文本处理、项目管理）的前提下，完成三件事：赞助配置占位符标准化、原作者/原仓库识别信息清理、阅读与编辑场景的人体工程学与 macOS 质感优化。
>
> **Deliverables**:
> - 赞助内容统一改为 `{sponsor_config}` 配置驱动（保留赞助模块逻辑与路由）
> - 原作者与旧仓库识别信息清理，品牌显示名改为 **喵喵小说家**
> - 更新日志改为你仓库 `zuiyi233/MuMuAINovel` 数据源（分支上下文 `custom/main`）
> - 布局/交互/视觉/适配四维人体工程学优化方案与关键实现点
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves + Final Verification Wave
> **Critical Path**: T1 → T3 → T8 → T13 → T18 → F1-F4

---

## Context

### Original Request
- 替换赞助占位符为 `{sponsor_config}`，保留赞助模块能力
- 全局清理原作者与旧仓库识别信息（xiamuceer-j / old repo URL）
- 基于人体工程学优化 UI（贴合小说阅读与写作场景）

### Interview Summary
**Key Decisions**:
- 品牌展示名改为：**喵喵小说家**
- 项目详情默认子路由保持 `sponsor`
- 更新日志保留，改用你仓库：`https://github.com/zuiyi233/MuMuAINovel/tree/custom/main`
- 赞助配置采用后端配置统一下发策略

**Research Findings（关键命中文件）**:
- `frontend/src/pages/Sponsor.tsx`
- `frontend/src/config/version.ts`
- `frontend/src/services/versionService.ts`
- `frontend/src/services/changelogService.ts`
- `backend/app/api/changelog.py`
- `frontend/src/components/AppFooter.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/ProjectDetail.tsx`
- `README.md`

### Metis Review（已吸收）
- 明确法律与许可证边界：保留 LICENSE 合规信息，不做违规归属删除
- 防止范围蔓延：不做整站设计系统重写，仅改核心阅读/编辑工作流相关界面
- 防止配置风险：所有新增配置均需兜底默认值，避免空配置崩溃

---

## Work Objectives

### Core Objective
将项目从“硬编码赞助与作者仓库标识”迁移到“可配置、可维护、可审计”的信息层，并提升小说阅读与编辑的人体工程学体验，且保持既有功能稳定。

### Concrete Deliverables
- Sponsor 页面与相关入口使用 `{sponsor_config}` 配置模型
- 前后端更新日志数据源切换到 `zuiyi233/MuMuAINovel`
- 全局移除旧作者与旧仓库识别标识（在合规边界内）
- UI 人体工程学优化（布局/交互/视觉/适配）落地到指定页面
- README 与文档改写为中性/当前仓库信息

### Definition of Done
- [x] 全局搜索不再命中旧作者与旧仓库关键串（允许 LICENSE 合规保留项）
- [x] Sponsor 功能可用，且文案/资源由配置提供
- [x] Changelog 与版本提示可拉取新仓库数据或优雅降级
- [x] 关键页面 UI 通过人体工程学验收场景

### Must Have
- 不破坏 AI 去味、文本编辑、项目管理、登录功能
- 默认路由仍为 `sponsor`
- 品牌显示名统一为“喵喵小说家”

### Must NOT Have (Guardrails)
- 不删除赞助模块能力（仅替换占位/配置）
- 不将敏感 token 暴露到前端
- 不进行与任务无关的大规模架构重构
- 不修改 LICENSE 合规性要求的必要声明文件

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — 所有验收为 agent 可执行场景。

### Test Decision
- **Infrastructure exists**: PARTIAL（有 lint/build，缺系统化单测框架）
- **Automated tests**: Tests-after（先实现，后回归）
- **Framework**: 前端 `npm run lint` + `npm run build`；后端接口回归用 `curl` 场景

### QA Policy
- 每个任务至少 1 个 happy-path + 1 个 error/edge 场景
- UI 场景优先 Playwright；API 场景优先 curl；CLI/脚本用 Bash/tmux
- 证据落盘到 `.sisyphus/evidence/task-{N}-*.{png,txt,json}`

---

## Execution Strategy

### Parallel Execution Waves

Wave 1（基础抽离与契约定义）
- T1 配置契约：`sponsor_config` + changelog repo 配置模型
- T2 旧标识清理清单与允许保留白名单（LICENSE）
- T3 前端类型与配置消费接口对齐
- T4 更新日志源策略与降级策略定义
- T5 品牌名替换映射（喵喵小说家）
- T6 UI人体工程学规格基线（布局/交互/视觉/适配）

Wave 2（核心实现，最大并行）
- T7 Sponsor 页面配置化改造（保留布局逻辑）
- T8 Footer/Version 服务清理与新链接接入
- T9 前端 changelogService 改仓库源
- T10 后端 changelog API 改仓库源并加容错
- T11 登录页与关键显示位品牌名替换
- T12 README 身份信息清理与仓库地址替换
- T13 项目内旧标识批量替换与回归修正

Wave 3（人体工程学与macOS质感落地）
- T14 Polish 页面核心工作区人体工程学布局优化
- T15 Sponsor/ProjectDetail 的视觉物理化细节（玻璃材质/0.5px/顶边高光）
- T16 交互反馈与快捷操作标注（44x44、即时反馈、快捷键提示）
- T17 阅读区排版优化（60-80 字符、行高 1.5-1.8）
- T18 响应式适配与窗口自适应验证
- T19 深色模式一致性与对比度修正

Wave 4（联调与回归）
- T20 前后端联调（配置下发、changelog、footer）
- T21 全量字符串与链接审计（denylist + allowlist）
- T22 构建与静态检查回归
- T23 关键用户旅程端到端验收

Wave FINAL（独立并行审查）
- F1 Plan Compliance Audit（oracle）
- F2 Code Quality Review（unspecified-high）
- F3 Real QA Replay（unspecified-high + playwright）
- F4 Scope Fidelity Check（deep）

Critical Path: T1 → T3 → T8 → T13 → T20 → T23 → F1-F4

### Dependency Matrix
- T1: — → T3,T4,T7,T8,T9,T10,T20
- T2: — → T12,T13,T21
- T3: T1 → T7,T8,T9,T11
- T4: T1 → T9,T10,T20
- T5: — → T8,T11,T12,T13
- T6: — → T14,T15,T16,T17,T18,T19
- T7: T1,T3 → T20
- T8: T1,T3,T5 → T20,T21
- T9: T1,T3,T4 → T20,T23
- T10: T1,T4 → T20,T23
- T11: T3,T5 → T21,T23
- T12: T2,T5 → T21
- T13: T2,T5 → T21,T22
- T14: T6 → T23
- T15: T6 → T23
- T16: T6 → T23
- T17: T6 → T23
- T18: T6 → T23
- T19: T6 → T23
- T20: T7,T8,T9,T10 → T23
- T21: T8,T11,T12,T13 → T23
- T22: T13 → T23
- T23: T9,T10,T11,T14,T15,T16,T17,T18,T19,T20,T21,T22 → F1,F2,F3,F4

### Agent Dispatch Summary
- Wave1: T1 `unspecified-high`, T2 `quick`, T3 `quick`, T4 `deep`, T5 `quick`, T6 `visual-engineering`
- Wave2: T7 `visual-engineering`, T8 `quick`, T9 `unspecified-high`, T10 `senior-backend`, T11 `quick`, T12 `writing`, T13 `quick`
- Wave3: T14 `visual-engineering`, T15 `visual-engineering`, T16 `visual-engineering`, T17 `visual-engineering`, T18 `quick`, T19 `visual-engineering`
- Wave4: T20 `unspecified-high`, T21 `quick`, T22 `quick`, T23 `deep`
- Final: F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. 定义 sponsor/changelog 配置契约

  **What to do**:
  - 在后端配置层定义 `sponsor_config`、`changelog_repo_owner`、`changelog_repo_name`、`changelog_repo_branch`、`changelog_repo_url` 字段。
  - 在前后端类型层建立对应契约（避免 any）。
  - 注释写明：`{sponsor_config}` 可在 `config.py` 配置。

  **Must NOT do**:
  - 不引入明文 token 到前端。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `skills/typescript`, `skills/senior-backend`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T3,T4,T7,T8,T9,T10
  - Blocked By: None

  **References**:
  - `backend/app/config.py` - 配置源定义位置。
  - `backend/app/schemas/settings.py` - Settings 响应结构。
  - `frontend/src/types/index.ts` - 前端 Settings 类型。

  **Acceptance Criteria**:
  - [ ] 新配置字段可从后端读取，未配置时有默认值。

  **QA Scenarios**:
  ```
  Scenario: 配置字段可见（happy path）
    Tool: Bash (curl)
    Preconditions: 服务已启动
    Steps:
      1. 调用 GET /api/settings
      2. 断言响应包含新增配置键（或位于 preferences 中的约定结构）
    Expected Result: 返回结构稳定，无500
    Evidence: .sisyphus/evidence/task-1-settings-config.json

  Scenario: 配置缺省回退（edge）
    Tool: Bash (curl)
    Preconditions: 未配置 sponsor/changelog 环境变量
    Steps:
      1. 重启服务后再次请求 /api/settings
      2. 断言字段存在且为默认值
    Expected Result: 页面消费不崩溃
    Evidence: .sisyphus/evidence/task-1-default-fallback.txt
  ```

- [x] 2. 建立“清理白名单/黑名单”基线

  **What to do**:
  - 维护 denylist：`xiamuceer-j`、旧 GitHub URL、旧作者署名文案。
  - 维护 allowlist：LICENSE 必要内容、第三方依赖合法署名。
  - 形成可执行搜索清单供后续任务复用。

  **Must NOT do**:
  - 不把许可证要求的法定内容误删。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T12,T13,T21
  - Blocked By: None

  **References**:
  - `README.md` - 旧仓库与致谢信息集中区。
  - `frontend/src/config/version.ts` - 旧作者与链接定义。

  **Acceptance Criteria**:
  - [ ] 有明确 denylist/allowlist 文档化清单并用于后续验收。

  **QA Scenarios**:
  ```
  Scenario: 黑名单搜索可执行
    Tool: Bash (rg)
    Steps:
      1. 执行 rg 搜索关键串
      2. 保存命中列表
    Expected Result: 命中列表可用于逐项清理
    Evidence: .sisyphus/evidence/task-2-denylist-baseline.txt

  Scenario: 白名单验证
    Tool: Bash (rg)
    Steps:
      1. 对 LICENSE/NOTICE 目录执行同样搜索
      2. 标记为允许保留项
    Expected Result: 不误判合规文件
    Evidence: .sisyphus/evidence/task-2-allowlist.txt
  ```

- [x] 3. 前端 Settings/Config 类型对齐

  **What to do**:
  - 扩展 `frontend/src/types/index.ts` 中 Settings 接口。
  - 保证 version/changelog/sponsor 消费端的类型安全。

  **Must NOT do**:
  - 不使用 `as any` 绕过类型。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/typescript`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T7,T8,T9,T11
  - Blocked By: T1

  **References**:
  - `frontend/src/types/index.ts` - Settings 与 SettingsUpdate 类型。
  - `frontend/src/services/api.ts` - settingsApi 消费入口。

  **Acceptance Criteria**:
  - [ ] `npm run build` 通过且无新增类型错误。

  **QA Scenarios**:
  ```
  Scenario: TypeScript 构建通过
    Tool: Bash
    Steps:
      1. 运行 cd frontend && npm run build
    Expected Result: exit code 0
    Evidence: .sisyphus/evidence/task-3-build.txt

  Scenario: 缺字段容错
    Tool: Playwright
    Steps:
      1. 打开页面并模拟 settings 缺省字段
      2. 观察页面渲染
    Expected Result: 页面不白屏
    Evidence: .sisyphus/evidence/task-3-missing-field.png
  ```

- [x] 4. 更新日志数据源策略与降级策略

  **What to do**:
  - 明确使用 `zuiyi233/MuMuAINovel` 作为 owner/repo。
  - 分支上下文 `custom/main` 作为可配置项。
  - 失败时回退到“暂无更新日志”与非阻塞提示。

  **Must NOT do**:
  - 不依赖旧仓库 owner/repo。

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `skills/senior-backend`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T9,T10,T20
  - Blocked By: T1

  **References**:
  - `frontend/src/services/changelogService.ts` - 前端获取逻辑。
  - `backend/app/api/changelog.py` - 后端代理逻辑。

  **Acceptance Criteria**:
  - [ ] 拉取逻辑仅指向新仓库配置。
  - [ ] API 异常时 UI 有可见错误提示且不崩溃。

  **QA Scenarios**:
  ```
  Scenario: 正常拉取更新日志
    Tool: Bash (curl)
    Steps:
      1. 请求 /api/changelog?page=1&per_page=5
      2. 断言返回 200 + commits 数组
    Expected Result: 正常返回并可渲染
    Evidence: .sisyphus/evidence/task-4-changelog-ok.json

  Scenario: 上游失败降级
    Tool: Bash (curl)
    Steps:
      1. 临时配置错误 owner/repo 后请求 API
      2. 打开前端弹窗观察错误展示
    Expected Result: 错误可见但页面不崩
    Evidence: .sisyphus/evidence/task-4-changelog-fallback.txt
  ```

- [x] 5. 品牌名映射替换（喵喵小说家）

  **What to do**:
  - 将前台展示名从 `MuMuAINovel` 替换为 `喵喵小说家`（仅 UI 展示位）。
  - 保留内部技术标识（如数据库 application_name）不做无关重构。

  **Must NOT do**:
  - 不改动会影响部署脚本的内部标识字段。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T8,T11,T12,T13
  - Blocked By: None

  **References**:
  - `frontend/src/config/version.ts`
  - `frontend/src/pages/Login.tsx`

  **Acceptance Criteria**:
  - [ ] UI显示位品牌名统一为“喵喵小说家”。

  **QA Scenarios**:
  ```
  Scenario: 登录页品牌名
    Tool: Playwright
    Steps: 打开 /login，检查标题/底栏文案
    Expected Result: 出现“喵喵小说家”
    Evidence: .sisyphus/evidence/task-5-login-brand.png

  Scenario: 页脚品牌名
    Tool: Playwright
    Steps: 打开主页，检查 footer
    Expected Result: 不再显示旧品牌名
    Evidence: .sisyphus/evidence/task-5-footer-brand.png
  ```

- [x] 6. 人体工程学基线规格文档化

  **What to do**:
  - 固化四维规则：布局/交互/视觉/适配。
  - 定义可测阈值：44x44 点击区、阅读行宽 60-80 字符、行高 1.5-1.8。

  **Must NOT do**:
  - 不扩展成整站重构。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/ui-ux-pro-max`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1
  - Blocks: T14,T15,T16,T17,T18,T19
  - Blocked By: None

  **References**:
  - `frontend/src/pages/Polish.tsx`
  - `frontend/src/pages/ProjectDetail.tsx`

  **Acceptance Criteria**:
  - [ ] 每项优化有明确数值验收标准。

  **QA Scenarios**:
  ```
  Scenario: 规格可追溯
    Tool: Read
    Steps: 校验计划文档是否包含四维 + 数值阈值
    Expected Result: 覆盖完整
    Evidence: .sisyphus/evidence/task-6-ergonomics-spec.txt

  Scenario: 阈值抽样验证
    Tool: Playwright
    Steps: 检查关键按钮点击尺寸与文本区域宽度
    Expected Result: 满足阈值
    Evidence: .sisyphus/evidence/task-6-threshold.png
  ```

- [x] 7. Sponsor 页面配置化改造

  **What to do**:
  - 将 `Sponsor.tsx` 的硬编码金额、文案、链接替换为 `{sponsor_config}` 驱动。
  - 保留现有交互逻辑（金额卡片、弹窗、二维码展示）。

  **Must NOT do**:
  - 不删除赞助模块与路由。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/react`, `skills/typescript`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T20
  - Blocked By: T1,T3

  **References**:
  - `frontend/src/pages/Sponsor.tsx`

  **Acceptance Criteria**:
  - [ ] sponsor 文案/金额/图片不再硬编码旧内容。
  - [ ] 保留UI布局与交互行为。

  **QA Scenarios**:
  ```
  Scenario: 配置驱动渲染
    Tool: Playwright
    Steps: 注入测试 sponsor_config，打开 sponsor 页面
    Expected Result: 页面渲染测试内容
    Evidence: .sisyphus/evidence/task-7-sponsor-config.png

  Scenario: 配置缺失兜底
    Tool: Playwright
    Steps: 清空 sponsor_config 后打开 sponsor 页面
    Expected Result: 页面可用，无报错
    Evidence: .sisyphus/evidence/task-7-sponsor-fallback.png
  ```

- [x] 8. Footer / Version 信息去旧仓库化

  **What to do**:
  - 清理 footer 中旧作者署名、旧 GitHub 链接。
  - `VERSION_INFO` 改为中性/新仓库配置，保留版本显示能力。

  **Must NOT do**:
  - 不移除版本号显示与更新提示入口。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/typescript`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T20,T21
  - Blocked By: T1,T3,T5

  **References**:
  - `frontend/src/components/AppFooter.tsx`
  - `frontend/src/config/version.ts`
  - `frontend/src/services/versionService.ts`

  **Acceptance Criteria**:
  - [ ] footer 无旧作者信息。
  - [ ] 更新链接指向新仓库或配置值。

  **QA Scenarios**:
  ```
  Scenario: Footer 链接检查
    Tool: Playwright
    Steps: 打开主页，检查 GitHub 链接 href
    Expected Result: 指向 zuiyi233 仓库
    Evidence: .sisyphus/evidence/task-8-footer-link.png

  Scenario: 更新提示回退
    Tool: Playwright
    Steps: 模拟 versionService 失败
    Expected Result: 无崩溃，显示当前版本
    Evidence: .sisyphus/evidence/task-8-version-fallback.png
  ```

- [x] 9. 前端 changelogService 改源

  **What to do**:
  - 取消前端对旧 owner/repo 硬编码。
  - 优先调用后端代理或统一配置来源。

  **Must NOT do**:
  - 不在前端硬编码个人 token。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `skills/typescript`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T20,T23
  - Blocked By: T1,T3,T4

  **References**:
  - `frontend/src/services/changelogService.ts`
  - `frontend/src/components/ChangelogModal.tsx`

  **Acceptance Criteria**:
  - [ ] 前端不再出现旧仓库硬编码字符串。

  **QA Scenarios**:
  ```
  Scenario: 日志弹窗加载
    Tool: Playwright
    Steps: 打开更新日志弹窗
    Expected Result: 数据可加载并分组显示
    Evidence: .sisyphus/evidence/task-9-changelog-modal.png

  Scenario: API失败提示
    Tool: Playwright
    Steps: 拦截 API 返回错误
    Expected Result: 显示错误提示，不白屏
    Evidence: .sisyphus/evidence/task-9-changelog-error.png
  ```

- [x] 10. 后端 changelog API 改源与容错

  **What to do**:
  - `backend/app/api/changelog.py` 使用配置化 owner/repo。
  - 加强上游失败日志与响应细节（保持前端可降级展示）。

  **Must NOT do**:
  - 不移除缓存机制。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `skills/senior-backend`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T20,T23
  - Blocked By: T1,T4

  **References**:
  - `backend/app/api/changelog.py`
  - `backend/app/config.py`

  **Acceptance Criteria**:
  - [ ] API 请求目标为新仓库配置。
  - [ ] 异常时返回可识别错误信息。

  **QA Scenarios**:
  ```
  Scenario: 新仓库提交拉取
    Tool: Bash (curl)
    Steps: 调 /api/changelog
    Expected Result: 返回 commits 数组
    Evidence: .sisyphus/evidence/task-10-api-ok.json

  Scenario: 错仓库配置报错
    Tool: Bash (curl)
    Steps: 配置错误 owner/repo 后调用 API
    Expected Result: 返回 5xx/502 + 详细错误
    Evidence: .sisyphus/evidence/task-10-api-error.txt
  ```

- [x] 11. 登录页与关键品牌展示位改名

  **What to do**:
  - 更新 `Login.tsx` 等关键入口文案为“喵喵小说家”。

  **Must NOT do**:
  - 不改动登录流程与认证逻辑。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/react`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T21,T23
  - Blocked By: T3,T5

  **References**:
  - `frontend/src/pages/Login.tsx`

  **Acceptance Criteria**:
  - [ ] 登录页不再出现旧品牌名。

  **QA Scenarios**:
  ```
  Scenario: 登录品牌文案
    Tool: Playwright
    Steps: 打开登录页，校验文案
    Expected Result: 显示喵喵小说家
    Evidence: .sisyphus/evidence/task-11-login-text.png

  Scenario: 登录功能回归
    Tool: Playwright
    Steps: 执行一次本地登录流程
    Expected Result: 可成功跳转
    Evidence: .sisyphus/evidence/task-11-login-flow.png
  ```

- [x] 12. README 清理与重写

  **What to do**:
  - 移除旧作者/旧仓库链接、旧致谢导向。
  - 替换为当前仓库地址与中性项目说明。

  **Must NOT do**:
  - 不删除 LICENSE 合规引用段落。

  **Recommended Agent Profile**:
  - Category: `writing`
  - Skills: `skills/ai-human-writing`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T21
  - Blocked By: T2,T5

  **References**:
  - `README.md`

  **Acceptance Criteria**:
  - [ ] README 无旧作者/旧仓库信息（allowlist 除外）。

  **QA Scenarios**:
  ```
  Scenario: README 链接检查
    Tool: Bash (rg)
    Steps: 搜索旧 URL
    Expected Result: 0 命中
    Evidence: .sisyphus/evidence/task-12-readme-rg.txt

  Scenario: 快速可读性
    Tool: Read
    Steps: 抽检 README 前 200 行
    Expected Result: 结构完整，安装说明可执行
    Evidence: .sisyphus/evidence/task-12-readme-preview.txt
  ```

- [x] 13. 全局旧标识批量清理

  **What to do**:
  - 执行 denylist 批量替换与人工复核。
  - 对代码中残留旧标识做最小侵入修正。

  **Must NOT do**:
  - 不修改第三方目录与构建产物。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2
  - Blocks: T21,T22
  - Blocked By: T2,T5

  **References**:
  - `frontend/src/**`
  - `backend/app/**`
  - `README.md`

  **Acceptance Criteria**:
  - [ ] denylist 关键串主代码区 0 命中。

  **QA Scenarios**:
  ```
  Scenario: 全局检索
    Tool: Bash (rg)
    Steps: 运行 denylist 检索命令
    Expected Result: 仅允许白名单命中
    Evidence: .sisyphus/evidence/task-13-global-rg.txt

  Scenario: 回归抽样
    Tool: Playwright
    Steps: 抽样打开登录/主页/赞助/设置
    Expected Result: 无旧标识露出
    Evidence: .sisyphus/evidence/task-13-ui-scan.png
  ```

- [x] 14. Polish 页面布局人体工程学优化

  **What to do**:
  - 核心输入/输出区放在视觉重心区。
  - 常用动作（去味/复制）靠近文本区，减少鼠标移动。

  **Must NOT do**:
  - 不改动去味 API 调用逻辑。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/frontend-ui-ux`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Polish.tsx`

  **Acceptance Criteria**:
  - [ ] 主操作区在首屏中上部可见。
  - [ ] 快捷操作与文本区距离明显缩短。

  **QA Scenarios**:
  ```
  Scenario: 首屏可见性
    Tool: Playwright
    Steps: 1366x768 打开页面截图
    Expected Result: 输入区与主按钮首屏可见
    Evidence: .sisyphus/evidence/task-14-layout-desktop.png

  Scenario: 操作路径
    Tool: Playwright
    Steps: 执行输入→去味→复制流程
    Expected Result: 操作连贯，无额外跳转
    Evidence: .sisyphus/evidence/task-14-flow.png
  ```

- [x] 15. macOS 视觉物理化细节落地

  **What to do**:
  - 引入玻璃材质：`backdrop-filter: blur + saturate`。
  - 使用 0.5px hairline、顶边高光、分层阴影。
  - 大表面噪点纹理 opacity ~0.015。

  **Must NOT do**:
  - 不使用厚重 1px 边框替代 hairline。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/ui-ux-pro-max`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Login.tsx`
  - `frontend/src/pages/Sponsor.tsx`

  **Acceptance Criteria**:
  - [ ] 关键浮层容器具备 hairline + 顶边高光 + 双层阴影。

  **QA Scenarios**:
  ```
  Scenario: 玻璃材质检查
    Tool: Playwright
    Steps: 抓取关键卡片样式
    Expected Result: 含 blur/saturate 与半透明背景
    Evidence: .sisyphus/evidence/task-15-glass.png

  Scenario: 暗色模式一致性
    Tool: Playwright
    Steps: 切换暗色主题
    Expected Result: border/shadow 对比合适
    Evidence: .sisyphus/evidence/task-15-dark.png
  ```

- [x] 16. 交互反馈与快捷键提示

  **What to do**:
  - 核心按钮点击区 >= 44x44。
  - 添加即时反馈（颜色/动画）避免重复点击。
  - 为核心操作标注快捷键提示（如 Ctrl+D/ Ctrl+C）。

  **Must NOT do**:
  - 不添加与浏览器默认冲突的全局快捷键劫持。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/react`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Polish.tsx`

  **Acceptance Criteria**:
  - [ ] 主按钮尺寸符合阈值。
  - [ ] 有可见的按压/加载反馈。

  **QA Scenarios**:
  ```
  Scenario: 按钮尺寸
    Tool: Playwright
    Steps: 读取按钮 bounding box
    Expected Result: >= 44x44
    Evidence: .sisyphus/evidence/task-16-hitbox.txt

  Scenario: 快捷键提示可见
    Tool: Playwright
    Steps: 检查按钮旁提示文案
    Expected Result: 显示对应快捷键
    Evidence: .sisyphus/evidence/task-16-shortcuts.png
  ```

- [x] 17. 阅读排版优化（60-80字符）

  **What to do**:
  - 文本区控制阅读宽度（约 60-80 字符）。
  - 行高调至 1.5-1.8，默认字体 16px 可配置。

  **Must NOT do**:
  - 不让行宽无限拉伸。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/frontend-ui-ux`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Polish.tsx`

  **Acceptance Criteria**:
  - [ ] 长文本阅读时无明显疲劳性超宽布局。

  **QA Scenarios**:
  ```
  Scenario: 行宽与行高
    Tool: Playwright
    Steps: 注入长文本并读取容器计算样式
    Expected Result: 宽度和行高在目标区间
    Evidence: .sisyphus/evidence/task-17-typography.txt

  Scenario: 手机端阅读
    Tool: Playwright
    Steps: iPhone 尺寸截图
    Expected Result: 文本区不溢出
    Evidence: .sisyphus/evidence/task-17-mobile.png
  ```

- [x] 18. 响应式与窗口自适应

  **What to do**:
  - 保证窗口缩放时核心功能区始终可见。
  - 小屏下按钮布局与文本区自适应。

  **Must NOT do**:
  - 不引入固定宽高导致裁切。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/frontend-ui-ux`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Polish.tsx`
  - `frontend/src/pages/Sponsor.tsx`

  **Acceptance Criteria**:
  - [ ] 375/768/1440 断点均无关键功能缺失。

  **QA Scenarios**:
  ```
  Scenario: 多断点可视化
    Tool: Playwright
    Steps: 三个断点截图
    Expected Result: 主功能都可见
    Evidence: .sisyphus/evidence/task-18-breakpoints.png

  Scenario: 窗口缩放
    Tool: Playwright
    Steps: 动态缩放 viewport
    Expected Result: 无布局错位
    Evidence: .sisyphus/evidence/task-18-resize.gif
  ```

- [x] 19. 深色模式与对比度修正

  **What to do**:
  - 确保 `dark:` 主题下文本可读性与层次一致。
  - 修正按钮/边框在暗色背景下的对比度。

  **Must NOT do**:
  - 不用极端高饱和颜色破坏阅读体验。

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `skills/ui-ux-pro-max`

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3
  - Blocks: T23
  - Blocked By: T6

  **References**:
  - `frontend/src/pages/Login.tsx`
  - `frontend/src/pages/Polish.tsx`

  **Acceptance Criteria**:
  - [ ] 暗色模式关键页面文本与控件可读。

  **QA Scenarios**:
  ```
  Scenario: 暗色对比检查
    Tool: Playwright
    Steps: 切暗色并截图
    Expected Result: 文本对比充足
    Evidence: .sisyphus/evidence/task-19-dark-contrast.png

  Scenario: 明暗切换稳定
    Tool: Playwright
    Steps: 连续切换主题
    Expected Result: 无闪烁/样式错乱
    Evidence: .sisyphus/evidence/task-19-theme-toggle.gif
  ```

- [x] 20. 前后端联调（配置/日志/页脚）

  **What to do**:
  - 验证 sponsor_config 从后端到前端链路。
  - 验证 changelog 与 footer 链接配置链路。

  **Must NOT do**:
  - 不忽略跨层字段命名不一致问题。

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 4
  - Blocks: T23
  - Blocked By: T7,T8,T9,T10

  **References**:
  - `backend/app/api/changelog.py`
  - `frontend/src/components/AppFooter.tsx`
  - `frontend/src/pages/Sponsor.tsx`

  **Acceptance Criteria**:
  - [ ] 三条链路联调通过。

  **QA Scenarios**:
  ```
  Scenario: sponsor_config链路
    Tool: Playwright + curl
    Steps: 后端返回配置，前端页面渲染
    Expected Result: 前端显示一致
    Evidence: .sisyphus/evidence/task-20-sponsor-e2e.png

  Scenario: changelog链路
    Tool: Playwright + curl
    Steps: 打开日志弹窗并核对API响应
    Expected Result: 内容一致
    Evidence: .sisyphus/evidence/task-20-changelog-e2e.txt
  ```

- [x] 21. 全量字符串与链接审计

  **What to do**:
  - 对 denylist 做 repo 全量扫描。
  - 对外链做有效性抽样检查。

  **Must NOT do**:
  - 不将白名单合法内容当作问题阻塞。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 4
  - Blocks: T23
  - Blocked By: T8,T11,T12,T13

  **References**:
  - `README.md`
  - `frontend/src/**`
  - `backend/app/**`

  **Acceptance Criteria**:
  - [ ] denylist 仅白名单命中。

  **QA Scenarios**:
  ```
  Scenario: 全仓搜索
    Tool: Bash (rg)
    Steps: 执行审计搜索命令
    Expected Result: 无异常命中
    Evidence: .sisyphus/evidence/task-21-rg-audit.txt

  Scenario: 外链抽样
    Tool: Bash (curl)
    Steps: 对关键链接执行 HEAD 请求
    Expected Result: 返回 2xx/3xx
    Evidence: .sisyphus/evidence/task-21-link-check.txt
  ```

- [x] 22. 构建与静态检查回归

  **What to do**:
  - 前端执行 lint/build。
  - 后端做语法与关键接口 smoke test。

  **Must NOT do**:
  - 不跳过失败项直接宣告完成。

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: `skills/code-reviewer`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 4
  - Blocks: T23
  - Blocked By: T13

  **References**:
  - `frontend/package.json`
  - `backend/app/main.py`

  **Acceptance Criteria**:
  - [ ] lint/build 成功或问题已修复。

  **QA Scenarios**:
  ```
  Scenario: 前端构建
    Tool: Bash
    Steps: cd frontend && npm run lint && npm run build
    Expected Result: 命令成功
    Evidence: .sisyphus/evidence/task-22-frontend-build.txt

  Scenario: 后端接口冒烟
    Tool: Bash (curl)
    Steps: 请求 /api/changelog 与 /api/settings
    Expected Result: 返回有效JSON
    Evidence: .sisyphus/evidence/task-22-backend-smoke.json
  ```

- [x] 23. 关键用户旅程端到端验收

  **What to do**:
  - 覆盖登录→项目页→sponsor→AI去味→更新日志→设置 的主路径。
  - 检查所有改动点在真实流程中可用。

  **Must NOT do**:
  - 不只测单页快照而忽略跨页面状态。

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: `playwright`

  **Parallelization**:
  - Can Run In Parallel: NO
  - Parallel Group: Wave 4
  - Blocks: F1,F2,F3,F4
  - Blocked By: T9,T10,T11,T14,T15,T16,T17,T18,T19,T20,T21,T22

  **References**:
  - `frontend/src/App.tsx`
  - `frontend/src/pages/ProjectDetail.tsx`
  - `frontend/src/pages/Polish.tsx`

  **Acceptance Criteria**:
  - [ ] 主路径全通过，且无旧标识残留。

  **QA Scenarios**:
  ```
  Scenario: 主流程回放
    Tool: Playwright
    Steps: 按主路径完整执行
    Expected Result: 全流程无阻塞
    Evidence: .sisyphus/evidence/task-23-e2e-flow.mp4

  Scenario: 回归随机抽样
    Tool: Playwright
    Steps: 随机跳转5个页面检查
    Expected Result: 无明显UI/文案回归
    Evidence: .sisyphus/evidence/task-23-random-scan.png
  ```

---

## Final Verification Wave (MANDATORY)

- [x] F1. **Plan Compliance Audit** — `oracle`
  - 对照 Must Have / Must NOT Have 逐项核验，检查 evidence 文件齐全。

- [x] F2. **Code Quality Review** — `unspecified-high`
  - 运行 lint/build，审查无效链接、残留旧标识、风险注释。

- [x] F3. **Real Manual QA Replay** — `unspecified-high` (+ `playwright`)
  - 执行所有任务定义场景并收集证据。

- [x] F4. **Scope Fidelity Check** — `deep`
  - 校验无范围蔓延，无越界改动。

---

## Commit Strategy
- 建议按波次分组提交：Wave1 基础契约、Wave2 功能改造、Wave3 UI优化、Wave4 回归修复。
- 提交格式：`type(scope): description`

---

## Success Criteria

### Verification Commands
```bash
# Frontend
cd frontend && npm run lint && npm run build

# Backend basic health (example)
curl -sS http://localhost:8000/api/changelog?page=1&per_page=5
```

### Final Checklist
- [x] 全量旧作者/旧仓库标识清理完成（allowlist 例外除外）
- [x] `{sponsor_config}` 配置化完成并有注释指引
- [x] 更新日志改源完成并可用/可降级
- [x] 人体工程学优化通过场景验收
- [x] 构建与回归检查通过
