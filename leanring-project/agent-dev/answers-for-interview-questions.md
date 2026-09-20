# Agent 与普通 Chatbot、传统规则系统分别有什么区别？

## 三者对比

| 维度 | 传统规则系统 | 普通 Chatbot | Agent |
|---|---|---|---|
| **决策方式** | 人显式编写 if-else/规则 | LLM 隐式生成，模式匹配 | LLM 作为推理引擎，自主规划决策 |
| **交互模式** | 触发→执行固定逻辑 | 一问一答，被动响应 | 目标驱动，主动发起多步行动 |
| **环境交互** | 读写固定数据/接口 | 无，只输出文本 | 调用工具、操作环境、观察反馈并调整 |
| **处理未知情况** | 规则没覆盖就失败 | 能回答但可能胡编 | 能拆解、尝试、失败重试换路径 |
| **状态与记忆** | 显式状态机 | 会话级上下文 | 可跨步骤/跨会话维护任务状态 |
| **典型形态** | 专家系统、审批流、风控规则 | 客服问答、陪聊 | Claude Code、AutoGPT、Manus |

# Agent、Workflow 和 Tool 的决策权分别掌握在谁手中？

## 核心结论

决策权沿着 Tool → Workflow → Agent 逐步从开发者/代码让渡给 LLM：

- **Tool**：工具本身没有决策权，决策权在调用方（代码或 LLM）
- **Workflow**：决策权在开发者——路径由代码预先编排
- **Agent**：决策权在 LLM——模型动态指挥自己的流程和工具调用

## 真实系统多是混合体

- Claude Code 是 agent，但权限确认是硬编码的 workflow 式护栏
- RAG 固定检索一次是 workflow，模型自主决定是否多轮检索就成了 agentic RAG

# 什么情况下应该使用 Agent，什么情况下固定 Workflow 更合适？

## 核心判据

**步骤能否预先确定。** 能预先枚举、追求稳定可控 → Workflow；步骤不可预知、需要模型根据中间结果自主决策 → Agent。

| 维度 | Workflow | Agent |
|---|---|---|
| **任务特征** | 步骤可枚举、路径可预测 | 开放性问题，步数和路径不可预知 |
| **可靠性要求** | 高：可复现、可调试、可审计 | 接受不确定性，靠 eval 和护栏兜底 |
| **成本/延迟** | 低且可控 | 用成本和延迟换开放性任务上的效果 |
| **典型例子** | 翻译→润色、分类路由、固定格式报告 | Coding agent、Deep Research、Computer Use |

## 选 Workflow 的信号

- 任务可分解、路径可提前写死
- 金融、合规、生产批处理等对一致性/可审计性要求高的场景
- 对成本和延迟敏感

## 选 Agent 的信号

- 步骤数不可预知，必须根据中间结果决定下一步
- 环境会反馈，需要迭代（写代码→跑测试→修 bug）
- 信任模型的决策，且有工具和反馈回路支撑

## 原则

Anthropic「Building Effective Agents」的核心建议：**找能工作的最简单方案**。Agent 是用 latency 和成本换开放性任务的表现，Workflow 能解决的不要上 Agent。

# 什么情况下应选择单 Agent，什么情况下值得拆成多 Agent？

## 核心判据

默认单 Agent（主循环 + 工具集 + 好的 context 管理能覆盖大多数任务）；只有任务**真正可并行**且**上下文需要隔离**、任务价值付得起 token 成本时，才拆多 Agent。

## 值得拆多 Agent 的信号

1. **天然可并行、子任务独立**——广度优先的深度检索（多个互不依赖的子问题）、读大量独立文件，orchestrator-workers 模式换来显著时间收益
2. **上下文隔离**——子任务产生海量中间上下文，隔离到子 Agent 里、只回传蒸馏后的结论，保护主 Agent 的 context window
3. **角色/工具明确不同**——planner/executor/critic 这类分工，各自需要不同 prompt 和工具集

## 不值得拆的信号

- **子任务高度耦合、需共享大量上下文**（典型：写代码）——多个 Agent 各持不完整上下文做决策，隐含假设互相冲突，协调/合并成本超过并行收益（Cognition「Don't Build Multi-Agent」的核心论点）
- **代价高**：Anthropic 的 research 系统实测多 Agent 在广度检索 eval 上比单 Agent 好约 90%，但 token 消耗约 15 倍
- 调试难、错误传播、评估难

