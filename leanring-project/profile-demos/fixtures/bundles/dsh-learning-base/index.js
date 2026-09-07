export const name = 'learning-observer'

export function apply(ctx, config) {
  console.log(`[learning-observer] received config: ${JSON.stringify(config)}`)
  const requestExit = ctx.get('appExit')
  if (requestExit === undefined) throw new Error('learning-observer requires the dsh launcher appExit service')
  queueMicrotask(() => requestExit(0))
}

