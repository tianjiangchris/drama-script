import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import {
  dramaPaths,
  jsonResult,
  readReference,
  readTextFile,
  resolveProjectRoot,
  textResult,
} from "../lib/paths.js";
import { analyzeScript, parseScenes, scoreFromMetrics } from "../lib/parser.js";

export const evaluateScriptSchema = {
  project_root: z.string().optional(),
  script_path: z
    .string()
    .optional()
    .describe("剧本文件路径；与 script_content 二选一"),
  script_content: z.string().optional().describe("剧本正文；与 script_path 二选一"),
  episode: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("集数，用于加载对应 adaptation brief"),
};

export const validateScriptSchema = {
  script_content: z.string().describe("待校验的剧本正文"),
};

export const getScriptTemplateSchema = {
  episode: z.number().int().min(1),
  title: z.string().describe("集标题/副标题"),
};

export type EvaluateScriptArgs = {
  project_root?: string;
  script_path?: string;
  script_content?: string;
  episode?: number;
};

export type ValidateScriptArgs = {
  script_content: string;
};

export type GetScriptTemplateArgs = {
  episode: number;
  title: string;
};

function gradeFromScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

export async function evaluateScript(args: EvaluateScriptArgs) {
  let content = args.script_content ?? "";
  const root = resolveProjectRoot(args.project_root);

  if (!content && args.script_path) {
    const scriptPath = path.isAbsolute(args.script_path)
      ? args.script_path
      : path.join(root, args.script_path);
    try {
      content = await readTextFile(scriptPath);
    } catch {
      return textResult(`错误：无法读取剧本 ${scriptPath}`);
    }
  }

  if (!content.trim()) {
    return textResult("错误：请提供 script_content 或 script_path");
  }

  const metrics = analyzeScript(content);
  const scenes = parseScenes(content);
  const { structure_score, pacing_hints } = scoreFromMetrics(metrics);

  let brief: Record<string, unknown> | null = null;
  if (args.episode) {
    const briefPath = path.join(
      dramaPaths(root).briefs,
      `episode_${String(args.episode).padStart(3, "0")}.json`,
    );
    try {
      brief = JSON.parse(await fs.readFile(briefPath, "utf-8"));
    } catch {
      /* no brief */
    }
  }

  const automatedBase = structure_score + (metrics.has_episode_hook ? 8 : 0);
  const estimatedOverall = Math.min(
    100,
    automatedBase +
      (metrics.dialogue_ratio >= 0.55 ? 12 : 6) +
      (metrics.long_lines_count <= 2 ? 10 : 5) +
      (metrics.scene_count >= 2 && metrics.scene_count <= 5 ? 10 : 5),
  );

  const rubric = await readReference("evaluation-rubric.md");

  const report = {
    automated_assessment: {
      estimated_score_range: `${Math.max(estimatedOverall - 15, 0)}–${estimatedOverall}`,
      note: "此为结构/节奏自动化预估，完整评分需 Agent 按 rubric 做 qualitative 评估",
      metrics,
      structure_score,
      pacing_hints,
      scene_summaries: scenes.map((s) => ({
        number: s.number,
        time: s.time,
        location: s.location,
        characters: s.characters,
        line_count: s.lines.length,
      })),
    },
    adaptation_brief: brief,
    agent_evaluation_task: {
      instruction:
        "请阅读 evaluation_rubric（资源 drama://evaluation-rubric），结合 automated_assessment，输出完整 JSON 评分报告",
      required_output_schema: {
        overall_score: "number 0-100",
        grade: "A|B|C|D",
        dimensions: {
          pacing_hooks: { score: "number", max: 25, notes: "string" },
          dialogue: { score: "number", max: 25, notes: "string" },
          visualization: { score: "number", max: 20, notes: "string" },
          structure: { score: "number", max: 15, notes: "string" },
          adaptation_fit: { score: "number", max: 15, notes: "string" },
        },
        strengths: ["string"],
        issues: [
          {
            severity: "high|medium|low",
            location: "string",
            problem: "string",
            fix: "string",
          },
        ],
        rewrite_priority: ["string"],
      },
      preliminary_grade: gradeFromScore(estimatedOverall),
    },
    rubric_excerpt: rubric.slice(0, 800) + "\n…完整量表见资源 drama://evaluation-rubric",
  };

  return jsonResult(report);
}

export async function validateScript(args: ValidateScriptArgs) {
  const metrics = analyzeScript(args.script_content);
  const { structure_score, pacing_hints } = scoreFromMetrics(metrics);
  const passed = metrics.format_issues.length === 0 && pacing_hints.length <= 1;

  return jsonResult({
    passed,
    structure_score,
    metrics,
    pacing_hints,
    format_issues: metrics.format_issues,
  });
}

export async function getScriptTemplate(args: GetScriptTemplateArgs) {
  const template = `第 ${args.episode} 集 · ${args.title}

【场次 1】
时间：
地点：
人物：

△ 

角色名：

【场次 2】
时间：
地点：
人物：

△ 

角色名：

---
# 写作提醒
- 单集 400–900 字，2–5 场
- 台词 ≥55%，单句 ≤25 字
- 集末必须有钩子
`;

  return textResult(template);
}
