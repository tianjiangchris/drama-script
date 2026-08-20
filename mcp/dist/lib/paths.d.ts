export declare const REFERENCE_DIR: string;
export declare function resolveProjectRoot(projectRoot?: string): string;
export declare function ensureDir(dir: string): Promise<void>;
export declare function readTextFile(filePath: string): Promise<string>;
export declare function writeTextFile(filePath: string, content: string): Promise<void>;
export declare function readReference(name: string): Promise<string>;
export declare function dramaPaths(projectRoot: string): {
    root: string;
    config: string;
    briefs: string;
    scripts: string;
    source: string;
};
export interface DramaConfig {
    title: string;
    genre: string;
    target_episodes: number;
    source_type: "novel" | "outline" | "mixed";
    notes?: string;
}
export declare function loadConfig(projectRoot: string): Promise<DramaConfig | null>;
export declare function saveConfig(projectRoot: string, config: DramaConfig): Promise<void>;
export declare function textResult(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare function jsonResult(data: unknown): {
    content: {
        type: "text";
        text: string;
    }[];
};
