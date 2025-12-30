import { tool } from 'ai'
import { z } from 'zod'

export const mcpTools = {
    fetch_kpi_data: tool({
        description: 'Fetch Key Performance Indicators (KPIs) for a given business domain.',
        parameters: z.object({
            domain: z.string().describe('The business domain (e.g., sales, marketing, engineering, finance).'),
        }),
        execute: async ({ domain }) => {
            console.log(`[MCP] Fetching KPI data for ${domain}...`)
            // Mock data simulation based on domain
            const kpis = {
                sales: [
                    { label: 'Total Revenue', value: '$2.4M', change: '+12.5%', trend: 'up' },
                    { label: 'Avg. Deal Size', value: '$15k', change: '+2.1%', trend: 'up' },
                    { label: 'Win Rate', value: '32%', change: '-1.5%', trend: 'down' },
                ],
                marketing: [
                    { label: 'Total Leads', value: '12,450', change: '+8.2%', trend: 'up' },
                    { label: 'Conversion Rate', value: '3.6%', change: '+0.4%', trend: 'up' },
                    { label: 'Cost per Lead', value: '$45', change: '-5.0%', trend: 'down' },
                ],
                engineering: [
                    { label: 'Uptime', value: '99.99%', change: '+0.01%', trend: 'up' },
                    { label: 'Deployment Freq', value: '12/day', change: '+20%', trend: 'up' },
                    { label: 'Mean Time to Recover', value: '15m', change: '-10%', trend: 'down' },
                ],
            }

            const defaultKpis = [
                { label: 'Active Users', value: '50k', change: '+5%', trend: 'up' },
                { label: 'Retention', value: '85%', change: '+1%', trend: 'up' },
                { label: 'NPS', value: '42', change: '+2', trend: 'up' },
            ]

            return {
                domain,
                data: kpis[domain as keyof typeof kpis] || defaultKpis,
                timestamp: new Date().toISOString(),
            }
        },
    }),
    read_file: tool({
        description: 'Read the content of a file from the project to understand the codebase structure, styles, or dependencies.',
        parameters: z.object({
            filePath: z.string().describe('The relative path to the file (e.g., "app/globals.css", "package.json").'),
        }),
        execute: async ({ filePath }) => {
            console.log(`[MCP] Reading file: ${filePath}...`)
            try {
                const fs = await import('fs/promises')
                const path = await import('path')
                const fullPath = path.join(process.cwd(), filePath)
                // Security check to prevent directory traversal
                if (!fullPath.startsWith(process.cwd())) {
                     throw new Error('Access denied: Path outside project root')
                }
                const content = await fs.readFile(fullPath, 'utf-8')
                return {
                    filePath,
                    content: content.slice(0, 5000), // Limit content size for context window
                }
            } catch (error: any) {
                console.error(`[MCP] Error reading file: ${error.message}`)
                return {
                    error: `Failed to read file: ${error.message}`,
                }
            }
        },
    }),
    browse_docs: tool({
        description: 'Browse external documentation sites (e.g., shadcn.com, astro.com) to find components and installation instructions.',
        parameters: z.object({
            url: z.string().describe('The URL to visit.'),
            query: z.string().describe('What to look for (e.g., "new components", "installation guide").'),
        }),
        execute: async ({ url, query }) => {
            console.log(`[MCP] Browsing ${url} for "${query}"...`)
            // Simulation of web browsing/scraping
            return {
                url,
                found_items: [
                    { name: 'Accordion', type: 'Component', description: 'A vertically stacked set of interactive headings.' },
                    { name: 'Sheet', type: 'Component', description: 'Extends the Dialog component to display content that complements the main screen.' },
                    { name: 'Sonner', type: 'Toast', description: 'An opinionated toast component for React.' }
                ],
                status: 'success'
            }
        }
    }),
    git_tool: tool({
        description: 'Perform Git operations like cloning, auditing, and pushing changes.',
        parameters: z.object({
            operation: z.enum(['clone', 'status', 'push', 'audit']).describe('The git operation to perform.'),
            repoUrl: z.string().optional().describe('Repository URL for cloning.'),
        }),
        execute: async ({ operation, repoUrl }) => {
            console.log(`[MCP] Git Operation: ${operation} ${repoUrl || ''}`)
            // Simulation of git operations
            if (operation === 'push') {
                return { status: 'success', message: 'Changes pushed to remote branch "feature/visual-upgrade".' }
            }
            if (operation === 'audit') {
                 return { status: 'success', issues: ['Outdated dependency: tailwindcss@3.2.0', 'Missing .gitignore'] }
            }
            return { status: 'success', message: `Completed ${operation}` }
        }
    })
}
