import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import type {
  AppInfo,
  AppSettings,
  EnvEntry,
  InstallSkillInput,
  MarketView,
  SkillScanResult
} from '../shared/types'
import { scanConnectors } from './connectors'
import { describeMarket, installMarketSkill, listMarket, searchMarket } from './market'
import { getSettings, resetSettings, settingsPath, updateSettings } from './settings'
import {
  importSkillFolder,
  installSkill,
  readSkill,
  removeSkill,
  scanSkills,
  toggleSkill
} from './skills'

const MARKET_VIEWS: MarketView[] = ['recommended', 'trending', 'hot', 'official']

const ENV_KEYS = [
  'SHELL',
  'PATH',
  'HOME',
  'USER',
  'LANG',
  'LC_ALL',
  'TERM',
  'TERM_PROGRAM',
  'EDITOR',
  'VISUAL',
  'TMPDIR',
  'XDG_CONFIG_HOME'
]

async function rescan(): Promise<SkillScanResult> {
  return scanSkills(getSettings())
}

function appInfo(): AppInfo {
  const settings = getSettings()
  return {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    userData: app.getPath('userData'),
    configPath: settingsPath(),
    logsPath: app.getPath('logs'),
    appPath: app.getAppPath(),
    installDir: settings.skillDirs.find((dir) => dir.id === settings.installDirId)?.path ?? ''
  }
}

function assertSafeExternal(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Blocked protocol')
  }
}

export function registerIpc(): void {
  ipcMain.handle('settings:get', (): AppSettings => getSettings())
  ipcMain.handle('settings:set', (_event, patch: Partial<AppSettings>): AppSettings =>
    updateSettings(patch)
  )
  ipcMain.handle('settings:reset', (): AppSettings => resetSettings())

  ipcMain.handle('skills:scan', (): Promise<SkillScanResult> => rescan())
  ipcMain.handle('skills:toggle', async (_event, target: string, enabled: boolean) => {
    await toggleSkill(getSettings(), target, enabled)
    return rescan()
  })
  ipcMain.handle('skills:remove', async (_event, target: string) => {
    await removeSkill(getSettings(), target)
    return rescan()
  })
  ipcMain.handle('skills:read', (_event, target: string) => readSkill(getSettings(), target))
  ipcMain.handle('skills:install', async (_event, input: InstallSkillInput) => {
    const result = await installSkill(getSettings(), input)
    return result
  })
  ipcMain.handle('skills:importFolder', async () => {
    const window = BrowserWindow.getFocusedWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Select a skill folder',
      properties: ['openDirectory'],
      buttonLabel: 'Add skill'
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    return importSkillFolder(getSettings(), result.filePaths[0])
  })
  ipcMain.handle('skills:pickDirectory', async () => {
    const window = BrowserWindow.getFocusedWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Select a skill directory',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Use directory'
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
  ipcMain.handle('skills:reveal', async (_event, target: string) => {
    shell.showItemInFolder(target)
  })
  ipcMain.handle('skills:open', async (_event, target: string) => {
    await shell.openPath(target)
  })

  ipcMain.handle('market:list', (_event, view: MarketView) => {
    if (!MARKET_VIEWS.includes(view)) throw new Error('Unknown market view')
    return listMarket(view)
  })
  ipcMain.handle('market:search', (_event, query: string) => searchMarket(String(query ?? '')))
  ipcMain.handle(
    'market:describe',
    (event, items: Array<{ source: string; skillId: string }>) =>
      describeMarket(Array.isArray(items) ? items.slice(0, 120) : [], (summaries) => {
        if (!event.sender.isDestroyed()) event.sender.send('market:summary', summaries)
      })
  )
  ipcMain.handle('market:install', (_event, source: string, skillId: string) =>
    installMarketSkill(getSettings(), source, skillId)
  )

  ipcMain.handle('connectors:scan', () => scanConnectors())
  ipcMain.handle('connectors:openConfig', async (_event, target: string) => {
    await shell.openPath(target)
  })

  ipcMain.handle('app:info', (): AppInfo => appInfo())
  ipcMain.handle(
    'app:env',
    (): EnvEntry[] =>
      ENV_KEYS.map((key) => ({ key, value: process.env[key] ?? '' })).filter(
        (entry) => entry.value.length > 0
      )
  )
  ipcMain.handle('app:openExternal', async (_event, url: string) => {
    assertSafeExternal(url)
    await shell.openExternal(url)
  })
  ipcMain.handle('app:openPath', async (_event, target: string) => {
    await shell.openPath(target)
  })
  ipcMain.handle('app:revealPath', (_event, target: string) => {
    shell.showItemInFolder(target)
  })
  ipcMain.handle('app:copyText', (_event, text: string) => {
    clipboard.writeText(text)
  })
  ipcMain.handle('app:openDevTools', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'detach' })
  })
}
