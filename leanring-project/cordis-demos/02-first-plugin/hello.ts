import type { Context } from '@deepseek-ai/cordis'

export const name = 'learning-hello'

export function apply(ctx: Context) {
  console.log('你好，Cordis 插件已经被加载。')
}
