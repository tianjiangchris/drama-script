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
export declare function parseScenes(text: string): SceneBlock[];
export declare function analyzeScript(text: string): ScriptMetrics;
export declare function extractNovelBeats(text: string, maxBeats?: number): string[];
export declare function scoreFromMetrics(metrics: ScriptMetrics): {
    structure_score: number;
    pacing_hints: string[];
};
