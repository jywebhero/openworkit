import { contextBridge, ipcRenderer } from 'electron'
import type { Api } from '../shared/api'

const api: Api = {
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
    reset: () => ipcRenderer.invoke('settings:reset')
  },
  skills: {
    scan: () => ipcRenderer.invoke('skills:scan'),
    toggle: (path, enabled) => ipcRenderer.invoke('skills:toggle', path, enabled),
    remove: (path) => ipcRenderer.invoke('skills:remove', path),
    read: (path) => ipcRenderer.invoke('skills:read', path),
    install: (input) => ipcRenderer.invoke('skills:install', input),
    importFolder: () => ipcRenderer.invoke('skills:importFolder'),
    pickDirectory: () => ipcRenderer.invoke('skills:pickDirectory'),
    reveal: (path) => ipcRenderer.invoke('skills:reveal', path),
    open: (path) => ipcRenderer.invoke('skills:open', path)
  },
  market: {
    list: (view) => ipcRenderer.invoke('market:list', view),
    search: (query) => ipcRenderer.invoke('market:search', query),
    describe: (items) => ipcRenderer.invoke('market:describe', items),
    onSummary: (handler) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        summaries: Parameters<typeof handler>[0]
      ): void => handler(summaries)
      ipcRenderer.on('market:summary', listener)
      return () => ipcRenderer.removeListener('market:summary', listener)
    },
    install: (source, skillId) => ipcRenderer.invoke('market:install', source, skillId)
  },
  connectors: {
    scan: () => ipcRenderer.invoke('connectors:scan'),
    openConfig: (path) => ipcRenderer.invoke('connectors:openConfig', path)
  },
  app: {
    info: () => ipcRenderer.invoke('app:info'),
    env: () => ipcRenderer.invoke('app:env'),
    openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
    openPath: (path) => ipcRenderer.invoke('app:openPath', path),
    revealPath: (path) => ipcRenderer.invoke('app:revealPath', path),
    copyText: (text) => ipcRenderer.invoke('app:copyText', text),
    openDevTools: () => ipcRenderer.invoke('app:openDevTools')
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  ;(window as unknown as { api: Api }).api = api
}
