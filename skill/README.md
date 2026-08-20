# drama-script Skill

Cursor Agent Skill：小说改竖屏短剧剧本 + 修改后剧本评估。

> 本目录是 [drama-script](../README.md) monorepo 的 Skill 部分。完整安装见根目录 `./install.sh`。

## 安装

推荐在仓库根目录运行：

```bash
./install.sh
```

手动安装 Skill：

```bash
mkdir -p ~/.cursor/skills
cp -r skill ~/.cursor/skills/drama-script
```

Skill 依赖 MCP 服务，须同时配置 `drama-script` MCP（见根目录 README）。

## 使用

在 Cursor Agent 中提及「短剧剧本」「小说改编」「评估剧本」，或 @ 引用本 skill。

### 工作流

```
小说 ──→ 短剧剧本 ──→ 你手动修改 ──→ 评估报告
         (流程 A)                    (流程 B)
```

**改编示例：**

> 把 `source/ch01.md` 改编成第 1 集短剧剧本，题材复仇，目标是建立女主受辱处境。

**评估示例：**

> 我改好了第 1 集，帮我评估一下。（粘贴剧本或给文件路径）

## 目录结构

```
skill/
├── SKILL.md                      # 主指令
├── README.md                     # 本文件
└── references/
    ├── script-format.md          # 剧本格式规范
    ├── adaptation-guide.md       # 改编指南
    └── evaluation-rubric.md      # 评估量表
```
