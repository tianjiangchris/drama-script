import { z } from "zod";
export declare const evaluateScriptSchema: {
    project_root: z.ZodOptional<z.ZodString>;
    script_path: z.ZodOptional<z.ZodString>;
    script_content: z.ZodOptional<z.ZodString>;
    episode: z.ZodOptional<z.ZodNumber>;
};
export declare const validateScriptSchema: {
    script_content: z.ZodString;
};
export declare const getScriptTemplateSchema: {
    episode: z.ZodNumber;
    title: z.ZodString;
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
export declare function evaluateScript(args: EvaluateScriptArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function validateScript(args: ValidateScriptArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function getScriptTemplate(args: GetScriptTemplateArgs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
