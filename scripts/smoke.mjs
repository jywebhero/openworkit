import { _electron as electron } from 'playwright'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = path.resolve(import.meta.dirname, '..')
const home = mkdtempSync(path.join(tmpdir(), 'openwork-smoke-'))

function seed(rel, slug, description) {
  const dir = path.join(home, rel, slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${slug}\ndescription: ${description}\n---\n\n# ${slug}\n\nSmoke test body.\n`,
    'utf8'
  )
}

seed('.agents/skills', 'alpha-skill', 'First smoke skill')
seed('.agents/skills', 'beta-skill', 'Second smoke skill')
seed('.claude/skills', 'gamma-skill', 'Third smoke skill')
mkdirSync(path.join(home, '.qoder-cn/skills'), { recursive: true })
mkdirSync(path.join(home, '.codex/skills'), { recursive: true })
mkdirSync(path.join(home, '.trae-cn/skills'), { recursive: true })
writeFileSync(
  path.join(home, '.qoder-cn/settings.json'),
  JSON.stringify({
    mcpServers: {
      GitHub: {
        url: 'https://api.githubcopilot.com/mcp/',
        qoder_url: 'https://mcp.qoder.cn/api/v1/mcp/servers/example',
        type: 'http'
      },
      Cloudflare: { url: 'https://mcp.cloudflare.com/mcp', type: 'http', disabled: true }
    }
  }),
  'utf8'
)
mkdirSync(path.join(home, '.workbuddy/connectors/default'), { recursive: true })
writeFileSync(
  path.join(home, '.workbuddy/connectors/default/mcp.json'),
  JSON.stringify({
    mcpServers: {
      'connector:workbuddy-demo': { command: 'npx', args: ['-y', 'workbuddy-demo'] },
      'connector:disabled-demo': { url: 'https://example.com/mcp', disabled: true }
    }
  }),
  'utf8'
)
mkdirSync(path.join(home, '.config/opencode'), { recursive: true })
writeFileSync(
  path.join(home, '.config/opencode/opencode.json'),
  JSON.stringify({
    mcp: {
      'opencode-local': { type: 'local', command: ['npx', '-y', 'opencode-local'] },
      'opencode-remote': { type: 'remote', url: 'https://opencode.example.com/mcp' },
      'opencode-off': { type: 'local', command: ['npx', 'off'], enabled: false }
    }
  }),
  'utf8'
)
mkdirSync(path.join(home, '.pi/agent'), { recursive: true })
writeFileSync(
  path.join(home, '.pi/agent/mcp.json'),
  JSON.stringify({ mcpServers: { 'pi-demo': { command: 'pi-mcp', args: ['--stdio'] } } }),
  'utf8'
)
mkdirSync(path.join(home, '.codex'), { recursive: true })
writeFileSync(
  path.join(home, '.codex/config.toml'),
  [
    'model = "demo"',
    '',
    '[mcp_servers.codex-demo]',
    'command = "npx"',
    'args = [',
    '  "-y",',
    '  "@demo/context7",',
    ']',
    '',
    '[mcp_servers.codex-remote]',
    'url = "https://codex.example.com/mcp"',
    'http_headers = { "Authorization" = "Bearer demo" }',
    ''
  ].join('\n'),
  'utf8'
)
mkdirSync(path.join(home, 'Library/Application Support/Trae CN/User'), { recursive: true })
writeFileSync(
  path.join(home, 'Library/Application Support/Trae CN/User/mcp.json'),
  JSON.stringify({
    mcpServers: { 'trae-demo': { command: 'npx', args: ['-y', 'trae-demo'], type: 'stdio' } }
  }),
  'utf8'
)

const app = await electron.launch({
  args: [path.join(root, 'out/main/index.js')],
  env: {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key !== 'ELECTRON_RUN_AS_NODE')
    ),
    HOME: home,
    OPENWORK_USER_DATA: path.join(home, 'user-data')
  }
})

