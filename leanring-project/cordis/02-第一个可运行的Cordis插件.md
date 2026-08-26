# 02：第一个可运行的 Cordis 插件

这一篇的目标很小，也很重要：让你亲眼看到“一个 `.ts` 文件如何因为写进 `cordis.yml` 而成为应用的一部分”。先不要急着做服务、事件或 Agent；如果这里跑通了，后面所有复杂配置都只是同一个动作的扩展。

## 你将得到什么

完成后，目录里只有两个文件：一个插件和一个配置。运行启动器后，终端会打印一行文字。

```text
tmp/cordis-tutorial/
├── cordis.yml
└── hello.ts
```

它的运行关系如下：

```mermaid
flowchart LR
  command[运行 vendor/cordis/bin.js] --> root[创建根 Context]
  root --> loader[挂载 Loader]
  loader --> yaml[读取 cordis.yml]
  yaml --> plugin[加载 hello.ts]
  plugin --> apply[调用 apply(ctx)]
  apply --> output[打印消息]
```

## 第 0 步：进入练习目录

在仓库根目录执行：

```sh
mkdir -p tmp/cordis-tutorial
cd tmp/cordis-tutorial
```

这里使用 `tmp/` 的原因很朴素：练习产生的文件不该混进产品源码，也不会进入 Git。后面每次示例都在这个目录替换文件；想保留自己的版本时，可以复制到另一个临时目录。

## 第 1 步：写一个最小插件

创建 `hello.ts`：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'learning-hello'

export function apply(ctx: Context) {
  console.log('你好，Cordis 插件已经被加载。')
}
```

先逐行看，不要被 TypeScript 吓到：

- `import type` 只让编辑器和 TypeScript 知道 `ctx` 的类型，运行时不会导入任何东西。
- `name` 是可选的诊断名称。它不决定服务名，也不决定文件名；当你看到 Fiber 或错误日志时，它能让你知道是哪一个插件。
- `apply` 是 Loader 要调用的入口。Cordis 把当前插件的 Context 作为第一个参数传进来。
- 这个例子还没使用 `ctx`，但保留它是为了强调：插件做事的入口就是上下文，而不是到处创建全局单例。

## 第 2 步：让 Loader 知道它

在同一目录创建 `cordis.yml`：

```yaml
- name: './hello.ts'
```

YAML 中这一项的含义是“挂载这个模块提供的插件”。`name` 可以是相对模块路径，也可以是已安装的包名。这里 `./` 非常关键：它表示相对于配置文件所在目录寻找你的 `hello.ts`。

现在运行：

```sh
node --import tsx ../../vendor/cordis/bin.js
```

预期输出：

```text
你好，Cordis 插件已经被加载。
```

`tsx` 让 Node 能直接执行 `.ts` 练习文件，不需要先 build。启动器本身会创建 Context 和 Loader；它只负责把配置装进去，不会替你编排业务流程。

## 第 3 步：确认你刚刚实际做了什么

很多教程到“打印成功”就结束了，但理解这三层会让你后面少走很多弯路。

1. `hello.ts` 是插件模块。它导出的是一种可挂载的定义，还不是正在运行的实例。
2. `cordis.yml` 是组合说明。它决定这个应用要挂载哪一些定义和各自配置。
3. Loader 为这次挂载创建 Fiber，再调用 `apply(ctx)`。Fiber 结束时，属于它的注册会撤销。

换句话说，删掉 YAML 这一行，`hello.ts` 还在磁盘上，但它不会发生任何事；把同一插件挂载两次，则可能会有两个各自独立的 Fiber。模块存在不等于插件已经运行。

## 一个稍微有用一点的插件

把 `hello.ts` 改成下面这样：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'learning-hello'

export interface Config {
  who?: string
}

export function apply(ctx: Context, config: Config) {
  const who = config.who ?? '学习者'
  console.log(`你好，${who}。今天从一个插件开始。`)
}
```

再把配置改为：

```yaml
- name: './hello.ts'
  config:
    who: 小王
```

再次运行会打印：

```text
你好，小王。今天从一个插件开始。
```

这说明 Loader 会把 `config` 传给 `apply`。不过这里的 `Config` 只是 TypeScript 类型，它在运行时不存在，也不会验证 YAML。现在传错类型，例如 `who: [1, 2]`，这个简陋版本仍会运行，只是行为未必符合预期。真正的配置校验需要导出运行时 schema；官方教程的[配置章节](../../docs/cordis-tutorial/05-config.zh.md)会完整介绍。现在先知道一条原则：**类型注解帮助写代码，schema 才负责拦住用户配置。**

## 三个值得立刻尝试的小实验

### 实验 A：故意写错路径

把 YAML 改为：

```yaml
- name: './helo.ts'
```

文件解析失败时，Cordis 会通过 logger 报告问题。初学时这类错误有时看起来像“什么都没发生”，尤其是没有配置控制台日志输出时。首先检查相对路径和包名拼写，不要把沉默直接归因于框架没有加载。

### 实验 B：在 `apply` 中抛错

```ts
export function apply(ctx: Context, config: Config) {
  throw new Error('我故意让插件初始化失败')
}
```

这次 Fiber 会进入 `FAILED`。它和“等待依赖”的 `PENDING` 不一样：失败有错误可查，等待只是条件尚未满足。以后看到一个插件没有输出，先区分这两种状态，定位速度会快很多。

### 实验 C：加载两个插件

创建 `goodbye.ts`：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'learning-goodbye'

export function apply(ctx: Context) {
  console.log('第二个插件也已加载。')
}
```

配置改为：

```yaml
- name: './hello.ts'
  config:
    who: 小王
- name: './goodbye.ts'
```

你会看到两条输出。这里不要把 YAML 的书写顺序理解为严格启动顺序：Loader 可以并发处理配置项；一旦插件有硬性服务依赖，真正决定它何时启动的是 `inject`。下一篇会把这个“等到需要的能力到位再开工”的机制讲透。

## 常见误区

| 看到的现象 | 常见误解 | 更准确的理解 |
|---|---|---|
| 文件存在却没有输出 | “Cordis 会自动扫描目录。” | Cordis 只会挂载被代码或 `cordis.yml` 明确引用的插件。 |
| 写了 `interface Config` | “配置已经被校验。” | interface 只存在于编译阶段；运行时校验要导出 schema。 |
| 改了 YAML 中两行顺序 | “依赖的启动顺序已保证。” | 用 `inject` 表达服务依赖，不要依赖列表排序。 |
| 插件不打印任何东西 | “插件一定报错了。” | 还可能是路径无法解析、等待依赖，或它本来没有可见副作用。 |

## 收尾：把练习和 Harness 连起来

Harness 的 profile 配置，例如 [`examples/headless-agent/cordis.yml`](../../examples/headless-agent/cordis.yml)，本质上就是这份两行 YAML 的大型版本：每一行选择一个插件，最终组合出 LLM、工具、会话和应用入口。差别不在机制，而在插件数量和服务依赖图。

下一篇会构造第一个真正会协作的例子：一个插件提供 `greeter` 服务，另一个插件声明依赖它并调用它。到那时，`ctx` 才会从“传进来的参数”变成很具体的工作台。
