import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

// macOS shows the Dock/Cmd-Tab name from the running bundle's Info.plist, not from
// app.setName(), so the dev bundle has to carry the product name.
const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'node_modules/electron/dist')
const pathFile = path.join(root, 'node_modules/electron/path.txt')

if (!existsSync(pathFile)) {
  console.log('electron dev bundle not installed, skipping')
  process.exit(0)
}

const bundle = path.join(dist, readFileSync(pathFile, 'utf8').trim().split('/')[0])
const plist = path.join(bundle, 'Contents/Info.plist')
if (!existsSync(plist)) {
  console.log('no Info.plist at', plist)
  process.exit(0)
}

const wanted = {
  CFBundleName: 'OpenWorkit',
  CFBundleDisplayName: 'OpenWorkit',
  CFBundleIdentifier: 'com.openworkit.app'
}

const current = spawnSync('plutil', ['-p', plist], { encoding: 'utf8' }).stdout
let changed = 0
for (const [key, value] of Object.entries(wanted)) {
  if (new RegExp(`"${key}" => "${value}"`).test(current)) continue
  const result = spawnSync('plutil', ['-replace', key, '-string', value, plist], {
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    console.error(`failed to set ${key}:`, result.stderr.trim())
    process.exit(1)
  }
  changed += 1
}

console.log(changed ? `patched dev bundle name (${changed} keys)` : 'dev bundle name already set')
