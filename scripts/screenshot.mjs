import { _electron as electron } from 'playwright'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'screenshots')
mkdirSync(outDir, { recursive: true })
const userData = mkdtempSync(path.join(tmpdir(), 'openwork-shots-'))

const app = await electron.launch({
  args: [path.join(root, 'out/main/index.js')],
  env: {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key !== 'ELECTRON_RUN_AS_NODE')
    ),
    OPENWORK_USER_DATA: userData
  }
})

const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')

const issues = []
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') issues.push(`[${msg.type()}] ${msg.text()}`)
})
page.on('pageerror', (err) => issues.push(`[pageerror] ${err.message}`))

async function shot(name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outDir, `${name}.png`) })
  console.log('captured', name)
}

async function go(hash) {
  await page.evaluate((h) => {
    location.hash = h
  }, hash)
  await page.waitForTimeout(450)
}

async function waitMarket() {
  await page.locator('article h3').first().waitFor({ timeout: 25_000 }).catch(() => {})
  for (let i = 0; i < 30; i += 1) {
    const cards = await page.locator('article h3').count()
    const skeletons = await page.locator('article .animate-pulse').count()
    if (cards > 3 && skeletons === 0) break
    await page.waitForTimeout(500)
  }
  await page.waitForTimeout(600)
}

await page.evaluate(() => window.api.settings.reset())
await page.reload()
await page.waitForTimeout(1000)
await waitMarket()

await shot('01-market-light-zh')

await go('#/settings/appearance')
await page.getByRole('button', { name: '深色' }).click()
await go('#/')
await shot('02-market-dark-zh')

await go('#/settings')
await shot('03-settings-dark-zh')

await go('#/settings/appearance')
await page.getByRole('button', { name: 'English' }).click()
await shot('04-appearance-dark-en')

await go('#/settings')
await shot('05-settings-dark-en')

await page.getByRole('button', { name: 'Light' }).count().catch(() => 0)
await go('#/settings/appearance')
await page.getByRole('button', { name: 'Light', exact: true }).click()
await go('#/settings')
await shot('06-settings-light-en')

await go('#/installed')
await shot('07-installed-light-en')

await page.getByText('ask-matt', { exact: true }).first().click()
await shot('08-installed-detail-en')
await page.keyboard.press('Escape')

await go('#/connectors')
await shot('09-connectors-light-en')

await go('#/')
await waitMarket()
await shot('10-market-light-en')

await go('#/settings/dirs')
await shot('11-dirs-light-en')

await go('#/installed')
await page.getByRole('tab', { name: /Claude/ }).click()
await shot('12-installed-symlinks-en')
await page.getByText('ask-matt', { exact: true }).first().click()
await shot('13-installed-symlink-detail-en')

console.log('\nconsole issues:')
for (const issue of issues) console.log(issue)

await app.close()
rmSync(userData, { recursive: true, force: true })
