---
name: drama-script
description: >-
  将网文/小说改编为竖屏短剧剧本，并评估用户修改后的剧本质量。使用 drama-script MCP
  工具链。在用户提到短剧剧本、小说改编、剧本评估、分集改编、竖屏短剧，或工作流
  「小说→剧本→修改→评估」时使用。
---

# 短剧剧本改编与评估

## 工作流概览

| 阶段 | 输入 | 输出 |
|------|------|------|
| **改编** | 小说章节/大纲 | 竖屏短剧剧本 |
| **评估** | 用户修改后的剧本 | 结构化评分报告 + 修改建议 |

先判断用户意图，再进入对应流程。两条流程可独立运行，也可串联（改完一集后立刻评估）。

## 前置条件

1. **MCP 服务**：确认 `user-drama-script` 可用（`GetMcpTools` 检查）。若不可用，提示用户运行仓库根目录 `./install.sh` 或在 Cursor MCP 设置中配置 `drama-script`。
2. **项目结构**（推荐）：用 `init_project` 初始化后再改编，便于 brief 存档与批量分集。

```
project/
├── source/           # 小说章节
├── scripts/          # 产出剧本 episode_NNN.md
└── .drama-script/    # config、briefs
```

## 流程 A：小说 → 短剧剧本

### Step 1 — 确认/初始化项目

若用户尚未建项目，收集并调用 `init_project`：

- `title`：短剧名
- `genre`：题材（甜宠/复仇/悬疑等）
- `target_episodes`：目标总集数
- `project_root`：项目根目录

已有项目时，用 `list_episodes` 查看进度，避免重复改编。

### Step 2 — 读取源材料

- 用户提供文件路径 → `read_source`
- 用户直接粘贴正文 → 保存到 `source/` 再 `read_source`，或在本轮对话中直接使用

### Step 3 — 生成分集 brief

调用 `prepare_adaptation`，必填：

| 参数 | 说明 |
|------|------|
| `source_path` | 源章节路径 |
| `episode` | 目标集数 |
| `episode_title` | 本集副标题 |
| `episode_goal` | 本集戏剧目标（谁要什么、发生什么） |
| `hook` | 集末悬念/反转 |
| `source_chapters` | 对应源章节范围（可选） |

若用户未给分集规划，Agent 先读源材料，提出 1 集的目标与 hook，征得确认或直接按题材惯例推进。

### Step 4 — 写剧本

1. 调用 `get_script_template` 获取空白模板
2. 阅读 brief 中的 `extracted_beats` 与 `adaptation_instructions`
3. 按 [script-format.md](references/script-format.md) 写完整剧本

**硬性指标（写完后自检）**：

- 单集 400–800 字，1-3 场
- 每场含时间、地点、人物,非必要不换场
- 台词占比 ≥ 55%，单句 ≤ 25 字
- 集末必须有 hook
- 心理活动外化为 △ 动作或对白，禁止大段旁白

4. 调用 `validate_script` 校验格式
5. 调用 `save_script` 保存到 `scripts/episode_NNN.md`

### Step 5 — 首轮评估（可选）

改编完成后，主动询问是否进入评估；用户同意则跳转 **流程 B**。

---

## 流程 B：修改后剧本 → 评估

适用于用户已手动改稿、需要反馈的场景。

### Step 1 — 获取剧本

以下任一即可：

- `script_path`（项目内 `scripts/episode_NNN.md`）
- 用户粘贴的 `script_content`
- 若已知集数，传 `episode` 以加载对应 adaptation brief

### Step 2 — 调用 MCP 评估

```
evaluate_script(project_root, script_path|script_content, episode?)
```

返回 `automated_assessment`（字数、场次数、台词占比、格式问题等）和 `agent_evaluation_task`。

### Step 3 — Agent 定性评分

结合 [evaluation-rubric.md](references/evaluation-rubric.md) 与 automated 指标，输出完整 JSON 报告：

```json
{
  "overall_score": 78,
  "grade": "B",
  "dimensions": {
    "pacing_hooks": { "score": 20, "max": 25, "notes": "..." },
    "dialogue": { "score": 19, "max": 25, "notes": "..." },
    "visualization": { "score": 15, "max": 20, "notes": "..." },
    "structure": { "score": 13, "max": 15, "notes": "..." },
    "adaptation_fit": { "score": 11, "max": 15, "notes": "..." }
  },
  "strengths": ["..."],
  "issues": [
    { "severity": "high|medium|low", "location": "场次2", "problem": "...", "fix": "..." }
  ],
  "rewrite_priority": ["优先修改项1", "优先修改项2"]
}
```

### Step 4 — 呈现给用户

1. **总评**：分数、等级（A 可拍摄 / B 可用 / C 待改 / D 重写）
2. **亮点**：2–3 条
3. **问题清单**：按 severity 排序，每条含场次定位与具体改法
4. **优先修改项**：最多 3 条，可直接动手改

若用户要求对比修改前后，保留上一轮评估结果做 diff 说明（哪些维度提升/下降）。

---

## 意图路由

| 用户说… | 进入流程 |
|---------|----------|
| 「把这段小说改成剧本」「改编第 N 集」 | A |
| 「帮我评估这个剧本」「我改好了，看看怎么样」 | B |
| 「继续下一集」 | A（Step 3 起，episode + 1） |
| 粘贴小说 + 无其他说明 | A |
| 粘贴剧本 + 无其他说明 | B |

## MCP 工具速查

| 工具 | 用途 |
|------|------|
| `init_project` | 初始化项目目录 |
| `read_source` | 读小说源文件 |
| `prepare_adaptation` | 生成分集 brief |
| `get_script_template` | 空白剧本模板 |
| `validate_script` | 格式/字数硬性校验 |
| `save_script` | 保存剧本 + 结构指标 |
| `evaluate_script` | 自动化指标 + 评估任务 |
| `list_episodes` | 查看项目进度 |

调用前用 `GetMcpTools` 确认 schema；通过 `CallMcpTool` 调用，`server: user-drama-script`。

## 改编要点（精简）

详见 [adaptation-guide.md](references/adaptation-guide.md)。

- 第 1 集前 30 秒必须有主冲突或强悬念
- 内心独白 → 1 句 OS 或拆成对白
- 章末悬念必须加强为集末 hook
- 删掉「他想起」「她意识到」后剧情仍应可懂

## 评估维度（精简）

详见 [evaluation-rubric.md](references/evaluation-rubric.md)。

| 维度 | 权重 |
|------|------|
| 节奏与钩子 | 25 |
| 对白质量 | 25 |
| 可视化 | 20 |
| 结构规范 | 15 |
| 改编契合 | 15 |

## 注意事项

- 改编时以 brief 的 `goal` 和 `hook` 为锚，不擅自跑题
- 评估时区分「格式问题」（validate 可抓）与「戏剧问题」（需人工读感）
- 用户修改后重新评估时，不要重复抄旧报告，聚焦本次改动的影响
- 无 MCP 时：仍可按 reference 文档手工改编/评估，但无法自动算指标
