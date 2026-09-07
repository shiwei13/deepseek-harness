# Profile 与组合包源码学习路线

[English](README.md) | 中文

这组笔记解释 `dsh` 如何从 profile、组合包和用户 patch 组装出最终 Cordis 插件树。学完后，你应当能从一条 `dsh --profile web` 命令追到实际挂载的配置项，能预测多层 patch 的结果，也能制作一个最小组合包并放进隔离的 profile 中运行。

## 前置知识

建议先读完 [Cordis 学习路线](../cordis/README.zh.md)的前两章，至少认识插件、Loader 配置项和 `ctx`。如果只想先建立全局印象，可以先读 [DeepSeek Harness 架构导读](../架构导读.md)。

## 推荐顺序

1. [01：心智模型](01-心智模型.md)区分 profile、组合包、插件和 patch。
2. [02：源码调用链](02-源码调用链.md)从 CLI（命令行界面）入口追到 Loader 挂载。
3. [03：Patch 语义](03-Patch语义.md)逐条解释 `id`、`insert`、整段 `config` 替换和 `!!js`。
4. [04：实验手册](04-实验手册.md)运行 3 个逐步接近真实 `dsh` 的实验。

正式的当前行为以[架构说明](../../../docs/architecture.zh.md)、[`dsh-app-boot` profile 参考](../../../packages/boot/app-boot/README.zh.md#profiles)和[插件发布教程](../../../docs/user/develop/basic/publish.zh.md)为准。这组笔记不重复配置目录，而是帮助你读懂实现。

## 快速开始

先在仓库根目录安装依赖，然后运行全部实验：

```sh
pnpm install
node --import tsx/esm leanring-project/profile-demos/run-all.ts
```

3 个实验只读取仓库源码。需要模拟 Harness home 时，它们会使用系统临时目录并在结束后删除；不会读写真实的 `~/.dsh`。

