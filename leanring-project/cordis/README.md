# Cordis Learning Path: From “What Is ctx?” to Writing Plugins

English | [中文](README.zh.md)

These notes continue from the Architecture Guide. That guide answers how DeepSeek Harness assembles an agent; this series zooms in on the framework that lets those pieces compose, be replaced, and clean up after themselves: Cordis.

At first, Cordis can feel unfamiliar not because of a single API, but because its perspective differs from a conventional application. We usually follow calls from an entry point; Cordis instead manages a workbench where plugins declare what they provide, what they need, and how they clean up. Once that perspective clicks, `ctx`, `inject`, `effect`, and `Fiber` become much easier to follow.

## Recommended order

1. [Architecture Guide](../架构导读.md): already complete. Start by locating Cordis within Harness.
2. [01: Core mental model](01-Cordis核心心智模型.md): learn what Context, plugins, services, events, and Fibers each solve.
3. [02: Run your first plugin](02-第一个可运行的Cordis插件.md): build the smallest application loaded from configuration.
4. [03: Services, dependencies, and contexts](03-服务依赖与上下文.md): let plugins cooperate without hard-coded imports.
5. [04: Events and lifecycle](04-事件与生命周期.md): learn notifications, interception, and resource cleanup.
6. [05: Return to DeepSeek Harness](05-在DeepSeekHarness中读Cordis.md): map the concepts back to agents, tools, and model plugins.

## Before you begin

This repository already vendors Cordis, so you do not need to create another npm project. Install dependencies from the repository root:

```sh
pnpm install
```

The official tutorial keeps its temporary files in `tmp/cordis-tutorial`, which Git ignores. You can edit it as often as you like:

```sh
mkdir -p tmp/cordis-tutorial
cd tmp/cordis-tutorial
```

Run each standalone example with this launcher:

```sh
node --import tsx ../../vendor/cordis/bin.js
```

The command creates a root `Context`, mounts the Loader, and reads `cordis.yml` from the current directory. You do not write startup boilerplate in each exercise: the configuration and plugins are the application. If Node or dependency errors occur, first consult the repository’s [development setup](../../docs/development.md#setup-tutorial) rather than assuming the example is wrong.

## A comfortable study rhythm

Use three passes for every chapter. First read the prose and diagrams to arrange the concepts. Then type and run the example yourself. Finally, break one small thing on purpose: remove a service provider or provide invalid configuration, then observe the state or error Cordis gives you. That last pass is especially worthwhile. Frameworks look similar while everything works; their design becomes visible when a dependency is absent, a plugin unloads, or a configuration value is invalid.

Do not try to memorize every API. By the end of this series, you will have a solid foundation if you can answer these five questions:

- Why should this capability be a plugin instead of a method on a large class?
- Does it need a service, or does it only need to subscribe to an event?
- When is the service it depends on guaranteed to exist?
- Whose departure cleans up its listeners, timers, and connections?
- If it does not start, how can I tell `FAILED` from `PENDING`?

## How to use the reference material

These notes explain the learning path and intuition; the repository’s maintained documentation defines exact current behavior. They work best together:

| Question | Start here |
|---|---|
| I want a complete hands-on exercise | [Cordis tutorial](../../docs/cordis-tutorial/index.md) |
| I need a quick concept lookup | [Cordis primer](../../docs/cordis-primer.md) |
| I need the exact Context, event, or Service API | [Cordis API](../../docs/cordis-api/context.md) |
| I want to see the services and events registered by Harness | [Core subsystem reference](../../docs/subsystems/core.md) |
| I want a source-reading route | [Architecture Guide](../架构导读.md) and chapter 05 |

The next chapter starts with the most important task: drawing what an “application” looks like to Cordis.
