# Runnable Profile and Composition Bundle Labs

English | [中文](README.zh.md)

These three labs accompany the [Profiles and Composition Bundles Source Learning Path](../dsh-source-code/profile-and-bundles/README.md). They reuse one fixture set and progress from pure patch composition to the real `dsh` CLI.

Run every lab from the repository root:

```sh
node --import tsx/esm leanring-project/profile-demos/run-all.ts
```

You can also run them separately:

```sh
node --import tsx/esm leanring-project/profile-demos/01-layer-order/run.ts
node --import tsx/esm leanring-project/profile-demos/02-profile-resolution/run.ts
node --import tsx/esm leanring-project/profile-demos/03-real-dsh/run.ts
```

The second and third labs create simulated installations and Harness homes only in the system temporary directory, then clean them up. The third lab's child process explicitly uses the temporary `DSH_HOME` and never reads or modifies the real `~/.dsh`.

