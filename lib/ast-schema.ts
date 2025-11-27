import { z } from 'zod'

// Minimal AST schema for deterministic mode – we only need to validate that the AI returns a proper
// object structure that can later be turned into source code.  For now we keep it simple: an array of
// files, each with a path and content string.
export const astSchema = z.object({
    files: z.array(
        z.object({
            file_path: z.string(),
            file_content: z.string(),
        })
    ),
})
