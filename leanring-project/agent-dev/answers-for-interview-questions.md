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

# Agent 的感知、规划、执行、观察和反思怎样形成闭环？/ Planner、Executor、Critic 各自承担什么职责，三者如何协同？

## 完整面试作答

（一句话定义）我理解 Agent 的核心竞争力,就在于它把「感知—规划—执行—观察—反思」串成了一个带反馈的闭环。它和一次性问答的 LLM 最大的区别是:单次 LLM 调用是无状态的开环,而 Agent 是有状态的闭环——**用环境的真实反馈不断修正自己的行为,直到目标达成或触发终止**。这里的两个关键词是「反馈」和「状态」。

（逐环节 + 合拢点）具体拆成五个环节:

- **感知(Perception)**:收集当前上下文——用户指令、环境状态、历史记忆、上一轮工具的返回。工程上对应 prompt 组装、RAG 检索、读取会话历史。
- **规划(Planning)**:基于目标做任务拆解、选策略、决定下一步动作。对应 ReAct 里的 Thought、Plan-and-Execute 的计划阶段、工具选择。
- **执行(Execution)**:把决策落地成具体动作,也就是 Tool / Function Call、执行代码、调 API。
- **观察(Observation)**:拿到动作在环境里的真实结果——工具返回值、报错、stdout、文件变更。
- **反思(Reflection)**:评估结果和目标的差距,决定继续、纠错还是终止。对应自我评价、错误归因、重规划、写入记忆。

**闭环是怎么合拢的**,这是答题的关键:反思的结论(比如「上一步工具报错了、参数传错了」)会回流成为下一轮感知的输入,进入新一轮 Planning——就是这条反馈边把链路「闭」上了。没有这条回流边,它就只是一条流水线,不是闭环。

（举个具体例子证明做过)以改代码任务为例:感知是读需求 + 检索相关文件;规划是先定位函数再改再跑测试;执行是调 grep / edit / run test;观察是测试返回 3 个失败用例和报错栈;反思判断是自己漏改了一处,不满足目标,于是回到规划补一步修改;如果全绿就终止。

（收尾拔高)最后我会强调一句:**闭环的质量取决于观察的真实性和反思的有效性**——观察必须来自真实环境而不是模型臆想,反思必须能落到可执行的纠正动作上,否则闭环就是空转。


```text
        ┌────────────────────────────────────────────┐
        ▼                                             │
   [感知] ──→ [规划] ──→ [执行] ──→ [观察] ──→ [反思] ─┘
   Context    Plan       Act        Observe    Reflect
        ▲                                      │
        └──── 写入记忆 / 更新状态 ───────────────┘
```

## 加分项(主动补充,拉开区分度)

- **终止条件不可少**:目标达成 / 超过最大迭代步数 / 反思判定不可解 / 需要人介入。不设终止条件,循环会死循环或烧光 token。
- **记忆是闭环的地基**:短期记忆(context window)承载本轮状态,长期记忆(向量库 / 文件系统)跨会话持久化。没有记忆,多轮之间状态丢失,闭环就断了。

## 可能的追问及回答