try {
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => window.api.settings.reset())

  const call = (fn, ...args) =>
    page.evaluate(({ fn, args }) => window.api.skills[fn](...args), { fn, args })

  const scan = await call('scan')
  assert.equal(scan.skills.length, 3, `expected 3 skills, got ${scan.skills.length}`)
  const names = scan.skills.map((s) => s.slug).sort()
  assert.deepEqual(names, ['alpha-skill', 'beta-skill', 'gamma-skill'])
  assert.equal(scan.skills.every((s) => s.enabled), true)
  assert.equal(scan.skills.every((s) => s.hasFrontmatter), true)
  const codexDir = scan.dirs.find((dir) => dir.id === 'user-codex')
  assert.ok(codexDir, 'detected codex skills directory')
  assert.equal(codexDir.path, path.join(home, '.codex/skills'))
  console.log('scan ok:', scan.skills.map((s) => `${s.slug}(${s.files}f)`).join(', '))

  const connectors = await page.evaluate(() => window.api.connectors.scan())
  const github = connectors.servers.find((server) => server.name === 'GitHub')
  assert.ok(github, 'qoder-cn settings.json mcp server detected')
  assert.equal(github.transport, 'http')
  assert.equal(github.url, 'https://api.githubcopilot.com/mcp/')
  assert.equal(github.scope, 'user')
  assert.ok(
    connectors.files.some(
      (file) => file.path === path.join(home, '.qoder-cn/settings.json') && file.count === 1
    ),
    'qoder-cn settings.json listed with one server'
  )
  assert.ok(
    !connectors.servers.some((server) => server.name === 'Cloudflare'),
    'disabled mcp server hidden'
  )
  console.log('connectors ok:', connectors.servers.map((s) => `${s.name}(${s.transport})`).join(', '))

  const server = (name) => connectors.servers.find((entry) => entry.name === name)
  const workbuddy = server('connector:workbuddy-demo')
  assert.ok(workbuddy, 'workbuddy mcp server detected')
  assert.equal(workbuddy.command, 'npx -y workbuddy-demo')
  assert.equal(server('connector:disabled-demo'), undefined, 'workbuddy disabled server hidden')
  assert.ok(
    connectors.files.some((file) => file.path === path.join(home, '.workbuddy/connectors/default/mcp.json'))
  )

  assert.equal(server('opencode-local').command, 'npx -y opencode-local', 'opencode array command joined')
  assert.equal(server('opencode-local').transport, 'stdio')
  assert.equal(server('opencode-remote').url, 'https://opencode.example.com/mcp')
  assert.equal(server('opencode-remote').transport, 'http')
  assert.equal(server('opencode-off'), undefined, 'opencode disabled server hidden')

  assert.equal(server('pi-demo').command, 'pi-mcp --stdio', 'pi mcp server detected')

  assert.equal(server('codex-demo').command, 'npx -y @demo/context7', 'codex toml multi-line args')
  assert.equal(server('codex-demo').transport, 'stdio')
  assert.equal(server('codex-remote').transport, 'http', 'codex toml remote server')
  assert.equal(server('trae-demo').transport, 'stdio', 'trae mcp server detected')
  assert.equal(github.agent, 'qoder')
  assert.equal(workbuddy.agent, 'workbuddy')
  assert.equal(server('opencode-local').agent, 'opencode')
  assert.equal(server('pi-demo').agent, 'pi')
  assert.equal(server('codex-demo').agent, 'codex')
  assert.equal(server('trae-demo').agent, 'trae-work-cn')
  console.log('agents connectors ok')

  const beta = scan.skills.find((s) => s.slug === 'beta-skill')
  await call('toggle', beta.path, false)
  assert.ok(existsSync(path.join(home, '.agents/skills/beta-skill.disabled')))
  assert.ok(!existsSync(path.join(home, '.agents/skills/beta-skill')))
  let after = await call('scan')
  const betaDisabled = after.skills.find((s) => s.slug === 'beta-skill')
  assert.equal(betaDisabled.enabled, false)
  assert.ok(betaDisabled.path.endsWith('.disabled'))
  await call('toggle', betaDisabled.path, true)
  assert.ok(existsSync(path.join(home, '.agents/skills/beta-skill')))
  console.log('toggle ok')

  const install = await call('install', {
    slug: 'installed-demo',
    name: 'Installed Demo',
    description: 'Created by the smoke test'
  })
  assert.equal(install.ok, true, JSON.stringify(install))
  assert.ok(existsSync(path.join(home, '.agents/skills/installed-demo/SKILL.md')))
  const duplicate = await call('install', {
    slug: 'installed-demo',
    name: 'Installed Demo',
    description: 'Created by the smoke test'
  })
  assert.equal(duplicate.error, 'exists')
  console.log('install ok (duplicate guarded)')

  const read = await call('read', path.join(home, '.agents/skills/installed-demo'))
  assert.match(read.content, /name: installed-demo/)
  assert.match(read.content, /description: Created by the smoke test/)
  console.log('read ok')

  let rejected = false
  try {
    await call('read', path.join(home, '.agents/not-a-skill'))
  } catch {
    rejected = true
  }
  assert.ok(rejected, 'read outside configured dirs should be rejected')
  console.log('path whitelist ok')

  const gamma = after.skills.find((s) => s.slug === 'gamma-skill')
  await call('remove', gamma.path)
  assert.ok(!existsSync(path.join(home, '.claude/skills/gamma-skill')))
  after = await call('scan')
  assert.equal(after.skills.length, 3)
  console.log('remove ok (moved out of skills dir)')

  symlinkSync('../../.agents/skills/alpha-skill', path.join(home, '.claude/skills/linked-alpha'))
  after = await call('scan')
  const linked = after.skills.find((s) => s.slug === 'linked-alpha')
  assert.equal(linked.isSymlink, true)
  assert.equal(linked.linkTarget, path.join(home, '.agents/skills/alpha-skill'))
  console.log('symlink detection ok')

  await page.evaluate(() => {
    location.hash = '#/installed'
  })
  await page.getByRole('switch').first().waitFor()

  const waitFor = async (predicate, label) => {
    for (let i = 0; i < 40; i += 1) {
      if (await predicate()) return
      await page.waitForTimeout(100)
    }
    throw new Error(`timed out waiting for ${label}`)
  }

  const disabledFolders = () =>
    readdirSync(path.join(home, '.agents/skills')).filter((name) => name.endsWith('.disabled'))

  await page.getByRole('switch').first().click()
  await waitFor(() => disabledFolders().length === 1, 'ui disable rename')
  await page.getByRole('switch', { name: /^(启用|Enable)$/ }).click()
  await waitFor(() => disabledFolders().length === 0, 'ui enable rename')
  console.log('ui toggle ok')

  const tabs = page.getByRole('tab')
  await waitFor(async () => (await tabs.count()) === 5, 'agent directory tabs')
  await page.getByRole('tab', { name: /TRAE Work/ }).click()
  await page.getByRole('tab', { name: /Codex/ }).click()
  await page.getByRole('tab', { name: /Claude/ }).click()
  await page.getByRole('img', { name: /软链接|Symlink/ }).first().waitFor()
  await page.getByText('alpha-skill', { exact: true }).waitFor()
  await page.getByRole('tab', { name: /Agents/ }).click()
  await page.getByText('alpha-skill', { exact: true }).waitFor()
  console.log('ui agent tabs ok')

  await page.evaluate(() => {
    location.hash = '#/connectors'
  })
  await page.getByText('GitHub', { exact: true }).waitFor()
  await page.getByText('Qoder', { exact: true }).filter({ visible: true }).waitFor()
  await page.getByText('TRAE Work', { exact: true }).filter({ visible: true }).first().waitFor()
  assert.ok((await page.locator('svg').count()) > 8, 'connector cards render agent logos')
  console.log('ui connector agent icons ok')

  await page.evaluate(() => {
    location.hash = '#/'
  })
  await page.getByPlaceholder('搜索').or(page.getByPlaceholder('Search')).waitFor()
  for (const label of ['推荐', '趋势', '热门', '官方']) {
    assert.equal(await page.getByRole('button', { name: label, exact: true }).count(), 1)
  }
  console.log('market views render ok')

  // Base UI overlay family: dialog, tooltip, menu, sheet, select.
  await page
    .getByRole('button', { name: /添加技能|Add skill/ })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /选择文件夹|Choose folder/ }).waitFor()
  assert.equal(await dialog.count(), 1, 'dialog opens')
  await dialog.getByRole('button', { name: 'Close' }).click()
  await waitFor(async () => (await dialog.count()) === 0, 'dialog closes on close button')

  await page.getByRole('button', { name: /添加技能|Add skill/ }).click()
  await dialog.getByRole('button', { name: /选择文件夹|Choose folder/ }).waitFor()
  await page.keyboard.press('Escape')
  await waitFor(async () => (await dialog.count()) === 0, 'dialog closes on escape')
  console.log('ui dialog ok')

  await page.evaluate(() => {
    location.hash = '#/installed'
  })
  const refreshTrigger = page.locator('button:has(svg.lucide-refresh-cw)').first()
  await refreshTrigger.waitFor()
  await refreshTrigger.hover()
  // Base UI's tooltip popup carries no role attribute; assert on the portal content.
  const tooltip = page.locator('[data-base-ui-portal]').getByText(/重新扫描|Rescan/)
  await waitFor(async () => (await tooltip.count()) === 1, 'tooltip opens on hover')
  await page.screenshot({ path: '/tmp/baseui-tooltip.png' })
  await page.mouse.move(0, 0)
  await waitFor(async () => (await tooltip.count()) === 0, 'tooltip hides on leave')
  console.log('ui tooltip ok')

  await page.locator('button:has(svg.lucide-more-horizontal)').first().click()
  const menuText = page.getByText(/查看 SKILL\.md|View SKILL\.md/)
  await menuText.waitFor()
  await page.screenshot({ path: '/tmp/baseui-dropdown-menu.png' })
  await menuText.click()
  await waitFor(async () => (await menuText.count()) === 0, 'menu closes on item click')
  const sheet = page.getByRole('dialog')
  await sheet.getByText('alpha-skill').first().waitFor()
  console.log('ui menu + sheet ok')
  await page.keyboard.press('Escape')
  await waitFor(async () => (await sheet.count()) === 0, 'sheet closes on escape')

  await page.evaluate(() => {
    location.hash = '#/settings/preferences'
  })
  const selectTrigger = page.getByRole('combobox').first()
  await selectTrigger.waitFor()
  const before = await selectTrigger.innerText()
  await selectTrigger.click()
  await page.getByRole('listbox').waitFor()
  await page.screenshot({ path: '/tmp/baseui-select.png' })
  const options = page.getByRole('option')
  const labels = (await options.allInnerTexts()).map((text) => text.trim())
  assert.ok(labels.length > 1, `select lists directories, got ${labels.length}`)
  const nextIndex = labels.findIndex((text) => text !== before.trim())
  assert.ok(nextIndex >= 0, 'select offers another directory')
  await options.nth(nextIndex).click()
  await waitFor(async () => (await selectTrigger.innerText()).trim() === labels[nextIndex], 'select shows new label')
  assert.equal(await page.getByRole('listbox').count(), 0, 'select popup closes')
  console.log('ui select ok')

  await page.evaluate(async () => {
    await window.api.settings.set({ theme: 'dark', language: 'en' })
  })
  const persisted = JSON.parse(
    readFileSync(path.join(home, 'user-data/settings.json'), 'utf8')
  )
  assert.equal(persisted.theme, 'dark')
  assert.equal(persisted.language, 'en')
  console.log('settings persistence ok')

  console.log('\nall smoke checks passed')
} finally {
  await app.close()
  rmSync(home, { recursive: true, force: true })
}