# Agent 是否必须具备记忆能力，是否必须拥有完全自主的决策能力？

## 核心结论

**两者都不是必须。** Agent 的必要条件是「感知 → 决策 → 行动」的闭环（LLM + 工具调用的 loop）；记忆和自主性都是**可配置的增强维度**，不是定义属性。

## 记忆能力 —— 不必须，按任务分层

- **无记忆也是 Agent**：单轮 ReAct 循环（搜索、调工具、给答案）就是典型 Agent，每次请求独立、无状态
- 记忆是分层设计，而非二元开关：
  - **短期记忆**：当前会话的 context / 消息历史，靠 context window 承载，几乎所有多轮 Agent 都有
  - **长期记忆**：跨会话持久化（向量库、KV、文件系统），只在任务需要时才加——个性化助手、长期项目协作、跨天多步骤任务
- **工程权衡**：长期记忆有成本——存储/检索延迟、记忆污染（写入错误记忆会累积偏差）、隐私合规。应按任务需求裁剪，不是越强越好

## 完全自主决策 —— 更不必须，生产中往往刻意限制

- **自主性是一条光谱，不是 0/1**：Workflow（预编排）→ Agent（模型动态决策）→ Multi-Agent；Agent 的定义只要求 LLM 动态指挥自己的流程和工具使用，不要求脱离人类监督
- **生产主流是 bounded autonomy（受限自主）**：
  - Human-in-the-loop：高风险动作（支付、删除、对外发送）必须人工确认
  - 工具白名单、步数/token 预算、可中断、可回滚
- **为什么限制**：长链路自主执行错误会级联放大；安全、成本、可审计性要求。完全自主在生产中反而是**反模式**

# 从用户请求进入系统到 Agent 返回结果，一条完整执行链路如何设计？

## 核心结论

一条完整链路本质是七个阶段的闭环：**输入归一 → 会话/上下文装配 → Prompt 组装 → 决策循环（turn/step，可多轮）→ 模型流式 → 工具执行 → 事件落盘/投影 → 输出**。三个真实 harness（dsh、pi、codex cli）都是这套 ReAct 骨架，差异集中在两点：**状态存在哪里**（事件日志 vs 可变 transcript vs 会话 + rollout）、**循环如何被扩展和控制**（Cordis waterfall vs config 回调 vs actor 队列）。

## 一、通用七阶段（三者共有的骨架）

| 阶段 | 职责 |
|---|---|
| 接入/归一 | 把 HTTP/CLI/RPC/ACP 等入口归一成一条待处理输入 |
| 会话/上下文 | 加载/新建会话，恢复历史，管理 context window |
| Prompt 装配 | 组装 system prompt、工具 schema、历史消息 |
| 决策循环 | 模型决定「说话/调工具/结束」，可多轮迭代（agent 区别于 chatbot 的核心） |
| 模型层 | 流式请求 LLM，产出文本 + 工具调用 |
| 工具执行 | 校验 → 权限 → 执行 → 回收结果，喂回模型 |
| 落盘/投影 | 每个事实落盘，投影给 UI/持久化/telemetry |

## 二、dsh：事件溯源 + Cordis 插件

**底座**：建在 vendored Cordis 上，**模型适配器、工具注册表、会话日志、agent loop 本身都是插件**，无特权内核，链路每一段都能从配置替换。默认驱动是 `packages/core/agent-loop` 的 `ReactLoopAgent`。

**输入归一**：所有输入经单个 `Inbox`，底座 `send(message, target, wakeup)` 派生三个别名——`followup()`（next-turn + 唤醒，独立新一轮）、`steer()`（next-step + 唤醒，运行中打断/纠偏）、`inject()`（next-step + **不唤醒**，只塞上下文等下次被唤醒时带上）。把「排队/打断/注入」统一成一种数据模型。

**核心循环**：一个 **step** = 一次模型请求 + 它触发的工具；一个 **turn** = 零或多个 step。链路：

```text
turn/start → claim（认领 next-step 全部 + 边界处一条 next-turn）
  → agent/pre-step（waterfall：可 reject 或改写消息）
     step/start → user/message → deriveMessages() 从日志投影历史
     → agent/request（waterfall）→ llm/stream → assistant/chunk* → assistant/message
     → tool/call* → tools/pre-execute → tools/execute → tools/post-execute → tool/result*
     → step/end（工具还欠请求 or next-step 有新输入 → 认领 → 下个 step）
  → agent/turn-stopping（serial 终检：有新 steering 则再跑一步，否则关 turn）
turn/end → status idle
```

