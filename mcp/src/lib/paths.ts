import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REFERENCE_DIR = path.join(__dirname, "..", "..", "references");

export function resolveProjectRoot(projectRoot?: string): string {
  return projectRoot ? path.resolve(projectRoot) : process.cwd();
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(path.resolve(filePath), "utf-8");
}

export async function writeTextFile(
  filePath: string,
  content: string,
): Promise<void> {
  const resolved = path.resolve(filePath);
  await ensureDir(path.dirname(resolved));
  await fs.writeFile(resolved, content, "utf-8");
}

export async function readReference(name: string): Promise<string> {
  const file = path.join(REFERENCE_DIR, name);
  return fs.readFile(file, "utf-8");
}

export function dramaPaths(projectRoot: string) {
  const root = path.resolve(projectRoot);
  return {
    root,
    config: path.join(root, ".drama-script", "config.json"),
    briefs: path.join(root, ".drama-script", "briefs"),
    scripts: path.join(root, "scripts"),
    source: path.join(root, "source"),
  };
}

export interface DramaConfig {
  title: string;
  genre: string;
  target_episodes: number;
  source_type: "novel" | "outline" | "mixed";
  notes?: string;
}

export async function loadConfig(projectRoot: string): Promise<DramaConfig | null> {
  const { config } = dramaPaths(projectRoot);
  try {
    const raw = await fs.readFile(config, "utf-8");
    return JSON.parse(raw) as DramaConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(
  projectRoot: string,
  config: DramaConfig,
): Promise<void> {
  const { config: configPath } = dramaPaths(projectRoot);
  await writeTextFile(configPath, JSON.stringify(config, null, 2));
}

export function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}
