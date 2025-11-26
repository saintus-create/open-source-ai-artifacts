'use client'

import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FragmentSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'

/**
 * Downloads the fragment project as a ZIP file
 */
export async function downloadProjectAsZip(
    fragment: DeepPartial<FragmentSchema> | undefined,
    projectName?: string,
): Promise<void> {
    if (!fragment?.code || fragment.code.length === 0) {
        throw new Error('No code to download')
    }

    const zip = new JSZip()
    const name = projectName || fragment.title || 'project'

    // Add all files to the ZIP
    for (const file of fragment.code) {
        if (!file?.file_path || !file?.file_content) continue

        // Remove leading slash if present
        const filePath = file.file_path.startsWith('/')
            ? file.file_path.slice(1)
            : file.file_path

        zip.file(filePath, file.file_content)
    }

    // Add a README if description exists
    if (fragment.description || fragment.commentary) {
        const readmeContent = `# ${fragment.title || 'Project'}

${fragment.description || ''}

## About

${fragment.commentary || 'Generated code'}

## Getting Started

${fragment.install_dependencies_command ? `Install dependencies:
\`\`\`bash
${fragment.install_dependencies_command}
\`\`\`
` : ''}

${fragment.port ? `This project runs on port ${fragment.port}` : ''}
`
        zip.file('README.md', readmeContent)
    }

    // Add package.json if there are additional dependencies
    if (
        fragment.has_additional_dependencies &&
        fragment.additional_dependencies &&
        fragment.additional_dependencies.length > 0
    ) {
        const packageJson = {
            name: name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: fragment.description || '',
            dependencies: fragment.additional_dependencies.reduce(
                (acc, dep) => {
                    if (!dep) return acc
                    // Simple version - you might want to parse version from dep string
                    acc[dep] = 'latest'
                    return acc
                },
                {} as Record<string, string>,
            ),
        }

        zip.file('package.json', JSON.stringify(packageJson, null, 2))
    }

    // Generate and download the ZIP
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${name.replace(/\s+/g, '-').toLowerCase()}.zip`)
}
