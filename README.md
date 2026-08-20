# IP短篇的剧本改编 short drama script
上传1-2万字的短篇小说，结合AI大模型和IP改编业务流程，生成高质量短剧剧本和分段式评估打分。Upload a 10,000‑20,000-word webnovel in text/md format, leverage AI LLM in combination with IP adaptation workflow, generate high‑quality short‑drama scripts and segmented evaluation scoring reports.

将网文/小说改编为竖屏短剧剧本，并对修改后的剧本进行结构化评估。

包含两部分：

| 组件 | 说明 |
|------|------|
| **skill/** | Cursor Agent Skill，编排「改编 → 改稿 → 评估」工作流 |
| **mcp/** | MCP 服务，提供读源、生 brief、校验、评分等工具 |

## 工作流

```
小说 ──→ 短剧剧本 ──→ 你手动修改 ──→ 评估报告
         流程 A                    流程 B
```

## 前置条件

- [Cursor](https://cursor.com) IDE
- Node.js **≥ 20**

## 快速安装

```bash
git clone https://github.com/tianjiangchris/drama-script.git
cd drama-script
chmod +x install.sh
./install.sh
```

安装脚本会自动：

1. 构建 MCP（`npm install && npm run build`）
2. 复制 Skill 到 `~/.cursor/skills/drama-script`
3. 写入 `~/.cursor/mcp.json` 中的 `drama-script` 配置

完成后**重启 Cursor**，在 Settings → MCP 确认 `drama-script` 状态为 **ready**。

## 手动安装

### 1. 构建 MCP

```bash
cd mcp
npm install
npm run build
```

### 2. 安装 Skill

```bash
mkdir -p ~/.cursor/skills
cp -r skill ~/.cursor/skills/drama-script
```

### 3. 配置 MCP

在 `~/.cursor/mcp.json` 中添加（将 `<REPO_ROOT>` 替换为 clone 后的绝对路径）：

```json
{
  "mcpServers": {
    "drama-script": {
      "command": "node",
      "args": ["<REPO_ROOT>/mcp/dist/index.js"]
    }
  }
}
```

## 使用

在 Cursor Agent 中直接描述任务即可，Skill 会在相关场景自动生效：

**改编：**

> 把 `source/ch01.md` 改编成第 1 集短剧剧本，题材复仇，建立女主受辱处境。

**评估：**

> 我改好了第 1 集，帮我评估一下。

也可在对话中 @ 引用 `drama-script` skill。

### 推荐项目结构

用 MCP 的 `init_project` 初始化后，你的短剧项目目录如下：

```
your-drama-project/
├── source/           # 小说章节
├── scripts/          # 剧本 episode_001.md ...
└── .drama-script/
    ├── config.json
    └── briefs/
```

## MCP 工具一览

| 工具 | 用途 |
|------|------|
| `init_project` | 初始化改编项目 |
| `read_source` | 读取小说源文件 |
| `prepare_adaptation` | 生成分集改编 brief |
| `get_script_template` | 空白剧本模板 |
| `save_script` | 保存剧本 |
| `validate_script` | 格式/字数校验 |
| `evaluate_script` | 自动化指标 + 评估任务 |
| `list_episodes` | 查看项目进度 |

## 示例项目

`examples/demo-project/` 含一集完整示例（源小说 + brief + 剧本），可用于试跑：

```bash
# 在 Cursor 中对 Agent 说：
# 用 examples/demo-project 里的 ch01，评估 scripts/episode_001.md
```

## 目录结构

```
drama-script/
├── README.md           # 本文件
├── LICENSE
├── install.sh          # 一键安装
├── mcp/                # MCP 服务源码
├── skill/              # Cursor Skill
└── examples/
    └── demo-project/   # 示例短剧项目
```

## 开发

```bash
cd mcp
npm run dev    # tsx 直接运行，免编译
```

开发模式 MCP 配置：

```json
{
  "mcpServers": {
    "drama-script": {
      "command": "npx",
      "args": ["-y", "tsx", "<REPO_ROOT>/mcp/src/index.ts"]
    }
  }
}
```

## 卸载

```bash
rm -rf ~/.cursor/skills/drama-script
# 手动从 ~/.cursor/mcp.json 删除 "drama-script" 条目
```

## License

[MIT](LICENSE)
