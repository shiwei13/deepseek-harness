import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const demos = [
  ['实验一：层顺序', '01-layer-order/run.ts'],
  ['实验二：Profile 解析', '02-profile-resolution/run.ts'],
  ['实验三：真实 dsh CLI', '03-real-dsh/run.ts'],
] as const

for (const [label, relativeEntry] of demos) {
  process.stdout.write(`\n===== ${label} =====\n`)
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx/esm', join(root, relativeEntry)],
    { cwd: join(root, '../..'), stdio: 'inherit' },
  )
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

