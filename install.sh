#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
MCP_DIR="$REPO_ROOT/mcp"
SKILL_SRC="$REPO_ROOT/skill"
SKILL_DEST="${HOME}/.cursor/skills/drama-script"
MCP_JSON="${HOME}/.cursor/mcp.json"

echo "==> drama-script 安装"
echo "    仓库路径: $REPO_ROOT"
echo ""

# Node.js check
if ! command -v node >/dev/null 2>&1; then
  echo "错误: 需要 Node.js >= 20。请从 https://nodejs.org 安装后重试。"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "错误: 需要 Node.js >= 20，当前: $(node -v)"
  exit 1
fi

# Build MCP
echo "==> [1/3] 构建 MCP 服务..."
cd "$MCP_DIR"
npm install --silent
npm run build

# Install Skill
echo "==> [2/3] 安装 Cursor Skill..."
mkdir -p "${HOME}/.cursor/skills"
rm -rf "$SKILL_DEST"
cp -r "$SKILL_SRC" "$SKILL_DEST"
echo "    已安装到: $SKILL_DEST"

# Configure MCP
echo "==> [3/3] 写入 Cursor MCP 配置..."
node - "$REPO_ROOT" "$MCP_JSON" <<'NODE'
const fs = require("fs");
const path = require("path");

const repoRoot = process.argv[2];
const mcpJsonPath = process.argv[3];
const serverEntry = {
  command: "node",
  args: [path.join(repoRoot, "mcp", "dist", "index.js")],
};

let config = { mcpServers: {} };
if (fs.existsSync(mcpJsonPath)) {
  try {
    config = JSON.parse(fs.readFileSync(mcpJsonPath, "utf8"));
  } catch {
    console.warn("    警告: 现有 mcp.json 解析失败，将覆盖写入");
  }
}

config.mcpServers = config.mcpServers || {};
config.mcpServers["drama-script"] = serverEntry;

fs.mkdirSync(path.dirname(mcpJsonPath), { recursive: true });
fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + "\n");
console.log("    已写入: " + mcpJsonPath);
console.log("    MCP 入口: " + serverEntry.args[0]);
NODE

echo ""
echo "✓ 安装完成！"
echo ""
echo "下一步:"
echo "  1. 重启 Cursor（或在 Settings → MCP 刷新 drama-script）"
echo "  2. 确认 MCP 状态为 ready"
echo "  3. 在 Agent 中说：「把这段小说改成第 1 集短剧剧本」"
echo ""
echo "示例项目: examples/demo-project/"
