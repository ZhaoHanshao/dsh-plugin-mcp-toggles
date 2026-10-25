/**
 * dsh-plugin-mcp-toggles — 客户端半。
 *
 * 在**会话标题栏**放一个 MCP 选择按钮：点开后列出已安装的 MCP 服务器，
 * 每行一个开关，只作用于当前会话。不占侧栏入口，也没有独立页面 ——
 * 开关就发生在会话本身里。
 *
 * 模块自包含：只依赖平台种子 `react`。
 */

window.__ModuleLoader__.load({
  id: 'dsh-plugin-mcp-toggles',
  factory: (require) => {
    const React = require('react')

    const NS = 'mcp-toggles'
    const API = '/mcp-toggles/api'
    const TOKEN_META = 'dsh-mcp-toggles'

    // #region 文案

    const zh = {
      'picker.title': '选择本会话可用的 MCP 服务器',
      'picker.loading': '读取中…',
      'picker.empty': '没有已安装的 MCP 服务器',
      'picker.emptyHint': '在 设置 → 插件 里安装一个 MCP 服务器后，它会出现在这里。',
      'picker.failed': '读取失败',
      'picker.retry': '重试',
      'picker.scope': '仅本会话生效',
      'picker.scopeDefault': '将用于之后新建的会话',
      'picker.allOn': '全部开启',
      'picker.allOff': '全部关闭',
      'picker.on': '开',
      'picker.off': '关',
      'picker.disconnected': '未连接',
      'picker.tools': '个工具',
      'picker.shadowed': '本会话隐藏',
      'picker.summary.all': '全部开启',
      'picker.summary.none': '全部关闭',
      'picker.summary.pending': '选择 MCP',
      'picker.saving': '保存中…',
      'picker.unsaved': '未写入磁盘',
    }

    const en = {
      'picker.title': 'Choose the MCP servers this conversation can use',
      'picker.loading': 'Loading…',
      'picker.empty': 'No MCP server is installed',
      'picker.emptyHint': 'Install an MCP server under Settings → Plugins and it shows up here.',
      'picker.failed': 'Load failed',
      'picker.retry': 'Retry',
      'picker.scope': 'Applies to this conversation only',
      'picker.scopeDefault': 'Applies to conversations you start from here',
      'picker.allOn': 'Turn all on',
      'picker.allOff': 'Turn all off',
      'picker.on': 'On',
      'picker.off': 'Off',
      'picker.disconnected': 'not connected',
      'picker.tools': 'tools',
      'picker.shadowed': 'hidden here',
      'picker.summary.all': 'All on',
      'picker.summary.none': 'All off',
      'picker.summary.pending': 'MCP',
      'picker.saving': 'Saving…',
      'picker.unsaved': 'not written to disk',
    }

    // #endregion

    // #region 令牌与请求

    let cachedToken

    /** 从页面 meta 读令牌；插件晚于页面加载时退回路由获取。 */
    async function token() {
      if (cachedToken !== undefined) return cachedToken
      const meta = document.querySelector(`meta[name="${TOKEN_META}"]`)
      if (meta !== null) {
        const value = meta.getAttribute('content')
        if (value !== null && value.length > 0) {
          cachedToken = value
          return cachedToken
        }
      }
      const response = await fetch(`${API}/token`, { credentials: 'same-origin' })
      if (!response.ok) throw new Error(`token ${response.status}`)
      cachedToken = (await response.json()).token
      return cachedToken
    }

    /** 统一请求；非 2xx 抛错并带上服务端消息。 */
    async function api(path, options = {}) {
      const headers = { 'x-mcp-toggles-token': await token() }
      if (options.payload !== undefined) headers['content-type'] = 'application/json'
      const response = await fetch(`${API}${path}`, {
        method: options.method ?? 'GET',
        headers,
        credentials: 'same-origin',
        signal: options.signal,
        ...options.payload === undefined ? {} : { body: JSON.stringify(options.payload) },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error?.message ?? `HTTP ${response.status}`)
      return payload
    }

    // #endregion

    // #region 图标

    /** 插头图标：一眼看出这是「连接」类开关。 */
    function PlugGlyph({ size = 15 }) {
      return React.createElement('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
      },
      React.createElement('path', {
        d: 'M9 3v5M15 3v5',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round',
      }),
      React.createElement('path', {
        d: 'M6.5 8h11v3.2a5.5 5.5 0 0 1-11 0V8Z',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinejoin: 'round',
      }),
      React.createElement('path', {
        d: 'M12 16.7V21',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round',
      }))
    }

    /** 小箭头。 */
    function Caret() {
      return React.createElement('svg', {
        width: 10, height: 10, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
      }, React.createElement('path', {
        d: 'm6 9 6 6 6-6',
        stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    // #endregion

    // 与同区域的系统按钮（open-in-app / agent-terminal / schedule-catalog）保持
    // 同一套尺寸：高 24px、字号 11px、0.5px 边框、--dsw-radius-sm。
    const STYLE = `
.mt-wrap { position: relative; display: inline-flex; flex: none; align-self: center; }
.mt-trigger {
  box-sizing: border-box; display: inline-flex; align-items: center; gap: 4px;
  height: 24px; padding: 3px 6px; max-width: 190px;
  border: .5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-sm);
  background: 0 0; color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family); font-size: 11px; line-height: 16px;
  white-space: nowrap; cursor: pointer;
}
.mt-trigger:hover { background: var(--dsw-alias-interactive-bg-hover); }
.mt-trigger:focus-visible { background: var(--dsw-alias-interactive-bg-hover); outline: none; }
.mt-trigger[data-open="true"] { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-interactive-bg-hover); }
.mt-trigger[data-partial="true"] { color: var(--dsw-alias-state-warn-primary); }
.mt-trigger[data-none="true"] { color: var(--dsw-alias-label-secondary); }
/* 新会话落地页那一行比标题栏更矮更紧凑，和相邻的 workspace／preset 控件同高。 */
.mt-trigger[data-compact="true"] { height: 22px; padding: 2px 6px; font-size: 10.5px; }
.mt-link[data-disabled="true"] { opacity: .5; cursor: default; pointer-events: none; }
.mt-icon { flex: none; display: inline-flex; align-items: center; opacity: .9; }
.mt-name { overflow: hidden; text-overflow: ellipsis; }
.mt-caret { flex: none; display: inline-flex; align-items: center; color: var(--dsw-alias-label-secondary); transition: transform .12s ease; }
.mt-trigger[data-open="true"] .mt-caret { transform: rotate(180deg); }
.mt-menu {
  position: absolute; top: calc(100% + 5px); right: 0; z-index: 60;
  width: 330px; max-height: 60vh; overflow-y: auto; padding: 4px;
  border: .5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-overlay); box-shadow: 0 8px 24px rgba(0,0,0,.16);
}
.mt-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 5px 8px 6px; font-size: 11px; line-height: 16px;
  color: var(--dsw-alias-label-secondary);
}
.mt-headActions { display: inline-flex; align-items: center; gap: 8px; flex: none; }
.mt-link { cursor: pointer; color: var(--dsw-alias-label-secondary); }
.mt-link:hover { color: var(--dsw-alias-brand-primary); }
.mt-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  border-radius: var(--dsw-radius-sm); cursor: pointer;
}
.mt-item:hover { background: var(--dsw-alias-interactive-bg-hover); }
.mt-item[data-busy="true"] { opacity: .6; cursor: default; }
.mt-body { flex: 1; min-width: 0; }
.mt-title { display: flex; align-items: center; gap: 5px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-primary); }
.mt-sub {
  margin-top: 1px; font-size: 10px; line-height: 14px;
  color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mt-badge {
  flex: none; padding: 0 4px; border-radius: var(--dsw-radius-xs);
  font-size: 9.5px; line-height: 14px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
}
.mt-badge[data-tone="warn"] { color: var(--dsw-alias-state-warn-primary); }
.mt-switch {
  flex: none; position: relative; box-sizing: border-box;
  width: 26px; height: 15px; padding: 0; border-radius: 999px;
  border: .5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2); cursor: pointer; transition: background .12s ease;
}
.mt-switch::after {
  content: ""; position: absolute; top: 1.5px; left: 2px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--dsw-alias-label-secondary); transition: transform .12s ease, background .12s ease;
}
.mt-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.mt-switch[aria-checked="true"]::after { transform: translateX(11px); background: var(--dsw-alias-bg-base); }
.mt-switch:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.mt-switch:disabled { opacity: .5; cursor: default; }
.mt-sep { height: .5px; margin: 4px 2px; background: var(--dsw-alias-border-l1); }
.mt-foot {
  display: flex; align-items: center; gap: 6px; padding: 5px 8px;
  font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary);
}
.mt-err { padding: 3px 8px 6px; font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-state-error-primary); }
.mt-btn {
  padding: 3px 8px; border: .5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm);
  background: 0 0; color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family); font-size: 11px; line-height: 16px; cursor: pointer;
}
.mt-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.mt-btn:disabled { opacity: .5; cursor: default; }
`

    // #region 选择器

    /**
     * MCP 开关选择器。
     *
     * 同一个组件用于两处：
     *   - `conversation.session.header.utilities`（有会话时的标题栏工具区）；
     *   - `conversation.hero.options`（新会话落地页那一行）。
     *
     * 后者是必需的：新会话页的会话页头带 `hideChrome`，整个 header 都不渲染，
     * 只挂标题栏会让按钮在新会话页上消失。两处都由槽提供 `sessionId`，因此
     * 开关始终绑定在同一个会话上 —— 在新会话页关掉的服务器，进入对话后依然关着。
     * @param props 会话标准 props、`t`，以及可选的 `compact`。
     */
    function McpPicker({ sessionId, t, compact }) {
      const [open, setOpen] = React.useState(false)
      const [state, setState] = React.useState({ phase: 'loading' })
      const [attempt, setAttempt] = React.useState(0)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState()
      const [notice, setNotice] = React.useState()
      const rootRef = React.useRef(null)

      // 开关按会话 id 保存；槽还没给出会话时没有可写的键。
      const scoped = sessionId !== undefined && sessionId !== null && String(sessionId) !== ''
      const sessionKey = scoped ? String(sessionId) : ''

      // 读当前会话的开关快照：首次渲染与每次重试都读。
      React.useEffect(() => {
        if (!scoped) return undefined
        const controller = new AbortController()
        api(`/state?session=${encodeURIComponent(sessionKey)}`, { signal: controller.signal })
          .then((payload) => {
            if (controller.signal.aborted) return
            setState({ phase: 'ready', data: payload })
          }, (reason) => {
            if (controller.signal.aborted) return
            setState({ phase: 'failed', message: reason instanceof Error ? reason.message : String(reason) })
          })
        return () => { controller.abort() }
      }, [scoped, sessionKey, attempt])

      // 工具集合可能在本插件之外变化（服务器重连）；打开时刷新一次。
      React.useEffect(() => {
        if (!open || !scoped) return undefined
        const controller = new AbortController()
        api(`/state?session=${encodeURIComponent(sessionKey)}`, { signal: controller.signal })
          .then((payload) => {
            if (controller.signal.aborted) return
            setState({ phase: 'ready', data: payload })
          }, () => {})
        return () => { controller.abort() }
      }, [open, scoped, sessionKey])

      // 点击外部或 Esc 关闭。
      React.useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (event) => {
          if (rootRef.current !== null && !rootRef.current.contains(event.target)) setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown)
          document.removeEventListener('keydown', onKeyDown)
        }
      }, [open])

      const data = state.phase === 'ready' ? state.data : undefined
      const servers = data?.servers ?? []
      const enabledCount = data?.enabledCount ?? 0

      const label = !scoped
        ? t('picker.summary.pending')
        : data === undefined
          ? t('picker.loading')
          : servers.length === 0
            ? t('picker.empty')
            : enabledCount === servers.length
              ? t('picker.summary.all')
              : enabledCount === 0
                ? t('picker.summary.none')
                : `${enabledCount}/${servers.length}`

      const tone = servers.length > 0 && enabledCount === 0
        ? 'none'
        : servers.length > 0 && enabledCount < servers.length ? 'partial' : 'all'

      /** 写入一个开关（`server` 省略表示整组）。 */
      const toggle = async (server, enabled) => {
        if (!scoped) return
        setBusy(true)
        setError(undefined)
        setNotice(undefined)
        try {
          const payload = await api('/toggle', {
            method: 'POST',
            payload: { session: sessionKey, server, enabled },
          })
          setState({ phase: 'ready', data: payload })
          if (payload.persisted === false) setNotice(t('picker.unsaved'))
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : String(reason))
        } finally {
          setBusy(false)
        }
      }

      /** 渲染一个服务器行。 */
      const renderRow = (server) => {
        const on = server.enabled === true
        return React.createElement('div', {
          key: server.name,
          className: 'mt-item',
          'data-busy': String(busy),
        },
        React.createElement('div', { className: 'mt-body' },
          React.createElement('div', { className: 'mt-title' },
            server.name,
            server.connected !== true && React.createElement('span', {
              className: 'mt-badge', 'data-tone': 'warn',
            }, t('picker.disconnected'))),
          React.createElement('div', { className: 'mt-sub', title: server.target },
            `${server.tools} ${t('picker.tools')}${server.target === '' ? '' : ` · ${server.target}`}`)),
        React.createElement('button', {
          type: 'button',
          className: 'mt-switch',
          role: 'switch',
          'aria-checked': on,
          'aria-label': server.name,
          disabled: busy,
          onClick: () => { void toggle(server.name, !on) },
        }))
      }

      return React.createElement('div', { className: 'mt-wrap', ref: rootRef },
        React.createElement('style', null, STYLE),
        React.createElement('button', {
          type: 'button',
          className: 'mt-trigger',
          'data-open': String(open),
          'data-partial': String(tone === 'partial'),
          'data-none': String(tone === 'none'),
          'data-compact': String(compact === true),
          title: `${t('picker.title')} — ${label}`,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          onClick: () => { setOpen((value) => !value) },
        },
        React.createElement('span', { className: 'mt-icon' }, React.createElement(PlugGlyph, { size: 13 })),
        React.createElement('span', { className: 'mt-name' }, 'MCP'),
        React.createElement('span', {
          className: 'mt-badge',
          'data-tone': tone === 'none' ? 'warn' : undefined,
        }, label),
        React.createElement('span', { className: 'mt-caret' }, React.createElement(Caret))),

        open && React.createElement('div', {
          className: 'mt-menu',
          role: 'dialog',
          'aria-label': t('picker.title'),
        },
        React.createElement('div', { className: 'mt-head' },
          React.createElement('span', null, scoped ? t('picker.scope') : t('picker.scopeDefault')),
          React.createElement('span', { className: 'mt-headActions' },
            React.createElement('span', {
              className: 'mt-link',
              role: 'button',
              tabIndex: 0,
              'data-disabled': String(!scoped || busy),
              onClick: () => { if (scoped && !busy) void toggle(null, true) },
              onKeyDown: (event) => {
                if (event.key === 'Enter' && scoped && !busy) void toggle(null, true)
              },
            }, t('picker.allOn')),
            React.createElement('span', {
              className: 'mt-link',
              role: 'button',
              tabIndex: 0,
              'data-disabled': String(!scoped || busy),
              onClick: () => { if (scoped && !busy) void toggle(null, false) },
              onKeyDown: (event) => {
                if (event.key === 'Enter' && scoped && !busy) void toggle(null, false)
              },
            }, t('picker.allOff')))),

        !scoped && React.createElement('div', { className: 'mt-foot' }, t('picker.scopeDefault')),
        scoped && state.phase === 'loading'
          && React.createElement('div', { className: 'mt-foot' }, t('picker.loading')),
        state.phase === 'failed' && React.createElement('div', { className: 'mt-err' },
          `${t('picker.failed')}: ${state.message}`,
          React.createElement('button', {
            type: 'button',
            className: 'mt-btn',
            style: { marginLeft: 8 },
            onClick: () => {
              setState({ phase: 'loading' })
              setAttempt((value) => value + 1)
            },
          }, t('picker.retry'))),

        data !== undefined && servers.length === 0 && React.createElement('div', { className: 'mt-foot' },
          t('picker.emptyHint')),

        servers.map(renderRow),

        error !== undefined && React.createElement('div', { className: 'mt-err' }, error),
        notice !== undefined && React.createElement('div', { className: 'mt-foot' }, notice),
        busy && React.createElement('div', { className: 'mt-foot' }, t('picker.saving'))))
    }

    // #endregion

    // #region 插件

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'mcp-toggles: dictionaries')

        // 会话标题栏右侧工具区：选择器天然绑定当前会话。
        ctx.effect(() => ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'mcp-toggles',
          order: -7,
          locale: NS,
        }, McpPicker)), 'mcp-toggles: header picker')

        // 新会话落地页那一行。必需：该页的会话页头整体带 `hideChrome`
        // （`blank && composerPhase === 'blank'`），只挂标题栏会让按钮在
        // 新会话页上完全消失。
        ctx.effect(() => ctx.slots.inject('conversation.hero.options', () => ctx.slots.register({
          name: 'conversation.hero.options',
          id: 'mcp-toggles-hero',
          order: 20,
          locale: NS,
        }, (props) => React.createElement(McpPicker, { ...props, compact: true }))),
        'mcp-toggles: hero picker')
      },
    }
  },
})
