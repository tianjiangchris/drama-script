import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import {
  dramaPaths,
  jsonResult,
  loadConfig,
  readTextFile,
  resolveProjectRoot,
  saveConfig,
  textResult,
  writeTextFile,
} from "../lib/paths.js";
import { analyzeScript, extractNovelBeats } from "../lib/parser.js";

export const initProjectSchema = {
  project_root: z.string().optional().describe("项目根目录，默认当前工作目录"),
  title: z.string().describe("短剧项目名称"),
  genre: z.string().describe("题材，如：甜宠、复仇、悬疑"),
  target_episodes: z.number().int().min(1).max(200).describe("目标总集数"),
  source_type: z
    .enum(["novel", "outline", "mixed"])
    .default("novel")
    .describe("源材料类型"),
  notes: z.string().optional().describe("改编备注"),
};

export const prepareAdaptationSchema = {
  project_root: z.string().optional(),
  source_path: z
    .string()
    .describe("小说章节或大纲文件路径（相对项目根或绝对路径）"),
  episode: z.number().int().min(1).describe("要改编的目标集数"),
  episode_title: z.string().describe("本集标题/副标题"),
  episode_goal: z.string().describe("本集戏剧目标（本集要达成什么）"),
  hook: z.string().describe("计划集末钩子"),
  source_chapters: z.string().optional().describe("对应源章节范围，如 第3-4章"),
};

export const saveScriptSchema = {
  project_root: z.string().optional(),
  episode: z.number().int().min(1),
  content: z.string().describe("完整剧本正文"),
};

export const readSourceSchema = {
  project_root: z.string().optional(),
  source_path: z.string().describe("源文件路径"),
};

export const listEpisodesSchema = {
  project_root: z.string().optional(),
};

export type InitProjectArgs = {
  project_root?: string;
  title: string;
  genre: string;
  target_episodes: number;
  source_type?: "novel" | "outline" | "mixed";
  notes?: string;
};

export type PrepareAdaptationArgs = {
  project_root?: string;
  source_path: string;
  episode: number;
  episode_title: string;
  episode_goal: string;
  hook: string;
  source_chapters?: string;
};

export type SaveScriptArgs = {
  project_root?: string;
  episode: number;
  content: string;
};

export type ReadSourceArgs = {
  project_root?: string;
  source_path: string;
};

export type ListEpisodesArgs = {
  project_root?: string;
};

export async function initProject(args: InitProjectArgs) {
  const root = resolveProjectRoot(args.project_root);
  const paths = dramaPaths(root);

  await saveConfig(root, {
    title: args.title,
    genre: args.genre,
    target_episodes: args.target_episodes,
    source_type: args.source_type ?? "novel",
    notes: args.notes,
  });

  await fs.mkdir(paths.source, { recursive: true });
  await fs.mkdir(paths.scripts, { recursive: true });
  await fs.mkdir(paths.briefs, { recursive: true });

  return jsonResult({
    ok: true,
    project_root: root,
    directories: paths,
    message: `项目「${args.title}」已初始化。请将小说章节放入 ${paths.source}`,
  });
}

export async function prepareAdaptation(args: PrepareAdaptationArgs) {
  const root = resolveProjectRoot(args.project_root);
  const paths = dramaPaths(root);
  const sourcePath = path.isAbsolute(args.source_path)
    ? args.source_path
    : path.join(root, args.source_path);

  let sourceText: string;
  try {
    sourceText = await readTextFile(sourcePath);
  } catch {
    return textResult(`错误：无法读取源文件 ${sourcePath}`);
  }

  const config = await loadConfig(root);
  const beats = extractNovelBeats(sourceText);
  const briefDoc = {
    episode: args.episode,
    title: args.episode_title,
    goal: args.episode_goal,
    hook: args.hook,
    source_chapters: args.source_chapters ?? path.basename(sourcePath),
    source_path: sourcePath,
    genre: config?.genre ?? "未设定",
    extracted_beats: beats,
    adaptation_instructions: [
      "按 references/script-format.md 格式写场次",
      "每场必须有时间、地点、人物",
      "台词口语化，单句 ≤25 字",
      "集末必须落实 hook 字段中的悬念",
      "删掉不可拍的叙述，心理活动外化为动作/对白",
    ],
    agent_task:
      "请根据以上 brief 与 extracted_beats，将源材料改编为竖屏短剧剧本。写完后调用 evaluate_script 做评估。",
  };

  const briefPath = path.join(
    paths.briefs,
    `episode_${String(args.episode).padStart(3, "0")}.json`,
  );
  await writeTextFile(briefPath, JSON.stringify(briefDoc, null, 2));

  return jsonResult({
    ...briefDoc,
    brief_saved_to: briefPath,
  });
}

export async function saveScript(args: SaveScriptArgs) {
  const root = resolveProjectRoot(args.project_root);
  const paths = dramaPaths(root);
  const filePath = path.join(
    paths.scripts,
    `episode_${String(args.episode).padStart(3, "0")}.md`,
  );
  await writeTextFile(filePath, args.content);

  const metrics = analyzeScript(args.content);
  return jsonResult({
    ok: true,
    saved_to: filePath,
    metrics,
  });
}

export async function readSource(args: ReadSourceArgs) {
  const root = resolveProjectRoot(args.project_root);
  const sourcePath = path.isAbsolute(args.source_path)
    ? args.source_path
    : path.join(root, args.source_path);

  try {
    const content = await readTextFile(sourcePath);
    return jsonResult({
      path: sourcePath,
      char_count: content.replace(/\s/g, "").length,
      preview: content.slice(0, 500) + (content.length > 500 ? "\n…" : ""),
      content,
    });
  } catch {
    return textResult(`错误：无法读取 ${sourcePath}`);
  }
}

export async function listEpisodes(args: ListEpisodesArgs) {
  const root = resolveProjectRoot(args.project_root);
  const paths = dramaPaths(root);
  const config = await loadConfig(root);

  let scriptFiles: string[] = [];
  let briefFiles: string[] = [];
  try {
    scriptFiles = await fs.readdir(paths.scripts);
  } catch {
    /* empty */
  }
  try {
    briefFiles = await fs.readdir(paths.briefs);
  } catch {
    /* empty */
  }

  return jsonResult({
    project_root: root,
    config,
    scripts: scriptFiles.filter((f) => f.endsWith(".md")).sort(),
    briefs: briefFiles.filter((f) => f.endsWith(".json")).sort(),
  });
}
