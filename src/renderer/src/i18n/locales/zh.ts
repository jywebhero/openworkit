const zh = {
  app: {
    name: 'OpenWorkit',
    tagline: 'AI 技能与工具'
  },
  nav: {
    market: '技能市场',
    installed: '已安装',
    connectors: '连接器',
    settings: '设置',
    workspace: '工作区',
    global: '全局',
    local: '本地'
  },
  common: {
    search: '搜索',
    cancel: '取消',
    confirm: '确定',
    close: '关闭',
    open: '打开',
    reveal: '在 Finder 中显示',
    copy: '复制',
    copied: '已复制',
    refresh: '刷新',
    rescan: '重新扫描',
    loading: '加载中…',
    retry: '重试',
    add: '添加',
    remove: '移除',
    done: '完成',
    back: '返回',
    path: '路径',
    version: '版本',
    more: '更多操作',
    installed: '已安装',
    unknown: '未知',
    skills: '个技能',
    about: '关于 OpenWorkit',
    checkUpdates: '检查更新',
    quit: '退出 OpenWorkit'
  },
  market: {
    title: '技能市场',
    subtitle: '实时浏览 skills.sh 榜单，只安装一份到本机的技能共享目录，所有agent都可以访问。',
    addSkill: '添加技能',
    installedCount: '已安装 ({{count}})',
    featured: '精选技能',
    shuffle: '换一批',
    tabs: {
      recommended: '推荐',
      trending: '趋势',
      hot: '热门',
      official: '官方'
    },
    sort: {
      overall: '综合',
      installs: '安装量',
      weekly: '本周',
      name: '名称'
    },
    official: '官方',
    metrics: {
      allTime: '累计安装量',
      thisWeek: '本周安装量',
      last24h: '近 24 小时安装量',
      yesterday: '昨日安装量'
    },
    install: '安装',
    installing: '安装中…',
    installSuccess: '已安装 {{name}}',
    installExists: '安装目录里已存在 {{name}}。',
    installFailed: '无法安装 {{name}}。',
    installNotFound: '没有在该仓库里找到 {{name}} 的 SKILL.md。',
    installUnsupported: '{{source}} 上的技能需要通过 skills CLI 安装。',
    viewCommand: '查看安装命令',
    noDescription: '暂无简介',
    searchingFor: '搜索：{{query}}',
    loadMore: '加载更多（{{shown}} / {{total}}）',
    emptyTitle: '没有匹配的技能',
    emptyDesc: '换个关键词试试。',
    errorTitle: '无法连接 skills.sh',
    errorDesc: '请检查网络连接后重试。',
    liveNote: '数据实时来自 skills.sh',
    detail: {
      command: '安装命令',
      copyCommand: '复制安装命令',
      openPage: '在 skills.sh 查看',
      cliHint: '该技能发布在 {{source}}，请在终端运行上面的命令，通过 skills CLI 完成安装。'
    },
    addDialog: {
      title: '添加技能',
      desc: '从本地导入包含 SKILL.md 的文件夹，它会被复制到安装目录。',
      target: '安装目录',
      chooseFolder: '选择文件夹…',
      importing: '正在导入…',
      added: '已添加 {{name}}',
      failed: '导入失败',
      noSkillFile: '所选文件夹里没有 SKILL.md',
      exists: '安装目录里已存在同名技能'
    }
  },
  installed: {
    title: '已安装',
    subtitle: '{{count}} 个技能，来自 {{dirs}} 个目录。',
    searchPlaceholder: '搜索已安装技能',
    openCurrentDir: '打开当前目录',
    userScope: '用户级',
    projectScope: '项目级',
    disabled: '已停用',
    symlink: '软链接',
    enable: '启用',
    disable: '停用',
    delete: '移到废纸篓',
    view: '查看 SKILL.md',
    openFolder: '在 Finder 中显示',
    deleteTitle: '将「{{name}}」移到废纸篓？',
    deleteDescription: '技能文件夹会被移到废纸篓，可以随时从废纸篓恢复。',
    deleteConfirm: '移到废纸篓',
    deleted: '已移除 {{name}}',
    enabledToast: '已启用 {{name}}',
    disabledToast: '已停用 {{name}}',
    emptyTitle: '还没有已安装的技能',
    emptyDesc: '去技能市场安装，或从本地文件夹导入。',
    emptyNoDirsTitle: '没有启用的技能目录',
    emptyNoDirsDesc: '在「设置 → 技能目录」中启用或添加目录。',
    noMatchTitle: '没有匹配的技能',
    noMatchDesc: '换个关键词试试。',
    noSkillsInDirTitle: '这个目录还没有技能',
    noSkillsInDirDesc: '去技能市场安装，或从本地文件夹导入。',
    browse: '去技能市场',
    detail: {
      description: '描述',
      license: '许可',
      updated: '最近修改',
      files: '{{count}} 个文件',
      filesLabel: '文件数',
      size: '占用空间',
      folder: '文件夹',
      linkTarget: '链接目标',
      missingFrontmatter: '缺少 YAML frontmatter',
      tools: '允许的工具'
    },
    loadError: '扫描技能失败',
    copiedPath: '路径已复制'
  },
  connectors: {
    title: '连接器',
    subtitle: '只读展示本机 AI 客户端里配置的 MCP 服务。',
    servers: 'MCP 服务',
    configFiles: '配置文件',
    emptyTitle: '未发现 MCP 配置',
    emptyDesc: '在 Claude、Qoder、Cursor 或项目 .mcp.json 里配置 MCP 服务后，会自动出现在这里。',
    openConfig: '打开配置',
    serverCount: '{{count}} 个服务',
    transport: {
      stdio: 'stdio',
      http: 'HTTP',
      sse: 'SSE',
      unknown: '未知'
    },
    scope: {
      user: '用户级',
      project: '项目级'
    },
    noServers: '配置文件里没有 MCP 服务'
  },
  settings: {
    title: '设置',
    subtitle: '所有设置的概览',
    back: '设置',
    sections: {
      workspace: '工作区',
      global: '全局',
      help: '帮助'
    },
    cards: {
      preferences: {
        title: '偏好设置',
        desc: '安装位置、删除确认与自动扫描。'
      },
      skillDirs: {
        title: '技能目录',
        desc: '应用扫描的技能目录。'
      },
      advanced: {
        title: '高级',
        desc: '配置位置、开发者工具与重置。'
      },
      appearance: {
        title: '外观与语言',
        desc: '主题、语言与界面密度。'
      },
      shortcuts: {
        title: '键盘快捷键',
        desc: '切换页面与搜索的按键。'
      },
      environment: {
        title: '环境',
        desc: '应用路径与环境变量。'
      },
      updates: {
        title: '更新',
        desc: '版本与更新通道。'
      }
    },
    help: {
      title: '帮助我们塑造 OpenWorkit',
      desc: '告诉我们哪里好用、哪里不顺手。诊断信息只在本机生成，由你决定是否分享。',
      diagnostics: '复制诊断信息',
      logs: '打开日志目录',
      config: '查看配置文件',
      copied: '诊断信息已复制',
      configMissing: '配置文件尚未生成'
    },
    appearance: {
      title: '外观与语言',
      desc: '调整主题、界面语言与密度。',
      theme: '主题',
      themeDesc: '跟随系统会在浅色与深色之间自动切换。',
      themeSystem: '跟随系统',
      themeLight: '浅色',
      themeDark: '深色',
      language: '语言',
      languageDesc: '切换后立即生效。',
      languageSystem: '跟随系统',
      languageZh: '中文',
      languageEn: 'English',
      compact: '紧凑模式',
      compactDesc: '缩小卡片与列表间距，一屏显示更多内容。'
    },
    preferences: {
      title: '偏好设置',
      desc: '控制技能的安装位置与本地扫描行为。',
      installTarget: '默认安装目录',
      installTargetDesc: '从市场安装或导入的技能会写入这里。',
      confirmDelete: '删除前确认',
      confirmDeleteDesc: '移除技能前弹出确认对话框。',
      autoScan: '启动时自动扫描',
      autoScanDesc: '打开应用时刷新已安装技能列表。'
    },
    dirs: {
      title: '技能目录',
      desc: '应用会扫描这些目录下包含 SKILL.md 的文件夹。',
      add: '添加目录',
      addTitle: '添加技能目录',
      addHint: '选择包含技能文件夹的父目录。',
      added: '已添加目录',
      duplicate: '该目录已在列表中',
      enable: '启用',
      installTarget: '安装目录',
      missing: '目录不存在',
      open: '打开',
      removeTitle: '移除技能目录？',
      removeDesc: '只会从列表中移除，不会删除磁盘上的文件。',
      remove: '移除',
      cannotRemoveLast: '至少保留一个目录。',
      removed: '目录已移除',
      count: '{{count}} 个技能'
    },
    advanced: {
      title: '高级',
      desc: '调试工具与数据位置。',
      configFile: '配置文件',
      configDesc: '所有设置以 JSON 保存在这里。',
      reveal: '显示',
      devtools: '开发者工具',
      devtoolsDesc: '为当前窗口打开开发者工具。',
      reset: '重置所有设置',
      resetDesc: '恢复默认设置，不会删除磁盘上的技能。',
      resetTitle: '重置所有设置？',
      resetDescLong: '主题、语言和目录列表会恢复默认值，磁盘上的技能不受影响。',
      resetDone: '设置已重置'
    },
    shortcuts: {
      title: '键盘快捷键',
      desc: '常用操作可以直接用键盘完成。',
      focusSearch: '聚焦搜索',
      navMarket: '技能市场',
      navInstalled: '已安装',
      navConnectors: '连接器',
      openSettings: '打开设置',
      rescan: '重新扫描',
      closeDialog: '关闭弹窗'
    },
    environment: {
      title: '环境',
      desc: '应用路径与当前进程环境变量（只读）。',
      versions: '运行时',
      paths: '应用路径',
      env: '环境变量',
      empty: '没有可显示的环境变量',
      appPath: '应用',
      userData: '用户数据',
      configPath: '配置',
      logsPath: '日志',
      installDir: '安装目录'
    },
    updates: {
      title: '更新',
      desc: '版本信息与更新通道。',
      current: '当前版本',
      channel: '更新通道',
      stable: '稳定版',
      beta: 'Beta',
      check: '检查更新',
      checking: '正在检查…',
      upToDate: '当前已是最新版本',
      note: '当前为本地开发版本，自动更新尚未配置。'
    }
  },
  toasts: {
    error: '操作失败',
    forbidden: '该路径不在已配置的技能目录内'
  }
}

export default zh
export type Dictionary = typeof zh
