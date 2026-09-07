import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  composeEntries,
  loadProfile,
} from '../../../packages/boot/app-boot/src/index.ts'

const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(demoRoot, 'fixtures')
const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-profile-resolution-demo-'))

try {
  const installation = join(temporaryRoot, 'installation')
  const installModules = join(installation, 'node_modules')
  mkdirSync(installModules, { recursive: true })
  writeFileSync(join(installation, 'package.json'), JSON.stringify({
    name: 'learning-dsh-installation',
    dependencies: { 'dsh-learning-base': '0.0.0' },
  }, undefined, 2) + '\n')
  cpSync(
    join(fixtures, 'bundles/dsh-learning-base'),
    join(installModules, 'dsh-learning-base'),
    { recursive: true },
  )

  const home = join(temporaryRoot, 'home')
  const profileDir = join(home, 'profiles', 'learning')
  mkdirSync(join(profileDir, 'node_modules'), { recursive: true })
  cpSync(join(fixtures, 'profile/package.json'), join(profileDir, 'package.json'))
  cpSync(join(fixtures, 'profile/cordis.patch.yml'), join(profileDir, 'cordis.patch.yml'))
  cpSync(
    join(fixtures, 'bundles/dsh-learning-feature'),
    join(profileDir, 'node_modules/dsh-learning-feature'),
    { recursive: true },
  )

  const profile = loadProfile(
    'profile-resolution-demo',
    'learning',
    join(installation, 'package.json'),
    home,
  )
  for (const layer of profile.layers) {
    process.stdout.write(`${layer.packageName.padEnd(22)} -> ${relative(temporaryRoot, layer.packageDir)}\n`)
  }
  const entries = composeEntries([
    ...profile.layers.map(layer => layer.patches),
    profile.patches,
  ], warning => process.stderr.write(`[warning] ${warning}\n`))
  const observer = entries.find(entry => entry.id === 'learning-observer')
  process.stdout.write(`final profile config   -> ${JSON.stringify(observer?.config)}\n`)
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true })
}

