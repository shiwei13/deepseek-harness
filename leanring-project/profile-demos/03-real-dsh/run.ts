import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(demoRoot, 'fixtures')
const repositoryRoot = resolve(demoRoot, '../..')
const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-real-profile-demo-'))

function runDsh(args: readonly string[], home: string): void {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx/esm', join(repositoryRoot, 'apps/cli/src/bin.ts'), ...args],
    {
      cwd: repositoryRoot,
      env: { ...process.env, DSH_HOME: home },
      stdio: 'inherit',
      timeout: 30_000,
    },
  )
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) throw new Error(`dsh exited with status ${String(result.status)}`)
}

try {
  const home = join(temporaryRoot, 'home')
  const profileDir = join(home, 'profiles', 'learning')
  const profileModules = join(profileDir, 'node_modules')
  mkdirSync(profileModules, { recursive: true })
  cpSync(join(fixtures, 'profile/package.json'), join(profileDir, 'package.json'))
  cpSync(join(fixtures, 'profile/cordis.patch.yml'), join(profileDir, 'cordis.patch.yml'))
  cpSync(join(fixtures, 'home.cordis.patch.yml'), join(home, 'cordis.patch.yml'))
  for (const packageName of ['dsh-learning-base', 'dsh-learning-feature']) {
    cpSync(
      join(fixtures, 'bundles', packageName),
      join(profileModules, packageName),
      { recursive: true },
    )
  }

  process.stdout.write('\n--- dsh --dump-config：查看每一层的来源 ---\n')
  runDsh([
    '--profile', 'learning',
    '--dump-config',
    '--patch', join(fixtures, 'overlay.cordis.patch.yml'),
  ], home)

  process.stdout.write('\n--- dsh 正常启动：插件打印最终 config 后退出 ---\n')
  runDsh([
    '--profile', 'learning',
    '--patch', join(fixtures, 'overlay.cordis.patch.yml'),
  ], home)
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true })
}

