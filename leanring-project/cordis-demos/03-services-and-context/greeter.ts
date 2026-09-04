import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    learningGreeter: GreeterService
  }
}

export class GreeterService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'learningGreeter')
  }

  greet(who: string) {
    return `你好，${who}！`
  }
}

export const name = 'learning-greeter'

export function apply(ctx: Context) {
  ctx.plugin(GreeterService)
}
