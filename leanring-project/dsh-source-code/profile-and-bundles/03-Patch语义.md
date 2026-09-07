# 03：Patch 到底怎样改配置树

Profile 机制没有另写一套合并器。最终语义来自 vendored Include 的 [`applyEntryPatches()`](../../../vendor/include/src/index.ts)，`composeEntries()`、配置 dump 和真实挂载都调用它。

## 输入不是普通对象深度合并

基础数据是一组 Loader 配置行：

```yaml
- id: observer
  name: dsh-learning-base
  config:
    source: base
    timeoutMs: 1000
```

下面的 patch 命中 `observer` 后，会把整段 `config` 替换为新对象：

```yaml
- id: observer
  config:
    source: profile
```

最终行只有 `source: profile`，`timeoutMs` 不会保留。算法是在配置行这一层覆盖 `config`、`disabled`、`inject` 等字段，但不会进入 `config` 内部做深度合并。

这条规则解释了为什么 `dsh-web-app` 覆盖 `dsh-base` 的 `session-query-sqlite` 时，会同时重述 `path` 与 `openAt`。写用户 patch 时也一样：目标行需要保留的每个 config 字段都必须写出来。

## insert 添加新行

没有 `id` 的 `insert` 把新行追加到顶层：

```yaml
- insert:
    - id: observer
      name: dsh-learning-base
      config:
        source: base
```

带 `id` 的 `insert` 把新行追加到目标 group 的 `config` 数组；如果目标不存在或不是 group，算法发出警告并跳过。

每批插入的行会立即加入 id 索引，所以同一次合成中的后续 patch 可以继续覆盖它。Profile 正是依赖这条语义：第一层 bundle 在空根上插入行，后续 bundle 与用户层才能按 id 修改这些行。

## 普通 patch 的匹配规则

一个非 `insert` patch 必须提供 `id`。算法按以下顺序处理：

1. id 不存在：输出 `patch: entry "<id>" not found` 并跳过。
2. patch 还写了 `name`，但与目标行插件名不同：输出 name mismatch 警告并跳过。
3. 匹配成功：把除 `id`、`insert`、`name` 以外的顶层字段赋给目标行。

`name` 因此可以作为防误配保护：当某个稳定 id 被另一插件接管时，旧 patch 不会悄悄把不兼容 config 写给新插件。普通覆盖不会改变目标行的 `id` 或 `name`。

## disabled 与 null

`disabled: true` 让 Loader 保留该配置行但不为它创建活动插件实例。后续层可以写 `disabled: false` 或 `disabled: null` 覆盖前层；最终如何解释字段由 Loader 负责，patch 算法只执行顶层赋值。

组合包常用它交付可选能力或按平台门控成对实现。例如 `dsh-base` 的 Bash 与 PowerShell 行都存在，但 `!!js process.platform ...` 使每个平台只启用一套。

## 所有层被展平成一次调用

`composeEntries()` 使用 `layers.flat()`，真实启动也把 bundle、profile、home 和 overlays 拼成一个 patch 数组。这样，前一层 `insert` 的 id 会继续留在同一个索引里供后层命中。

一个高级边角是：算法开始时会递归索引已有 group 子项，也会索引 `insert` 新增的子项；但如果普通 patch 直接用一份新数组替换某个 group 的 `config`，这批新子项不会重新建索引。后面的 patch 因此不能在同一次调用中按 id 命中这些新子项。配置 dump 的测试专门固定了这一点，避免离线工具与真实启动产生不同结果。

## !!js 不是 dump 阶段的 JavaScript

Include 的 `entryListSchema` 把 `!!js` 标量解析为表达式节点：

```yaml
config:
  root: !!js dshHomePath('sessions')
  mode: !!js process.env.DSH_TOOLS_MODE
```

`loadOverlayPatches()` 和 `renderConfigDump()` 只解析并保留表达式文本。Loader 激活具体配置行时才求值，因此表达式可以读取 `process`、`dshHomePath`，以及该行通过 `inject` 等待到的 `ctx.<service>`。

## 失败与警告的边界

文件不存在、YAML 无法解析、顶层不是数组或 patch 数组成员不是对象，都属于整层无法应用的错误，启动器直接失败。一个结构合法但 id 未命中的 patch 只产生警告，因为同一 overlay 可能有意供多个不同组合使用。

空文件和仅含注释的文件解析为 `undefined`，不是空数组，所以也会失败。要表达“这一层暂时没有内容”，文件中必须明确写 `[]`。

请运行 [第一项实验](04-实验手册.md#实验一逐层观察-config-整段替换)，亲眼观察每个后续层如何让上一层的独有键消失。

