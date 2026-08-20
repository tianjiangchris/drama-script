import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REFERENCE_DIR = path.join(__dirname, "..", "..", "references");
export function resolveProjectRoot(projectRoot) {
    return projectRoot ? path.resolve(projectRoot) : process.cwd();
}
export async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}
export async function readTextFile(filePath) {
    return fs.readFile(path.resolve(filePath), "utf-8");
}
export async function writeTextFile(filePath, content) {
    const resolved = path.resolve(filePath);
    await ensureDir(path.dirname(resolved));
    await fs.writeFile(resolved, content, "utf-8");
}
export async function readReference(name) {
    const file = path.join(REFERENCE_DIR, name);
    return fs.readFile(file, "utf-8");
}
export function dramaPaths(projectRoot) {
    const root = path.resolve(projectRoot);
    return {
        root,
        config: path.join(root, ".drama-script", "config.json"),
        briefs: path.join(root, ".drama-script", "briefs"),
        scripts: path.join(root, "scripts"),
        source: path.join(root, "source"),
    };
}
export async function loadConfig(projectRoot) {
    const { config } = dramaPaths(projectRoot);
    try {
        const raw = await fs.readFile(config, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function saveConfig(projectRoot, config) {
    const { config: configPath } = dramaPaths(projectRoot);
    await writeTextFile(configPath, JSON.stringify(config, null, 2));
}
export function textResult(text) {
    return { content: [{ type: "text", text }] };
}
export function jsonResult(data) {
    return textResult(JSON.stringify(data, null, 2));
}
