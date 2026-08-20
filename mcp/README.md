# Drama Script MCP

竖屏短剧改编与剧本评估 MCP 服务，供 Cursor Agent 调用。

> 本目录是 [drama-script](../README.md) monorepo 的 MCP 部分。安装与使用说明见根目录 README。

## 功能

| 工具 | 用途 |
|------|------|
| `init_project` | 初始化改编项目目录 |
| `prepare_adaptation` | 从小说章节生成分集改编 brief |
| `read_source` | 读取源小说/大纲 |
| `save_script` | 保存剧本并返回结构指标 |
| `list_episodes` | 查看项目进度 |
| `get_script_template` | 获取空白剧本模板 |
| `validate_script` | 快速校验格式与硬性指标 |
| `evaluate_script` | 自动化指标 + 评估量表 + Agent 定性评分任务 |

| 资源 | 用途 |
|------|------|
| `drama://script-format` | 剧本格式规范 |
| `drama://adaptation-guide` | 改编指南 |
| `drama://evaluation-rubric` | 100 分评估量表 |

## 构建

```bash
npm install
npm run build
```

## 开发模式（免编译）

```bash
npm run dev
```

MCP 配置（`<REPO_ROOT>` 为仓库根目录）：

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

## 典型工作流

### 小说改剧本

1. `init_project`（若未初始化）
2. `prepare_adaptation` 生成 brief
3. Agent 读格式规范与改编指南，写剧本
4. `save_script` 保存
5. `evaluate_script` 评估

### 评估已有剧本

```
evaluate_script(script_path=..., episode=N)
```

Agent 按 evaluation-rubric 输出 JSON 评分报告。
