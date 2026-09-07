# Profile 与组合包可运行实验

[English](README.md) | 中文

这里的 3 个实验配套 [Profile 与组合包源码学习路线](../dsh-source-code/profile-and-bundles/README.zh.md)。它们复用同一组 fixture（测试前置数据），逐步从纯 patch 合成走到真实 `dsh` CLI（命令行界面）。

从仓库根目录运行全部实验：

```sh
node --import tsx/esm leanring-project/profile-demos/run-all.ts
```

也可以分别运行：

```sh
node --import tsx/esm leanring-project/profile-demos/01-layer-order/run.ts
node --import tsx/esm leanring-project/profile-demos/02-profile-resolution/run.ts
node --import tsx/esm leanring-project/profile-demos/03-real-dsh/run.ts
```

第 2、3 个实验只在系统临时目录创建模拟安装和 Harness home，并在结束时清理。第 3 个实验的子进程显式使用临时 `DSH_HOME`，不会读取或修改真实的 `~/.dsh`。

