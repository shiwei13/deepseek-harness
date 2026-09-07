# Profiles and Composition Bundles: Source Learning Path

English | [中文](README.zh.md)

These notes explain how `dsh` assembles the final Cordis plugin tree from a profile, composition bundles, and user patches. After completing them, you should be able to follow a `dsh --profile web` command to the config entries it mounts, predict the result of layered patches, and build a minimal composition bundle that runs in an isolated profile.

## Prerequisites

Read at least the first two chapters of the [Cordis Learning Path](../cordis/README.md), so you recognize plugins, Loader config entries, and `ctx`. For only the big picture, start with the [DeepSeek Harness Architecture Guide](../架构导读.md).

## Recommended order

1. [01: Mental model](01-心智模型.md) distinguishes profiles, composition bundles, plugins, and patches.
2. [02: Source call path](02-源码调用链.md) follows the CLI entry point through Loader mounting.
3. [03: Patch semantics](03-Patch语义.md) explains `id`, `insert`, whole-`config` replacement, and `!!js`.
4. [04: Lab guide](04-实验手册.md) runs three experiments that progressively approach the real `dsh` path.

For exact current behavior, use the [architecture reference](../../../docs/architecture.md), the [`dsh-app-boot` profile reference](../../../packages/boot/app-boot/README.md#profiles), and the [plugin publishing tutorial](../../../docs/user/develop/basic/publish.md). These notes help you read the implementation instead of repeating the config catalog.

## Quick start

Install dependencies from the repository root, then run every lab:

```sh
pnpm install
node --import tsx/esm leanring-project/profile-demos/run-all.ts
```

The three labs only read repository source. When they need a simulated Harness home, they create it in the system temporary directory and delete it afterward; they never read or write the real `~/.dsh`.

