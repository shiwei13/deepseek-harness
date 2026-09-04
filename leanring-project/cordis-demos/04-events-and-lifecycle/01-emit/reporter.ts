import type { Context } from '@deepseek-ai/cordis'
import type {} from './stats.ts'

export const name = 'learning-stats-reporter'
// 在服务准备好前，Cordis 会让该插件保持 PENDING。
export const inject = ['learningStats']

export function apply(ctx: Context) {
  // ctx.on 本身就是 effect，所以监听器会在该 Fiber 卸载时自动撤销。
  ctx.on('learning/stats/report', (name, count) => {
    console.log(`[统计] ${name} = ${count}`)
  })

  ctx.learningStats.bump('tool-call')
  ctx.learningStats.bump('tool-call')
}
