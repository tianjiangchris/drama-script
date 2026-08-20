import { z } from "zod";
export declare const initProjectSchema: {
    project_root: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    genre: z.ZodString;
    target_episodes: z.ZodNumber;
    source_type: z.ZodDefault<z.ZodEnum<["novel", "outline", "mixed"]>>;
    notes: z.ZodOptional<z.ZodString>;
};
export declare const prepareAdaptationSchema: {
    project_root: z.ZodOptional<z.ZodString>;
    source_path: z.ZodString;
    episode: z.ZodNumber;
    episode_title: z.ZodString;
    episode_goal: z.ZodString;
    hook: z.ZodString;
    source_chapters: z.ZodOptional<z.ZodString>;
};
export declare const saveScriptSchema: {
    project_root: z.ZodOptional<z.ZodString>;
    episode: z.ZodNumber;
    content: z.ZodString;
};
export declare const readSourceSchema: {
    project_root: z.ZodOptional<z.ZodString>;
    source_path: z.ZodString;
};
export declare const listEpisodesSchema: {
    project_root: z.ZodOptional<z.ZodString>;
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
export declare function initProject(args: InitProjectArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function prepareAdaptation(args: PrepareAdaptationArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function saveScript(args: SaveScriptArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function readSource(args: ReadSourceArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function listEpisodes(args: ListEpisodesArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