**唯一事实来源**：`turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` 都是持久化事件，append 到 append-only 日志。**「模型可见 ⟺ 已落盘」是运行时不变式**，`deriveMessages()` 从日志投影模型历史，fork/resume/transcript/telemetry 全部同源派生。

**扩展与护栏**：`agent/pre-step`、`agent/request`、`llm/stream`、`tools/*` 都是 **waterfall**（listener 必须 `next()` 才向下委托），compaction、权限确认、hook 都挂在这些点；工具/LLM/fs/shell 是能力 seam（Definition/Provider/Consumer 三角），换一个 provider 全局生效。审批、超时、沙箱、loop 卫生（guard 包）挂在 `tools/*` 管线——「模型自主决策，危险动作走硬编码护栏」。

## 三、pi（earendil-works/pi）：最小内核 + config 回调驱动

**底座**：TS monorepo，包分为 `ai`（统一多 provider LLM API）/ `agent`（agent-core：loop + 状态）/ `coding-agent`（CLI）/ `tui`（差分渲染）/ `chord`（应用组装运行时：services/RPC/replicated state/plugins，角色类似 dsh 的 Cordis）/ `telemetry`。定位是「minimal terminal coding harness / self extensible」。

**入口**：`agentLoop(prompts, context, config, signal, streamFn)` 返回 `EventStream<AgentEvent, AgentMessage[]>`；`agentLoopContinue` 不加新消息、从既有 context 重试。

**循环 `runLoop` = 双层嵌套**：外层跑 `getFollowUpMessages()`（后续轮），内层跑「工具调用 + steering」。每次内层迭代：`prepareNextTurn`（compaction 钩子，可换 context/model/reasoning）→ 取 `getSteeringMessages()` 并经 `declareToolChanges` 追加 → `streamAssistantResponse` 流式产出 assistant message → 抽 toolCall；`stopReason==="length"` 则全部 `failToolCallsFromTruncatedMessage`（参数可能被截断，不能跑），否则 `executeToolCalls` → 追加结果 → `turn_end` → `shouldStopAfterTurn?` → 再 poll steering。

**状态**：transcript = `AgentMessage[]`（LLM `Message` ∪ 自定义 UI 消息，`CustomAgentMessages` 声明合并扩展），**原地可变**；流式 delta 就地替换最后一条 partial message 并发 `message_update`；`newMessages` 累积本轮产物，EventStream 最终 resolve 成它。只有在调模型边界才用 `convertToLlm()` 转成 LLM `Message[]`。system prompt 和工具声明「骑」在 system message 上（`declareToolChanges` 用 `toolsAdded/toolsRemoved` reconcile），而非挂 `context.systemPrompt/tools`。

**扩展点是 config 回调而非事件总线**：`prepareNextTurn` / `shouldStopAfterTurn` / `transformContext` / `beforeToolCall`（可 `block`+`terminate`）/ `afterToolCall`（逐字段覆盖）。工具 `AgentTool.execute(id, params, signal, onUpdate)` **抛异常表失败**（而非把错误编进 content）；`executionMode` 决定 seq/parallel；批量终止要求**所有**结果 `terminate` 全 true 才停。

**会话**：JSONL session 文件，支持 branching / tree navigation / compaction（branch summarization）。

**安全**：**刻意不做内置权限系统**，以启动用户的权限运行；要隔离靠容器化（Gondolin 微 VM / Docker / OpenShell）。这是和 dsh/codex 最大的哲学分歧。

**StreamFn 契约**：模型/运行时失败**不得抛异常**，必须编码进 stream 的最终 AssistantMessage（`stopReason` 'error'/'aborted'）——和 dsh 适配器边界归一失败异曲同工。

## 四、codex cli（openai/codex）：Rust actor 模型 + 安全优先

**底座**：Rust workspace `codex-rs`，crate 分为 core / tui(ratatui) / exec(无头) / cli / mcp-server / mcp-client / execpolicy / apply-patch / linux-sandbox / login 等。

**入口是 actor 双队列**：前端 `codex.submit(Op)` 投**提交队列（SQ）**，core 的 `Session` 跑任务，通过**事件队列（EQ）**发 `Event`/`EventMsg` 给 UI 消费。三种前端（交互 TUI、`codex exec` 无头、MCP server 模式）都走同一个 core，实现前后端解耦。

