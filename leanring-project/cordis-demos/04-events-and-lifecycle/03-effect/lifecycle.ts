import type { Context } from '@deepseek-ai/cordis'

export const name = 'learning-lifecycle'

function heartbeat(ctx: Context) {
  console.log('后台任务已启动')

  ctx.effect(() => {
    // setInterval 是 Cordis 无法自动识别的外部资源。
    const timer = setInterval(() => {
      console.log('每 200ms 执行一次')
    }, 200)

    // disposer 在 heartbeat 所属 Fiber 卸载时被调用。
    return () => {
      clearInterval(timer)
      console.log('定时器已停止')
    }
  })
}

export function apply(ctx: Context) {
  // 保留子插件的 Fiber，便于这个练习主动演示卸载。
  const fiber = ctx.plugin(heartbeat)

  ctx.effect(() => {
    const timer = setTimeout(async () => {
      // dispose() 会等待 heartbeat 的清理完成后再返回。
      await fiber.dispose()
      console.log('Fiber 已卸载')
      process.exit(0)
    }, 700)

    // 若父插件更早卸载，取消还未触发的演示任务。
    return () => clearTimeout(timer)
  })
}
