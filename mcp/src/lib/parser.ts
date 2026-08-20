export interface SceneBlock {
  number: number;
  time?: string;
  location?: string;
  characters: string[];
  lines: string[];
  raw: string;
}

export interface ScriptMetrics {
  total_chars: number;
  dialogue_chars: number;
  action_chars: number;
  dialogue_ratio: number;
  scene_count: number;
  avg_line_length: number;
  long_lines_count: number;
  has_episode_hook: boolean;
  format_issues: string[];
}

const SCENE_HEADER = /^【场次\s*(\d+)】/;
const META_TIME = /^时间[：:]/;
const META_LOCATION = /^地点[：:]/;
const META_CHARACTERS = /^人物[：:]/;
const DIALOGUE_LINE = /^[^\s△【][^：:]{1,12}[：:]/;
const ACTION_LINE = /^△/;
const EPISODE_HEADER = /^第\s*\d+\s*集/;

const HOOK_KEYWORDS = [
  "？",
  "?",
  "突然",
  "竟然",
  "没想到",
  "究竟",
  "真相",
  "秘密",
  "危险",
  "不要",
  "住手",
  "等等",
  "谁",
  "什么",
  "闪回",
  "短信",
  "电话",
  "门被推开",
  "转身",
  "愣住",
  "震惊",
  "崩溃",
];

export function parseScenes(text: string): SceneBlock[] {
  const scenes: SceneBlock[] = [];
  const chunks = text.split(/(?=【场次\s*\d+】)/g).filter(Boolean);

  for (const chunk of chunks) {
    const headerMatch = chunk.match(SCENE_HEADER);
    if (!headerMatch) continue;

    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const scene: SceneBlock = {
      number: Number(headerMatch[1]),
      characters: [],
      lines: [],
      raw: chunk.trim(),
    };

    for (const line of lines) {
      if (META_TIME.test(line)) scene.time = line.replace(/^时间[：:]\s*/, "");
      else if (META_LOCATION.test(line))
        scene.location = line.replace(/^地点[：:]\s*/, "");
      else if (META_CHARACTERS.test(line)) {
        const chars = line.replace(/^人物[：:]\s*/, "");
        scene.characters = chars.split(/[、,，]/).map((c) => c.trim()).filter(Boolean);
      } else {
        scene.lines.push(line);
      }
    }
    scenes.push(scene);
  }

  return scenes;
}

export function analyzeScript(text: string): ScriptMetrics {
  const scenes = parseScenes(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let dialogueChars = 0;
  let actionChars = 0;
  let dialogueLineCount = 0;
  let longLines = 0;

  for (const line of lines) {
    if (DIALOGUE_LINE.test(line)) {
      const content = line.replace(/^[^：:]+[：:]\s*/, "");
      dialogueChars += content.length;
      dialogueLineCount += 1;
      if (content.length > 25) longLines += 1;
    } else if (ACTION_LINE.test(line)) {
      actionChars += line.replace(/^△\s*/, "").length;
    }
  }

  const totalChars = text.replace(/\s/g, "").length;
  const spokenTotal = dialogueChars + actionChars;
  const avgLineLength =
    dialogueLineCount > 0 ? Math.round(dialogueChars / dialogueLineCount) : 0;

  const formatIssues: string[] = [];
  if (!EPISODE_HEADER.test(text)) {
    formatIssues.push("缺少「第 N 集」标题行");
  }
  if (scenes.length === 0) {
    formatIssues.push("未检测到【场次 N】标记");
  }
  for (const scene of scenes) {
    if (!scene.time) formatIssues.push(`场次 ${scene.number} 缺少「时间」`);
    if (!scene.location) formatIssues.push(`场次 ${scene.number} 缺少「地点」`);
    if (scene.characters.length === 0)
      formatIssues.push(`场次 ${scene.number} 缺少「人物」`);
  }
  if (totalChars < 400) formatIssues.push("字数偏少（<400），可能撑不满 1 分钟");
  if (totalChars > 900) formatIssues.push("字数偏多（>900），可能超过 2 分钟");
  if (scenes.length > 5) formatIssues.push("场次数偏多（>5），节奏可能碎");
  if (scenes.length > 0 && scenes.length < 2)
    formatIssues.push("场次数偏少（<2），信息密度可能不足");

  const tail = text.slice(-200);
  const hasHook = HOOK_KEYWORDS.some((kw) => tail.includes(kw));

  return {
    total_chars: totalChars,
    dialogue_chars: dialogueChars,
    action_chars: actionChars,
    dialogue_ratio: spokenTotal > 0 ? dialogueChars / spokenTotal : 0,
    scene_count: scenes.length,
    avg_line_length: avgLineLength,
    long_lines_count: longLines,
    has_episode_hook: hasHook,
    format_issues: formatIssues,
  };
}

export function extractNovelBeats(text: string, maxBeats = 12): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const beats: string[] = [];
  const conflictPatterns = [
    /突然|竟然|没想到|原来|发现|秘密|危险|威胁|背叛|离婚|退婚|羞辱|打脸/,
    /"[^"]{4,40}"|'[^']{4,40}'|「[^」]{4,40}」/,
  ];

  for (const p of paragraphs) {
    if (conflictPatterns.some((re) => re.test(p))) {
      beats.push(p.slice(0, 120) + (p.length > 120 ? "…" : ""));
    }
    if (beats.length >= maxBeats) break;
  }

  if (beats.length < 3) {
    for (const p of paragraphs.slice(0, maxBeats)) {
      beats.push(p.slice(0, 120) + (p.length > 120 ? "…" : ""));
    }
  }

  return beats.slice(0, maxBeats);
}

export function scoreFromMetrics(metrics: ScriptMetrics): {
  structure_score: number;
  pacing_hints: string[];
} {
  let structure = 15;
  const hints: string[] = [];

  structure -= Math.min(metrics.format_issues.length * 2, 10);

  if (metrics.total_chars < 400 || metrics.total_chars > 900) {
    structure -= 2;
    hints.push("调整单集字数到 400–900 区间");
  }
  if (metrics.dialogue_ratio < 0.55) {
    hints.push(`台词占比 ${(metrics.dialogue_ratio * 100).toFixed(0)}%，建议 ≥55%`);
  }
  if (metrics.long_lines_count > 3) {
    hints.push(`有 ${metrics.long_lines_count} 句台词超过 25 字，建议拆短`);
  }
  if (!metrics.has_episode_hook) {
    hints.push("集末缺少明显钩子信号，建议加强悬念/反转/强情绪");
  }

  return {
    structure_score: Math.max(0, structure),
    pacing_hints: hints,
  };
}