**Q:怎么防止死循环?**
见下文独立题目「[如何检测并终止 Agent 的重复调用、无效反思和死循环？](#如何检测并终止-agent-的重复调用无效反思和死循环)」：区分重复动作、缺少进展和硬预算，并说明提醒与终止的不同责任。

**Q:观察环节如果拿到的是脏数据 / 幻觉怎么办?**
关键原则是**观察必须来自真实环境而非模型自述**。工程上要保证工具返回是结构化、可信的真实结果(exit code、真实 stdout、真实 API response),而不是让模型「假装」执行。反思阶段再对观察做一次校验(比如断言测试真的跑过、文件真的改了),避免把幻觉当事实喂进下一轮。

**Q:多 Agent 场景下闭环怎么组织?**
每个子 Agent 有自己的小闭环(各自感知—规划—执行—观察—反思);主 Agent(orchestrator)通过「观察子 Agent 的产出」形成一个更大的闭环。主 Agent 的反思就是评估各子 Agent 的结果是否合并成目标,不达标就重新分派——本质是闭环的嵌套。

**Q:这个闭环和 ReAct 是什么关系?**
ReAct 可以看成这个闭环的一种最小落地:Thought(规划+反思) → Action(执行) → Observation(观察),循环往复,下一轮 Thought 里天然带着上一轮 Observation——反馈边就在这里。所以「感知-规划-执行-观察-反思」是抽象模型,ReAct / Plan-and-Execute / Reflexion 是它在不同侧重点下的具体实现。

# Critic 模块解决什么问题，为什么不能只依赖 ReAct 循环？

## 什么是 ReAct（简单定义）

ReAct = **Reasoning + Acting**，一种让 LLM「边推理边行动」的 agent 范式。核心是一个循环：

```text
Thought（想：分析现状、决定下一步）
  → Action（做：调用一个工具 / 执行一个动作）
    → Observation（看：拿到动作在环境里的真实返回）
      → Thought（带着新观察再想）→ ……直到得出答案或触发终止
```

一句话：**ReAct 让模型把「思考」和「调工具」交替进行，每一步的决策都建立在上一步真实反馈之上**，而不是一口气把答案编完。它是「感知-规划-执行-观察-反思」闭环最常见的最小落地。

## 关键：ReAct 就是 Planner+Executor 共享上下文的单循环

ReAct 里 **Thought = 轻量 Planner（下一步干嘛）**，**Action/Observation = Executor（去做、看结果）**，这两个角色**共享同一段上下文、紧密交织**。所以 ReAct 不是「三角色之外的另一种架构」，它就是把前两个角色融进一个循环的具体做法——而且这么做是**对的、自然的**，因为规划和执行本来就是**协作关系**，需要看到彼此、边做边调。

## 核心结论（可直接背）

> 点破 ReAct 的结构性盲点 —— 它自带的 Planner 和 Executor 共享同一段上下文，是「协作关系」，天生缺一个「制衡关系」的角色；而「评价」这件事一旦和被评价者共享上下文就会自证失效，所以 ReAct 靠自己内部再怎么加 Thought 也补不出来，必须引入一个（倾向于隔离的）Critic。

换句话说：**ReAct 不是不够聪明，是它的结构里没有「独立评价位」。**

## ReAct 循环的三个结构性盲点

Observation 是**事实性**的（工具返回了什么），但循环里没有一个环节回答「这个事实好不好、离目标近不近、结论对不对」，由此：

1. **误差累积**：早期一步走错，后面全建立在错误前提上，ReAct 自身没有检测「我是不是走偏了」的机制，只会一路贪心地走。
2. **同源自证偏差**：生成 Action 和解读 Observation 是同一段上下文，模型倾向把结果朝「我做对了」合理化，缺乏独立视角。
3. **终止判断不可靠**：要么过早宣布 done（其实没满足验收标准），要么陷在死循环里出不来。

# ReAct 与普通 Function Calling 的区别是什么？

## 核心结论（可直接背）

> **两者不是一个维度：Function Calling 是「接口能力」，ReAct 是「编排范式」，二者正交、且现代 agent 常组合使用。** FC 解决「模型怎么可靠地表达一次工具意图」——把自然语言约束成符合 schema 的结构化输出；ReAct 解决「多步任务怎么在推理和行动间交替推进」——Thought → Action → Observation 的带反馈循环。所以生产里几乎不存在二选一，主流做法是**用原生 FC 做动作、跑一个 ReAct loop**：循环控制留在 harness，每一步的动作用 FC 承载，兼得可靠性和可编排性。

## 三点关键差异

1. **推理是否显式**：ReAct 把思考写进上下文（Thought），每步可解释、可纠偏；原生 FC 推理隐式，直接给函数。
2. **单步 vs 多步**：FC 只描述「这一步调什么工具」，本身不规定循环；ReAct 天然多步，靠 Observation 反馈决定下一步。
3. **实现可靠性**：早期 ReAct 靠文本解析动作（`Action: xxx`），脆弱易失败；FC 用模型原生结构化输出，稳定得多。

## 一句话收尾

> FC 回答「怎么调」，ReAct 回答「怎么想着调、调完再怎么办」——一个是接口，一个是循环，现代 agent 是「用 FC 做动作的 ReAct loop」。

# ReAct 与思维链 CoT 的区别是什么？

核心区别在于**是否有外部环境交互闭环**。

- **CoT**：单向的 `Reasoning → Answer`。一次性生成完整推理链，全靠模型参数里的内部知识，没有中途获取新信息的能力，是「闭卷考试」，适合数学、逻辑推理这类纯推理任务。
- **ReAct**（Reasoning + Acting）：`Thought → Action → Observation` 的循环，直到得出答案。
  - **Thought**：决定下一步做什么
  - **Action**：调用工具（search、calculator、code exec…）
  - **Observation**：把工具返回结果喂回上下文，再基于它继续 Thought，多轮迭代

ReAct 用真实的外部观测来**纠正和约束推理**：CoT 的致命问题是错误级联——前面一步幻觉了，后面全错且无法自我发现；而 ReAct 每一轮都有外部反馈信号来打断和修正，显著缓解幻觉，同时让工具调用可解释、可追溯。

**关键是二者不是替代而是包含关系**：ReAct 里的 Thought 本身就是一段 CoT，可以理解为 ReAct = CoT（负责规划推理） + Tool Use（负责获取事实） + 交错调度。原论文的消融也印证了这点——只 Acting 不 Reasoning 会乱调工具，只 Reasoning 不 Acting 就退化成会幻觉的 CoT，两者结合才最优。所以 ReAct 不只是 prompt 技巧，它是现代 Agent 循环的理论原型。

# Plan—Execute—Replan 与 ReAct 的关键差异是什么？各适用于什么场景，有哪些优缺点？

核心区别在于**规划的粒度和时机**：ReAct 是「走一步看一步」，每步临时决策；Plan-Execute 是「先出完整计划，再逐步执行」，规划与执行分离。

- **ReAct**：没有全局计划，`Thought → Action → Observation` 每轮只决定下一步，靠即时反馈驱动。决策和执行揉在同一个循环里，用同一个（通常是最强的）模型反复推理。
- **Plan-Execute-Replan**：先由 Planner 一次性产出完整的多步计划（step 1…N），再由 Executor 按计划逐步执行；只有当执行结果偏离预期时才触发 **Replan**，让 Planner 基于新观测修订剩余计划。规划者和执行者可以是不同模型（强模型规划、弱模型执行）。

## 对比

| 维度 | ReAct | Plan-Execute-Replan |
|------|-------|---------------------|
| 规划时机 | 每步临时决策，无全局计划 | 先全局规划，再执行 |
| 全局视野 | 弱，容易在长任务里「跑偏 / 绕圈」 | 强，有整体蓝图约束方向 |
| 成本 | 高，每步都要带全上下文调强模型 | 低，规划一次，执行可用弱模型 / 并行 |
| 延迟 | 步步串行，长任务慢 | 计划内独立步骤可并行 |
| 适应性 | 极强，环境突变时立刻响应 | 较弱，靠 Replan 兜底，不如 ReAct 灵敏 |
| 可控 / 可审计 | 差，轨迹发散 | 好，计划可人工审查、可干预 |

## 各自适用场景

- **ReAct**：步数少（几步内）、高度动态、下一步强依赖上一步结果的探索型任务——如交互式问答、单点检索、调试排错。
- **Plan-Execute-Replan**：步骤多、目标明确、可提前拆解的长程复杂任务——如「调研某主题写报告」「多文件重构」「跑一条数据处理流水线」。步骤越多、越怕中途跑偏，越该用它。

## 优缺点

- **ReAct 优点**：简单、灵活、对环境变化响应快；**缺点**：无全局观易在长任务中迷失、绕圈或重复劳动，每步调强模型贵、慢，轨迹难审计。
- **Plan-Execute 优点**：全局视野强、方向不跑偏、成本低（规划/执行分层，执行可并行可降配）、计划可审查可干预；**缺点**：初始计划可能一开始就错，对突发变化不如 ReAct 灵敏，Replan 频繁时反而更贵，实现更复杂。

## 一句话收尾

> ReAct 是「摸着石头过河」，Plan-Execute 是「先画地图再上路、走错了再改图」——短程善变用 ReAct，长程复杂用 Plan-Execute，而 Replan 正是给「死计划」补上应对现实的那只手。

# Planning 应主要由大模型还是 Agent 框架完成，常见实现方法有哪些？

## 核心结论（可直接背）

> **不是二选一，是分工。** 规划里「怎么拆、下一步做什么」这类**语义决策**归大模型；「计划怎么承载、怎么约束、什么时候触发重规划、结果怎么校验」这类**结构和控制**归框架。趋势是模型越强、越多规划能力下沉到模型内部，框架的角色从「替模型规划」退化成「约束并落地模型的规划」。

## 谁负责什么

- **大模型负责**：任务理解、拆解、策略选择、下一步动作决策、根据观测调整计划——这些依赖语义理解，框架硬编码写不出来。
- **框架负责**：把计划变成可承载/可展示/可审计的结构（todo、plan state），提供循环与状态、注入工具 schema、施加护栏（步数/预算/权限）、定义 replan 触发条件、校验计划产出是否合法。
- **一句话**：**框架搭台定规则，模型在台上做决策。** 框架不替模型「想」，只保证模型「想」得可控、可落地。

## 常见实现方法（由「模型内隐式」到「框架显式重」）

1. **模型内隐式规划**：CoT 的推理链、ReAct 的 Thought——规划藏在模型输出里，框架只跑循环。最轻，但计划不可见、不可审查。
2. **显式 Planner 组件**：Plan-and-Execute / Plan-Execute-Replan——框架单独调一次模型产出结构化多步计划，再逐步执行，偏离时触发 Replan。计划可见、可干预、执行可降配可并行。
3. **计划即工具/状态**：让模型用 `todo_write`、plan mode 把计划写成结构化 todo list，框架承载、展示、跟踪勾选（Claude Code 的做法）。把「规划」显式化为一等公民的状态，可审计、可续跑。
4. **分解为子 Agent**：orchestrator-workers——主 Agent 规划并派发，子 Agent 各自执行。规划落在编排层。
5. **框架驱动的搜索式规划**：Tree of Thoughts、LLM + 经典规划器（PDDL）——框架掌管搜索/回溯，模型只当启发式或候选生成器。规划权更多回到框架。
6. **反思式重规划**：Reflexion / Critic——执行后由（隔离的）评价者审计，不达标就回流触发重规划。给规划补上「制衡位」。

## 一句话收尾

> 好的 Planning 设计不是把规划全塞给模型或全写死在框架里，而是**让模型做它擅长的语义决策，让框架做它擅长的结构承载与护栏**——模型越强，这条分工线就越往框架这边收。

# 哪些条件应触发 Replan，原计划不可行时如何重新规划？

## 核心结论（可直接背）

> **Replan 的触发本质是「观测与预期出现了计划无法消化的偏差」。** 关键不是「出错就重规划」——单步可自愈的小错该在执行层重试兜掉；只有当偏差**动摇了计划赖以成立的前提**时才升级到 Replan。重规划的正确姿势是**基于已发生的真实观测，保留仍有效的部分、只修订剩余计划**，而不是从零重来。

## 触发 Replan 的条件

1. **执行失败且重试无效**：某步反复失败、报错不可自愈（依赖缺失、接口 404、权限不足），单步兜底解决不了。
2. **观测与预期矛盾**：环境返回的事实和计划假设冲突（以为文件存在但没有、以为接口返回 A 结果是 B），计划的前提被推翻。
3. **出现计划里没有的新信息/新目标**：中途发现更优路径、用户追加或修改需求、发现原目标理解有偏差。
4. **进展停滞或绕圈**：连续多步没有推进目标、重复同一动作/同一报错——判定「卡住」，当前计划已失效。
5. **约束被突破**：预算/步数/时间逼近上限，需要换更省的路径或砍目标。
6. **反思/Critic 判定不达标**：独立评价者审计计划或阶段产出，认为方向错了。

## 原计划不可行时怎么重新规划

- **先诊断再重规划**：不要一失败就整盘推翻。先归因——是单步实现问题（回执行层重试/换工具）还是计划前提问题（才升级 Replan）。
- **喂真实观测给 Planner**：把「已完成哪些步、当前环境真实状态、失败的具体原因」作为新输入，让 Planner 基于事实修订，而不是基于最初的臆想。
- **增量修订而非全量重来**：保留计划中仍成立的前缀，只重写受影响的剩余步骤（Plan-Execute-Replan 的标准做法），省成本也避免丢掉已有进展。
- **给重规划本身设上限**：限制 replan 次数/深度；反复 replan 仍不可行，说明目标可能本就不可达，应终止并上报（human-in-the-loop），而不是无限修图。
- **必要时降级目标**：若完整目标确实达不到，重规划可以是「缩小范围、交付可行子集 + 明确说明未完成部分」，而非硬撑。

## 一句话收尾

> Replan 不是「出错就重来」，而是**「前提被推翻时，带着真实观测改图、而不是重画」**——会诊断、会增量修订、会在改不动时喊停，才是成熟的重规划。

# 结合 dsh 源码：Agent 的 Plan Mode 应如何设计？(总体架构)

## 核心结论（可直接背）

> 在 dsh 里，Plan Mode **不是**一个独立子系统，也**不是** agent-loop（主循环）里的一个内存开关，而是：
> **一个普通 Cordis 插件（`dsh-plan-mode`），通过已有扩展点接入，把「是否处于 Plan Mode」表达成一条会话日志事件（`plan/mode`）。**
>
> 它只做**软引导**（往系统提示里加一段文字 + 提供一个退出工具），**不做任何强制限制**；限制是 sandbox（沙箱）/ approval（权限审批）的独立职责。任务拆解（`todo_write`）则是**另一个独立插件**，和 Plan Mode 解耦。

## 一、它是一个插件，靠扩展点接入，不改 agent-loop

dsh 的架构铁律是「everything is a plugin，新增行为挂到文档化的扩展点上，改 agent-loop 要单独走流程」。`PlanModeController`（一个 Cordis `Service`）就是靠下面几个扩展点接进去的，主循环一行不用改：

| 接入的扩展点 | 作用 |
|---|---|
| `ctx.systemPrompt.section('plan:policy')` | Plan Mode 激活时，往系统提示插入部署方配置的 `section` 文本；不激活则贡献空串 |
| `ctx.tools.register('exit_plan_mode')` | 注册「提交计划、请求退出」的工具，且**常驻**（下一题细讲） |
| `ctx.on('agent/pre-step', ...)` | 挂在「每步执行前」的钩子上，作为状态切换的**提交边界** |
| `ctx.inject(['commands'])` → `/plan` | **可选子能力**：组合了命令注册表才注册 `/plan [off\|消息]` |
| `ctx.inject(['sessionProjections'])` → `plan` 投影 | **可选子能力**：组合了投影注册表才对外投影 `{active, pending}` 供 UI 读 |

关键：**进出 Plan Mode 只改「系统提示里那一段文字」，不碰主循环、也不改工具清单**。这就是「plugins, not loop changes」原则的落地。

## 二、单一数据源 = 会话日志；状态靠 fold 还原，不留内存副本

- Plan 状态本身就是一条 `plan/mode` 事件（`{ active: boolean }`，log-only 只进日志、整值替换）。想知道当前状态，就用 `foldPlanMode(events)` 把日志折叠一遍取最后一条，一条都没有则默认 `false`。
- 遵守 dsh 铁律 **Model-visible ⟺ logged**（模型能看到的东西必须能从日志重建）：所以 Plan 状态、以及切换时给模型补的提示，都是事件，不是内存变量。
- **没有 live mirror（内存镜像）**：resume（续跑旧会话）、fork（复制会话）、compaction（历史压缩）都直接照日志还原 Plan 状态；UI 通过订阅 `session/event` 事件流观察状态翻转。这是「日志即唯一真源」白拿的好处。

## 三、只做软引导；强制限制是独立关注点

- Plan Mode 激活**只有两个可见效果**：系统提示多一段 `section`；`exit_plan_mode` 工具可用。它**不限制**模型能调哪些工具、能不能写文件。
- 真正的限制（禁止写盘、操作需审批）由 **sandbox mode** 和 **approval policy** 独立执行；它们**不读写** Plan 状态，Plan Mode 也**不读写**它们。
- 这是刻意的关注点分离：需要硬限制的部署自己去配 sandbox/approval，Plan Mode 只负责「先设计、经确认、再动手」的协作节奏，职责单一。

## 四、和任务拆解解耦

- `dsh-plan-mode` 只管「设计 → 用户确认 → 执行」这道**关卡**。
- 任务拆解是**另一个独立插件** `dsh-tool-todo` 的 `todo_write` 工具，**始终可用**、不属于 Plan Mode。两者职责正交、可分别组合——dsh 没有把「拆任务」硬塞进 Plan Mode。

## 五、可选组合，headless 不受影响

`/plan` 命令、`plan` 投影都是 optional children（可选子能力）：只有部署组合了对应注册表（`commands` / `sessionProjections`）才激活。纯 headless（无 UI、无命令）的组合里，Plan Mode 只保留「提示段 + 退出工具」这套最小面，其余自动不启用，互不影响。

## 一句话收尾

> Plan Mode 的架构本质是 **「一个软引导插件 + 一条日志事件」**：靠扩展点接入而不改主循环，状态以会话日志为唯一真源、靠 fold 还原（resume/fork 免费恢复），强制限制交给 sandbox/approval，任务拆解交给 todo——每一块都能独立组合、独立续跑。

# 结合 dsh 源码：任务拆解、确认与执行状态怎样流转？(细节)

## 核心结论（可直接背）

> 三段各有各的载体和提交点：
> - **拆解**：模型调 `todo_write`，每次**整表替换**地写一份待办清单，落成 `todo/write` 事件。
> - **确认**：模型调 `exit_plan_mode` 提交计划，经 `userQuestions` 弹出 review，用户**精确点 Approve** 才放行。
> - **执行状态流转**：模式切换走 **selection（选择）→ pending（挂起）→ commit（落盘）** 三步，最终落成 `plan/mode` 事件。

## 一、任务拆解：`todo_write` 的细节

- **工具签名**：`todo_write(todos: [{ content, status }])`，`status` 三选一：`pending`（没做）/ `in_progress`（在做）/ `completed`（做完）。
- **整表替换（whole-list replace）**：每次调用都传**完整清单**，没有「改第 N 条」的增量操作。每次调用往日志 append 一条 `todo/write` 事件（内含整张清单快照），当前清单 = 最新那条（replay 回放时后写覆盖先写）。这样永远不会出现半更新的中间态。
- **单一 owner**：清单只属于调用它的那**一个** agent session（当前对话），不跨子 agent、不共享；非 agent 调用直接拒绝。
- **校验 fail loud**（出错就明确报错，不静默）：拒绝空的 / 重复的 `content`，拒绝 `content`/`status` 之外的多余字段——防止模型以为写进去了、实际被悄悄丢弃。
- **projection（投影）生命周期**：`todos` 投影单元 `apply`（逐事件更新）从每条 `todo/write` 取整表，并在每个 `turn/start`（新一轮开始）时清空；`turn/end`（本轮结束）时**保留**完成清单，方便回看这一轮做完了啥。
- **`allowParallelInProgress` 可配**：让部署方选「能否同时有多条 `in_progress`」。因为「并行是否合法」取决于工具看不到的运行时并发，所以交配置、不写死；但**日志回放的兼容性不跟着变**——早期允许并行时写的日志，收紧策略后仍要能回放。

## 二、确认：`exit_plan_mode` 的 review 细节

- **入参校验**：`plan` 必须是 Markdown、且以一个 `# 标题` 开头，不合格直接抛错打回。
- **走 `ctx.userQuestions` 通道**：execute（工具执行体）里调 `userQuestions.ask(...)` 弹一个 review，带 `plan-review` 这个 presentation intent（呈现意图：告诉 UI「这是计划评审，用专门界面渲染，别当普通提问」）。两个选项：
  - **Approve（同意）**：退出 Plan Mode，从下一步开始执行；
  - **Keep planning（继续规划）**：留在 Plan Mode，用户反馈回传给模型，让它改完再交。
- **精确匹配才通过**：只有恰好选中 `Approve` 且无附加自定义输入才算同意；否则把用户反馈当作**工具报错**回给模型。
- **三种结果分得很清楚**：
  - Approve → 成功，返回 `{ approved: true }`；
  - Keep planning → 失败，附上用户反馈文本；
  - **dismissed（用户关掉弹窗想直接说话）** → 失败，并明确告诉模型「用户想插话，停在这里等他消息」，而不是笼统报错。
- **退出工具常驻**：不管 Plan Mode 开没开，`exit_plan_mode` 始终注册。进出只改系统提示那段文字、**不改工具清单**，从而保住 KV cache（模型请求前缀的键值缓存；工具清单一变，缓存前缀失效、要重算）。

## 三、执行状态流转：selection → pending → commit

先记住核心那句：

> 「是否在 Plan Mode」不是内存布尔开关，而是日志里一条 `plan/mode` 事件；当前状态 = `foldPlanMode(events)` 折叠出的最后一条值。

**为什么不能说切就切？** 因为一次模型请求的 assembly（请求装配：把提示、工具、历史拼成一次调用）一旦冻结就改不动了。用户在一轮（turn）进行中切换，不能马上改写当前这次请求。所以：

```
用户 /plan 切换（或模型调 exit_plan_mode 请求离开）
        │
        ├─ agent idle（空闲，没有进行中的 turn）→ 立刻 append plan/mode = committed（落盘生效）
        │
        └─ agent running（有 turn 在跑）→ 先存进 pendingIntents（挂起意图，一个内存 WeakMap）= queued（排队）
                    │
                    ▼
          下一个被接受的 agent/pre-step（每步执行前的钩子 = 步骤边界）
                    │  比对：挂起目标 ≠ 当前 fold 值时，才 append plan/mode
                    ▼
                committed（写进日志，从这一步开始生效）
```

细节要点：

- **`set(agent, active)` 返回四种状态**：`committed`（已落盘）/ `queued`（挂起，等下一步）/ `cancelled`（把一个方向相反的挂起选择撤销了）/ `noop`（本来就这状态，无动作）。
- **落盘时机绑在 `agent/pre-step`**：这个钩子在 `Session.append` 的发布流程之外，所以能在一个 open turn（未结束的一轮）内部安全追加这条 log-only 事件而不重入 session。**append 成功之后才删挂起意图**——万一写日志失败，挂起意图还留着，下一个 pre-step 再试，**绝不丢用户的切换**。
- **pending 是纯 replay 量（可从日志回放重算，不靠内存）**：投影单元靠 `command/run`（`/plan` 命令开始）→ `command/done`（命令结束）→ `plan/mode`（真正落盘）这三类事件，推导出对外的 `{ active, pending }`。所以进程重启、另开一个浏览器 tab、冷读（首次加载）都能只凭日志还原出「有一笔还没落地的切换」。
- **narration（切换叙事）**：如果上一条 `request/header`（上次请求头）记录的是相反状态，切换时会补一条 plugin 来源的 `user/message`，告诉模型「用户把会话切到了 / 切回了某模式」，让模型上下文里有数。
- **todo 的状态流转**是独立的另一条线：每条待办自己走 `pending → in_progress → completed`，由模型勾选；整份清单显示到下一个 `turn/start` 清空。

## 一句话收尾

> 三段流转都落在日志里、各有明确的提交点：拆解靠 `todo_write` 整表替换，确认靠 `exit_plan_mode` 精确 review，模式切换靠「pending 挂起 → 在 pre-step 步骤边界 commit」并且 **append 成功才清挂起**——这样才做到「续跑不丢、状态可回放」。

# 如何检测并终止 Agent 的重复调用、无效反思和死循环？

## 总结

- 对连续相同的工具名和规范化参数计数，可先提醒模型换参数、换方法或结束；单凭调用重复不能证明无进展，提醒也不是硬终止。
- 对最近的动作与观察结果一起比较，识别相同结果、持续报错及交替循环；连续只有 Agent 消息而无动作可识别空转，但不能据此判定反思内容的语义质量。
- **建议：**用测试结果、文件差异等可验证变化判断反思是否带来进展；提醒后仍无进展就停机并报告原因，以步数或费用上限兜底。

## 细节

### DeepSeek Harness

- **重复调用提醒：**`repeat-tool-reminder` 对同一 agent 连续同名、同参数调用计数：第 3 次追加“先检查上次结果，必要时换方法”的提示消息；第 5、8 次还列出工具名、次数和参数。这里的“注入”只是给模型增加文字提醒，不会修改工具参数。[源码](../../packages/guard/repeat-tool-reminder/src/index.ts#L59-L78)（`fb00aac9b0`）
- **作用范围：**提示通过 `tools/post-execute` 的 `additionalContexts` 传递；插件仍调用 `next()`，所以不能强制停机。新用户消息会清除连续计数。[源码](../../packages/guard/repeat-tool-reminder/src/index.ts#L189-L231)（`fb00aac9b0`）

### OpenHands Software Agent SDK

- **循环检测：**`StuckDetector` 对近期事件检查重复动作与观察、相同报错、交替动作及连续 agent 消息；相同报错达到阈值时先发一次纠错提示，再继续重复才判定卡住。[源码](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/stuck_detector.py)
- **执行器停机：**`LocalConversation` 把纠错提示写成环境消息，检测器判定卡住时将状态设为 `STUCK`；独白检测只计数，不比较反思内容是否有新证据。[源码](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/impl/local_conversation.py)；[独白检测](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/stuck_detector.py)

### LangGraph

- **硬上限：**Pregel 循环在步数超过 `stop` 时标记 `out_of_steps` 并退出，防止未识别的循环无限执行；达到上限只说明预算耗尽，不证明任务无解。[源码](https://github.com/langchain-ai/langgraph/blob/main/libs/langgraph/langgraph/pregel/_loop.py)
