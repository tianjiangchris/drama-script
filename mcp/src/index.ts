import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readReference } from "./lib/paths.js";
import {
  evaluateScript,
  evaluateScriptSchema,
  getScriptTemplate,
  getScriptTemplateSchema,
  validateScript,
  validateScriptSchema,
} from "./tools/evaluate.js";
import {
  initProject,
  initProjectSchema,
  listEpisodes,
  listEpisodesSchema,
  prepareAdaptation,
  prepareAdaptationSchema,
  readSource,
  readSourceSchema,
  saveScript,
  saveScriptSchema,
} from "./tools/project.js";

const server = new McpServer({
  name: "drama-script",
  version: "1.0.0",
});

server.registerTool(
  "init_project",
  {
    description:
      "初始化短剧改编项目，创建 source/、scripts/、.drama-script/ 目录结构",
    inputSchema: initProjectSchema,
  },
  async (args) => initProject(args),
);

server.registerTool(
  "prepare_adaptation",
  {
    description:
      "读取小说章节，提取情节点，生成分集改编 brief，供 Agent 写竖屏短剧剧本",
    inputSchema: prepareAdaptationSchema,
  },
  async (args) => prepareAdaptation(args),
);

server.registerTool(
  "read_source",
  {
    description: "读取小说源文件内容",
    inputSchema: readSourceSchema,
  },
  async (args) => readSource(args),
);

server.registerTool(
  "save_script",
  {
    description: "保存某一集剧本并返回自动化结构指标",
    inputSchema: saveScriptSchema,
  },
  async (args) => saveScript(args),
);

server.registerTool(
  "list_episodes",
  {
    description: "列出项目中已有剧本、改编 brief 与配置",
    inputSchema: listEpisodesSchema,
  },
  async (args) => listEpisodes(args),
);

server.registerTool(
  "get_script_template",
  {
    description: "获取空白竖屏短剧剧本模板",
    inputSchema: getScriptTemplateSchema,
  },
  async (args) => getScriptTemplate(args),
);

server.registerTool(
  "validate_script",
  {
    description: "快速校验剧本格式、字数、场次、台词占比等硬性指标",
    inputSchema: validateScriptSchema,
  },
  async (args) => validateScript(args),
);

server.registerTool(
  "evaluate_script",
  {
    description:
      "评估剧本：返回自动化指标 + 评估量表 + Agent 需完成的 qualitative 评分任务",
    inputSchema: evaluateScriptSchema,
  },
  async (args) => evaluateScript(args),
);

server.registerResource(
  "script-format",
  "drama://script-format",
  {
    description: "竖屏短剧剧本格式规范与符号约定",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "drama://script-format",
        mimeType: "text/markdown",
        text: await readReference("script-format.md"),
      },
    ],
  }),
);

server.registerResource(
  "adaptation-guide",
  "drama://adaptation-guide",
  {
    description: "小说改竖屏短剧的分集策略与改编指南",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "drama://adaptation-guide",
        mimeType: "text/markdown",
        text: await readReference("adaptation-guide.md"),
      },
    ],
  }),
);

server.registerResource(
  "evaluation-rubric",
  "drama://evaluation-rubric",
  {
    description: "剧本质量评估量表（100 分制）",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "drama://evaluation-rubric",
        mimeType: "text/markdown",
        text: await readReference("evaluation-rubric.md"),
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("drama-script MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