**循环**：`Session` 每个 turn 调 Responses API（SSE 流式）→ 收到 output items（含 `function_call` / `local_shell_call`）→ 执行工具 → 把 `function_call_output` 喂回 → 循环直到无工具调用（task 完成）。

**工具**：内置 Rust 工具（`shell`/`local_shell`、`apply_patch`、`update_plan`、`web_search`）+ MCP 工具；codex 既是 MCP client 也能当 MCP server。

**状态/持久化**：会话历史在 `Session` 内；**rollout 文件（JSONL）**记录到 `~/.codex/sessions`，支持 resume/continue（`RolloutRecorder`）。

**模型抽象**：`ModelClient` 支持 Responses API 与 Chat Completions，`config.toml` 的 `model_providers` 配置多 provider/OAuth。

**安全（一等公民）**：沙箱（Linux landlock+seccomp / macOS Seatbelt），策略 `read-only` / `workspace-write` / `danger-full-access`；审批策略 `untrusted` / `on-failure` / `on-request` / `never`。项目指令走 `AGENTS.md`。

## 五、三者对比

| 维度 | dsh | pi | codex cli |
|---|---|---|---|
| 语言/组装底座 | TS / Cordis（一切皆插件，无特权内核） | TS / chord（最小内核 + 扩展） | Rust workspace（固定 core + 前端） |
| 输入模型 | 单 Inbox：next-turn/next-step + wakeup | agentLoop(prompts) + pull 回调 | actor 提交队列 Op / 事件队列 Event |
| 循环结构 | turn/step + waterfall 扩展点 | 外层 followup / 内层 toolcall+steering，发 AgentEvent 流 | Session task loop，model→tool→loop |
| 状态真源 | append-only 事件日志，deriveMessages()，「可见⟺已落盘」不变式 | 原地可变 transcript + newMessages，convertToLlm 边界转换 | Session 历史 + rollout JSONL |
| 扩展机制 | 事件总线（agent/*、tools/*、llm/*）+ bundle/profile | config 回调 + TS extensions/skills + chord 插件 | MCP + config.toml + AGENTS.md |
| 工具执行 | 能力 seam + tools/* waterfall（含护栏） | AgentTool.execute 抛错 + before/after 钩子，seq/parallel | 内置 Rust 工具 + MCP，function calling |
| provider 抽象 | ctx.llm 适配器 seam / StreamChunk | pi-ai 统一多 provider + StreamFn（不得抛） | ModelClient Responses/Chat + model_providers |
| 安全/权限 | approval + sandbox + guard 插件（管线内） | **无内置权限**，靠容器化 | 沙箱 + 审批策略（一等公民） |
| 会话持久化 | 事件日志（JSONL/SQLite）+ fork/resume | JSONL session + branching/tree/compaction | rollout JSONL + resume |
| 设计取向 | 框架化、强 replay/审计、可全量替换 | 极简自扩展、pull 式控制、显式不管权限 | 安全优先、actor 解耦、MCP 生态 |

## 六、设计取舍提炼（面试可展开）

1. **状态存在哪里决定能力上限**：dsh 把「模型可见 ⟺ 已落盘」做成运行时不变式，天然支持 replay/fork/telemetry/审计；pi 用可变 transcript + 边界 `convertToLlm` 转换，简单直接但重放/审计要自己在 JSONL 层补；codex 用 Session + rollout，介于两者之间。
2. **扩展点的三种范式**：事件总线（dsh，可组合、waterfall 委托）vs config 回调（pi，pull 式、调用方掌控、耦合低但扩展逻辑散在配置里）vs actor 队列 + MCP（codex，前后端解耦、跨语言扩展走协议）。
3. **打断/纠偏的实现**：dsh 是 push（steer 唤醒 + next-step 队列）；pi 是 pull（内层每轮顶部 `getSteeringMessages`）；codex 通过 SQ 再投 `Op`。
4. **安全是不是一等公民**：codex/dsh 把审批 + 沙箱放进主链路，pi 明确不做、外推给容器——体现「harness 的边界画在哪」的产品哲学差异。
5. **共性**：三者都遵守「模型/工具失败要归一化、不炸主循环」（dsh 适配器边界、pi StreamFn 契约、codex EventMsg error），说明**错误归一化是 agent 主循环稳定性的通用前提**。




