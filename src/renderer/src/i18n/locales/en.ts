import type { Dictionary } from './zh'

const en: Dictionary = {
  app: {
    name: 'OpenWorkit',
    tagline: 'AI skills & tools'
  },
  nav: {
    market: 'Marketplace',
    installed: 'Installed',
    connectors: 'Connectors',
    settings: 'Settings',
    workspace: 'Workspace',
    global: 'Global',
    local: 'Local'
  },
  common: {
    search: 'Search',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    open: 'Open',
    reveal: 'Show in Finder',
    copy: 'Copy',
    copied: 'Copied',
    refresh: 'Refresh',
    rescan: 'Rescan',
    loading: 'Loading…',
    retry: 'Retry',
    add: 'Add',
    remove: 'Remove',
    done: 'Done',
    back: 'Back',
    path: 'Path',
    version: 'Version',
    more: 'More actions',
    installed: 'Installed',
    unknown: 'Unknown',
    skills: 'skills',
    about: 'About OpenWorkit',
    checkUpdates: 'Check for updates',
    quit: 'Quit OpenWorkit'
  },
  market: {
    title: 'Marketplace',
    subtitle: 'Browse the skills.sh leaderboard in real time and install only one copy into the local shared skills directory, accessible to all agents.',
    addSkill: 'Add skill',
    installedCount: 'Installed ({{count}})',
    featured: 'Featured',
    shuffle: 'Shuffle',
    tabs: {
      recommended: 'Recommended',
      trending: 'Trending',
      hot: 'Hot',
      official: 'Official'
    },
    sort: {
      overall: 'Overall',
      installs: 'Installs',
      weekly: 'This week',
      name: 'Name'
    },
    official: 'Official',
    metrics: {
      allTime: 'All-time installs',
      thisWeek: 'Installs this week',
      last24h: 'Installs in the last 24 hours',
      yesterday: 'Installs yesterday'
    },
    install: 'Install',
    installing: 'Installing…',
    installSuccess: 'Installed {{name}}',
    installExists: '{{name}} already exists in the install directory.',
    installFailed: 'Could not install {{name}}.',
    installNotFound: 'No SKILL.md for {{name}} was found in that repository.',
    installUnsupported: 'Skills published on {{source}} must be installed with the skills CLI.',
    viewCommand: 'View install command',
    noDescription: 'No description available',
    searchingFor: 'Results for “{{query}}”',
    loadMore: 'Load more ({{shown}} / {{total}})',
    emptyTitle: 'No matching skills',
    emptyDesc: 'Try a different keyword.',
    errorTitle: 'Could not reach skills.sh',
    errorDesc: 'Check your network connection and try again.',
    liveNote: 'Live data from skills.sh',
    detail: {
      command: 'Install command',
      copyCommand: 'Copy command',
      openPage: 'Open on skills.sh',
      cliHint:
        'This skill is published on {{source}}. Run the command above in a terminal to install it with the skills CLI.'
    },
    addDialog: {
      title: 'Add a skill',
      desc: 'Import a local folder containing a SKILL.md file. It will be copied into your install directory.',
      target: 'Install directory',
      chooseFolder: 'Choose folder…',
      importing: 'Importing…',
      added: 'Added {{name}}',
      failed: 'Import failed',
      noSkillFile: 'The selected folder has no SKILL.md',
      exists: 'A skill with this folder name already exists'
    }
  },
  installed: {
    title: 'Installed',
    subtitle: '{{count}} skills across {{dirs}} directories.',
    searchPlaceholder: 'Search installed skills',
    openCurrentDir: 'Open directory',
    userScope: 'User',
    projectScope: 'Project',
    disabled: 'Disabled',
    symlink: 'Symlink',
    enable: 'Enable',
    disable: 'Disable',
    delete: 'Move to Trash',
    view: 'View SKILL.md',
    openFolder: 'Show in Finder',
    deleteTitle: 'Move “{{name}}” to Trash?',
    deleteDescription: 'The skill folder will move to the Trash and can be restored from there.',
    deleteConfirm: 'Move to Trash',
    deleted: 'Moved {{name}} to Trash',
    enabledToast: 'Enabled {{name}}',
    disabledToast: 'Disabled {{name}}',
    emptyTitle: 'No skills installed yet',
    emptyDesc: 'Install one from the marketplace or import a local folder.',
    emptyNoDirsTitle: 'No skill directories enabled',
    emptyNoDirsDesc: 'Enable or add a directory in Settings → Skill directories.',
    noMatchTitle: 'No matching skills',
    noMatchDesc: 'Try a different keyword.',
    noSkillsInDirTitle: 'No skills in this directory',
    noSkillsInDirDesc: 'Install one from the marketplace or import a local folder.',
    browse: 'Browse marketplace',
    detail: {
      description: 'Description',
      license: 'License',
      updated: 'Updated',
      files: '{{count}} files',
      filesLabel: 'Files',
      size: 'Size',
      folder: 'Folder',
      linkTarget: 'Link target',
      missingFrontmatter: 'No YAML frontmatter',
      tools: 'Allowed tools'
    },
    loadError: 'Could not scan skills',
    copiedPath: 'Path copied'
  },
  connectors: {
    title: 'Connectors',
    subtitle: 'A read-only view of MCP servers configured by AI clients on this machine.',
    servers: 'MCP servers',
    configFiles: 'Config files',
    emptyTitle: 'No MCP configuration found',
    emptyDesc:
      'Configure MCP servers in Claude, Qoder, Cursor or a project .mcp.json and they will show up here.',
    openConfig: 'Open config',
    serverCount: '{{count}} servers',
    transport: {
      stdio: 'stdio',
      http: 'HTTP',
      sse: 'SSE',
      unknown: 'Unknown'
    },
    scope: {
      user: 'User',
      project: 'Project'
    },
    noServers: 'This file has no MCP servers'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Overview of all settings',
    back: 'Settings',
    sections: {
      workspace: 'Workspace',
      global: 'Global',
      help: 'Help'
    },
    cards: {
      preferences: {
        title: 'Preferences',
        desc: 'Install location, delete confirmation and auto scan.'
      },
      skillDirs: {
        title: 'Skill directories',
        desc: 'Directories scanned for skills.'
      },
      advanced: {
        title: 'Advanced',
        desc: 'Config location, developer tools and reset.'
      },
      appearance: {
        title: 'Appearance & language',
        desc: 'Theme, language and density.'
      },
      shortcuts: {
        title: 'Keyboard shortcuts',
        desc: 'Keys for navigation and search.'
      },
      environment: {
        title: 'Environment',
        desc: 'App paths and environment variables.'
      },
      updates: {
        title: 'Updates',
        desc: 'Version and update channel.'
      }
    },
    help: {
      title: 'Help shape OpenWorkit',
      desc: 'Tell us what feels great and what feels rough. Diagnostics are generated locally and only shared if you choose to.',
      diagnostics: 'Copy diagnostics',
      logs: 'Open log folder',
      config: 'Show config file',
      copied: 'Diagnostics copied to clipboard',
      configMissing: 'Config file has not been created yet'
    },
    appearance: {
      title: 'Appearance & language',
      desc: 'Adjust theme, interface language and density.',
      theme: 'Theme',
      themeDesc: 'System follows your macOS appearance.',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      languageDesc: 'Changes apply immediately.',
      languageSystem: 'System',
      languageZh: '中文',
      languageEn: 'English',
      compact: 'Compact mode',
      compactDesc: 'Tighter cards and rows show more on one screen.'
    },
    preferences: {
      title: 'Preferences',
      desc: 'Control where skills install and how scanning behaves.',
      installTarget: 'Default install directory',
      installTargetDesc: 'Skills from the marketplace or imports are written here.',
      confirmDelete: 'Confirm before deleting',
      confirmDeleteDesc: 'Ask before moving a skill to the Trash.',
      autoScan: 'Scan on launch',
      autoScanDesc: 'Refresh the installed list when the app opens.'
    },
    dirs: {
      title: 'Skill directories',
      desc: 'Folders scanned for skills. Each skill is a folder containing SKILL.md.',
      add: 'Add directory',
      addTitle: 'Add a skill directory',
      addHint: 'Pick the parent folder that contains skill folders.',
      added: 'Directory added',
      duplicate: 'That directory is already in the list',
      enable: 'Enabled',
      installTarget: 'Install target',
      missing: 'Folder not found',
      open: 'Open',
      removeTitle: 'Remove this directory?',
      removeDesc: 'Only removes it from the list. Files on disk are untouched.',
      remove: 'Remove',
      cannotRemoveLast: 'Keep at least one directory.',
      removed: 'Directory removed',
      count: '{{count}} skills'
    },
    advanced: {
      title: 'Advanced',
      desc: 'Debug tools and data locations.',
      configFile: 'Config file',
      configDesc: 'All settings are stored here as JSON.',
      reveal: 'Reveal',
      devtools: 'Developer tools',
      devtoolsDesc: 'Open DevTools for the current window.',
      reset: 'Reset all settings',
      resetDesc: 'Restore defaults without touching skills on disk.',
      resetTitle: 'Reset all settings?',
      resetDescLong:
        'Theme, language and the directory list return to defaults. Skills on disk are not touched.',
      resetDone: 'Settings reset'
    },
    shortcuts: {
      title: 'Keyboard shortcuts',
      desc: 'Common actions are available from the keyboard.',
      focusSearch: 'Focus search',
      navMarket: 'Marketplace',
      navInstalled: 'Installed',
      navConnectors: 'Connectors',
      openSettings: 'Open settings',
      rescan: 'Rescan skills',
      closeDialog: 'Close dialog'
    },
    environment: {
      title: 'Environment',
      desc: 'App paths and process environment (read-only).',
      versions: 'Runtime',
      paths: 'App paths',
      env: 'Environment variables',
      empty: 'No environment variables to show',
      appPath: 'App',
      userData: 'User data',
      configPath: 'Config',
      logsPath: 'Logs',
      installDir: 'Install directory'
    },
    updates: {
      title: 'Updates',
      desc: 'Version information and update channel.',
      current: 'Current version',
      channel: 'Update channel',
      stable: 'Stable',
      beta: 'Beta',
      check: 'Check for updates',
      checking: 'Checking…',
      upToDate: 'You are on the latest version',
      note: 'This is a local development build. Automatic updates are not configured.'
    }
  },
  toasts: {
    error: 'Operation failed',
    forbidden: 'That path is outside the configured skill directories'
  }
}

export default en
