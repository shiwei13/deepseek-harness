import type { Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Events {
    'learning/transform'(input: string, next: () => Promise<string>): Promise<string>
  }
}

export const name = 'learning-waterfall'

export function apply(ctx: Context) {
  ctx.on('learning/transform', async (input, next) => {
    // 调用 next() 让下游继续运行，然后再包装它的结果。
    const result = await next()
    return result.toUpperCase()
  })

  ctx.on('learning/transform', async (input, next) => {
    // 这里拥有拦截决定权：命中条件时故意不调用 next()。
    if (input.includes('blocked')) return '此请求已被策略接管'

    // 未拦截时必须把控制权交还给下游。
    return next()
  })

  void (async () => {
    // 双向串行
    // 最后一个函数是整条 waterfall 没有被短路时执行的默认处理。
// 1. 监听器 1 开始执行
// 2. 监听器 1 调用 await next()
// 3. 监听器 2 收到 input = "hello"
// 4. 不包含 blocked，因此监听器 2 调用 next()
// 5. 最终操作返回 "hello"
// 6. "hello" 返回给监听器 2
// 7. 监听器 2把 "hello" 返回给监听器 1
// 8. 监听器 1执行 "hello".toUpperCase()
// 9. 监听器 1返回 "HELLO"
// 10. ctx.waterfall() 最终得到 "HELLO"
// 11. 最外面的 console.log() 打印 "HELLO"
    console.log(await ctx.waterfall('learning/transform', 'hello', async () => 'hello'))
    console.log(await ctx.waterfall('learning/transform', 'blocked request', async () => 'blocked request'))
  })()
}
