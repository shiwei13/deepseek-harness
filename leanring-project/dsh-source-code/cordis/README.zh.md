# Cordis 学习路线：从“看不懂 ctx”到能写插件

[English](README.md) | 中文

这组笔记接在《架构导读》之后。前一篇回答的是“DeepSeek Harness 这个 Agent 是怎样拼出来的”；从这里开始，我们把镜头拉近，只学习让这些积木能够组合、替换和卸载的底层框架：Cordis。

刚接触 Cordis 时，最容易困惑的往往不是某个 API，而是它的视角和普通应用不太一样。平常写程序，我们习惯从入口函数一路调用下去；Cordis 则更像一个会管理生命周期的工作台：插件声明自己提供什么、依赖什么、离开时如何收拾，运行时据此安排它们。先接受这个视角，后面所有的 `ctx`、`inject`、`effect` 和 `Fiber` 就会自然很多。

## 推荐顺序

1. [架构导读](../架构导读.md)：已经完成。先知道 Cordis 在 Harness 的位置。
2. [01：核心心智模型](01-Cordis核心心智模型.md)：理解 Context、插件、服务、事件、Fiber 分别在解决什么问题。
3. [02：亲手运行第一个插件](02-第一个可运行的Cordis插件.md)：用最小项目把“配置加载插件”真正跑起来。
4. [03：服务、依赖与上下文](03-服务依赖与上下文.md)：学会让插件合作，而不是互相硬编码导入。
5. [04：事件与生命周期](04-事件与生命周期.md)：学会通知、拦截，以及最重要的资源清理。
6. [05：回到 DeepSeek Harness](05-在DeepSeekHarness中读Cordis.md)：把前面的概念映射回 Agent、工具和模型插件。

## 学习前的准备

本仓库已经 vendored 了 Cordis，学习时不需要另建 npm 项目。先在仓库根目录安装依赖：

```sh
pnpm install
```

可运行的源码放在 [leanring-project/cordis-demos](../../cordis-demos/) 中。每章、每小节使用独立目录，修改一个练习时不会覆盖其他练习。请从仓库根目录运行：

```sh
(cd leanring-project/cordis-demos/02-first-plugin && node --import tsx ../../../vendor/cordis/bin.js)
(cd leanring-project/cordis-demos/03-services-and-context && node --import tsx ../../../vendor/cordis/bin.js)
(cd leanring-project/cordis-demos/04-events-and-lifecycle/01-emit && node --import tsx ../../../../vendor/cordis/bin.js)
(cd leanring-project/cordis-demos/04-events-and-lifecycle/02-waterfall && node --import tsx ../../../../vendor/cordis/bin.js)
(cd leanring-project/cordis-demos/04-events-and-lifecycle/03-effect && node --import tsx ../../../../vendor/cordis/bin.js)
```

每条命令都会创建根 `Context`，挂载 Loader，并从对应示例目录读取 `cordis.yml`。你不需要在自己的文件里手写“启动 Cordis”的样板代码；配置文件和插件就是应用本身。若命令报出依赖或 Node 版本问题，先回到仓库的[开发环境说明](../../../docs/development.zh.md#setup-tutorial)处理，不要急着从示例代码里找错。

## 一个舒服的学习节奏

每一章都建议走三遍：第一遍只读文字和图，把名词之间的关系理顺；第二遍亲自键入示例并运行；第三遍故意做一个小破坏，例如删掉服务提供方、把配置写错，观察 Cordis 给出的状态或报错。最后这一遍尤其有价值——框架在正常情况下看起来都差不多，真正体现设计的往往是“依赖没有来”“插件被卸载”“配置不合法”这些时刻。

不要试图背完 API。学完这一组后，能回答下面五个问题就已经很扎实：

- 这段能力为什么应该是一个插件，而不是放进某个大类？
- 它需要的是一个服务，还是只需要订阅一个事件？
- 它依赖的服务什么时候保证可用？
- 它注册的监听器、定时器或连接会在谁离开时清理？
- 如果它不启动，我怎样判断是 FAILED 还是 PENDING？

## 参考资料的分工

这些笔记负责讲学习路径和直觉；仓库里的正式文档负责给出精确的当前行为。两者配合使用最省力：

| 想解决的问题 | 优先阅读 |
|---|---|
| 想从零做一遍完整练习 | [Cordis 官方教程](../../../docs/cordis-tutorial/index.zh.md) |
| 想快速查某个概念 | [Cordis 入门](../../../docs/cordis-primer.zh.md) |
| 想查 Context、事件、Service 的精确 API | [Cordis API](../../../docs/cordis-api/context.zh.md) |
| 想看 Harness 里实际注册的服务和事件 | [core 子系统参考](../../../docs/subsystems/core.zh.md) |
| 想知道源码从哪里开始读 | [架构导读](../架构导读.md)和第 05 篇 |

下一篇从最重要的一件事开始：先把 Cordis 眼中的“应用”画出来。
