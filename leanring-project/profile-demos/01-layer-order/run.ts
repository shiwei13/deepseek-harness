import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  composeEntries,
  loadOverlayPatches,
} from '../../../packages/boot/app-boot/src/index.ts'

const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(demoRoot, 'fixtures')
const layers = [
  ['bundle: base', join(fixtures, 'bundles/dsh-learning-base/cordis.patch.yml')],
  ['bundle: feature', join(fixtures, 'bundles/dsh-learning-feature/cordis.patch.yml')],
  ['profile patch', join(fixtures, 'profile/cordis.patch.yml')],
  ['home patch', join(fixtures, 'home.cordis.patch.yml')],
  ['--patch overlay', join(fixtures, 'overlay.cordis.patch.yml')],
] as const

const loaded = layers.map(([label, path]) => ({
  label,
  patches: loadOverlayPatches('profile-demo', path),
}))

for (let count = 1; count <= loaded.length; count += 1) {
  const warnings: string[] = []
  const entries = composeEntries(
    loaded.slice(0, count).map(layer => layer.patches),
    warning => warnings.push(warning),
  )
  const observer = entries.find(entry => entry.id === 'learning-observer')
  const current = loaded[count - 1]
  process.stdout.write(`${current?.label.padEnd(18)} -> ${JSON.stringify(observer?.config)}\n`)
  for (const warning of warnings) process.stderr.write(`[warning] ${warning}\n`)
}

