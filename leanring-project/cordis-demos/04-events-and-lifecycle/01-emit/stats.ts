import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    learningStats: StatsService
  }

  // 声明合并只描述事件名和参数类型，不会在运行时注册事件。
  interface Events {
    'learning/stats/report'(name: string, count: number): void
  }
}

export class StatsService extends Service {
  private counts = new Map<string, number>()

  constructor(ctx: Context) {
    // 将服务实例注册为 ctx.learningStats，并交给当前 Fiber 管理。
    super(ctx, 'learningStats')
  }

  bump(name: string) {
    const next = (this.counts.get(name) ?? 0) + 1
    this.counts.set(name, next)

    // emit 是同步广播：发出方只通知变化，不收集监听器的返回值。
    this.ctx.emit('learning/stats/report', name, next)
  }
}

export const name = 'learning-stats'

export function apply(ctx: Context) {
  ctx.plugin(StatsService)
}
