import type { Context } from '@deepseek-ai/cordis'
import type {} from './greeter.ts'

export const name = 'learning-greeter-consumer'
export const inject = ['learningGreeter']

export function apply(ctx: Context) {
  console.log(ctx.learningGreeter.greet('Cordis 学习者'))
}
