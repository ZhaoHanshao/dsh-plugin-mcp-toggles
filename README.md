# dsh-plugin-mcp-toggles

[![npm version](https://img.shields.io/npm/v/dsh-plugin-mcp-toggles.svg)](https://www.npmjs.com/package/dsh-plugin-mcp-toggles)
[![license](https://img.shields.io/npm/l/dsh-plugin-mcp-toggles.svg)](LICENSE)
[![node](https://img.shields.io/node/v/dsh-plugin-mcp-toggles.svg)](package.json)

为**每个会话**单独开关已安装的 MCP 服务器。

## 它解决什么

MCP 服务器在 DSH profile 里是进程级的：`@deepseek-ai/dsh-mcp-client` 每行连一个
服务器，把 `mcp__<serverName>__<tool>` 注册进**全局**工具层。于是每个会话都看到
同一批 MCP 工具 —— 想让 A 会话只用 REA、B 会话只用别的服务器，原生做不到。

装上本插件后：会话标题栏右侧出现一个 **MCP** 按钮，点开列出已安装的 MCP 服务器，
每行一个开关，**只影响当前会话**。新会话默认全部开启（装上插件不会悄悄改变任何
人现有的能力）。

## 安装

这是一个标准的 DSH bundle 包：`package.json` 里用 `dsh.bundle.patch` 声明要插入的
插件行，用 `dsh.client` 声明 Web 端入口，没有依赖、没有构建步骤，装上即可用。

从 npm 装进当前 profile：

```
plugin_manager action=install_bundle target=dsh-plugin-mcp-toggles
```

`target` 接受任意安装 spec：

```
plugin_manager action=install_bundle target=dsh-plugin-mcp-toggles@0.1.0
plugin_manager action=install_bundle target=github:ZhaoHanshao/dsh-plugin-mcp-toggles
```

装好后重启 DSH，打开任意会话即可看到按钮。

想先读代码或自己打包检查文件清单：

```bash
npm install dsh-plugin-mcp-toggles
npm pack dsh-plugin-mcp-toggles --dry-run   # 只打印将要发布的文件
```

它需要宿主提供 `webServer` 服务与 `conversation.session.header.utilities` /
`conversation.hero.options` 两个槽位，因此要求 DSH 版本不低于它开发时的
`@deepseek-ai/dsh-client-ui-conversation`（运行时 **0.2.1-rc.3**）。

## 用法

1. 打开任意会话 —— 或直接停在**新会话页**。
2. 点标题栏（新会话页则是输入卡片上方那一行）的 **MCP** 按钮。
3. 逐行开关，或点 `全部开启` / `全部关闭`。

按钮上的徽标显示当前状态：`全部开启`、`n/m`、`全部关闭`；部分关闭时按钮转为警示色。

## 两个入口，同一个开关集合

| 槽位 | 出现位置 |
|---|---|
| `conversation.session.header.utilities` | 已有会话的标题栏右侧 |
| `conversation.hero.options` | 新会话落地页，紧跟 workspace 与模式控件之后 |

两处**必须都有**：新会话页的会话页头带 `hideChrome`
（`blank && composerPhase === 'blank'`，见 `ConversationSession.tsx`），此时整个
header 都不渲染，只挂标题栏会让按钮在新会话页上完全消失。两个槽都提供同一个
`sessionId`，所以在哪一处切换都是同一个会话的开关 —— 在新会话页关掉的服务器，
进入对话后依然关着。

## 它怎么工作

`agent.ctx.tools.restrict({ deny })` 是**作用域内**生效的全局工具掩码
（`packages/core/tools/src/index.ts`）。可见性、schema 投影与派发都走同一个解析器，
因此被关掉的工具模型既看不到也调不到，其他会话不受影响。

- 关闭某服务器 → 把它的 `mcp__<server>__*` 工具加进该会话的 deny 集。
- 全部服务器都关闭时，共享的 `list_mcp_resources` 等资源工具一并隐藏
  （`sharedResourceTools: false` 可关掉这个联动）。
- 开关立即生效，无需重启会话或重开服务器。

## 开关存在哪

`$DSH_HOME/mcp-toggles-state.json`：

```json
{ "bySession": { "<sessionId>": { "rea": false } } }
```

键是 sessionId。**没有记录即视为开启** —— 只会记录「关掉」，所以新会话、以及删掉
状态文件之后的会话，都回到全部开启。

## 配置

`cordis.patch.yml` 的行配置：

| 字段 | 默认 | 含义 |
|---|---|---|
| `sharedResourceTools` | `true` | 关闭全部 MCP 时是否连共享资源工具一起隐藏。 |
| `extraServers` | `[]` | 额外要认作 MCP 服务器的名字；用于服务器暂时没有注册任何工具时也能列出来。 |

## 已知限制

- 只管理 **MCP** 工具（`mcp__*` 前缀与共享资源工具），不动其他工具。
- 服务器列表来自 `configEditor.entries()` 里的 `@deepseek-ai/dsh-mcp-client` 行；
  `configEditor` 不可用时退回当前工具名前缀，此时**没有工具**的服务器不会出现在列表里。
- 开关按会话 id 保存；会话被删除后对应记录会保留（无害，不会影响其他会话）。
