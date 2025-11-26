import { useMemo } from 'react'
import { FragmentSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { FileMap } from '@/components/file-tree/file-tree'

/**
 * Converts a FragmentSchema to a FileMap for the file tree component
 */
export function useFileMap(fragment: DeepPartial<FragmentSchema> | undefined): FileMap {
    return useMemo(() => {
        if (!fragment?.code || fragment.code.length === 0) {
            return {}
        }

        const fileMap: FileMap = {}

        // Add all files from the fragment
        for (const file of fragment.code) {
            if (!file?.file_path) continue

            const filePath = file.file_path.startsWith('/')
                ? file.file_path
                : `/${file.file_path}`

            fileMap[filePath] = {
                type: 'file',
                content: file.file_content || '',
            }

            // Add all parent folders
            const segments = filePath.split('/').filter((s) => s)
            let currentPath = ''

            for (let i = 0; i < segments.length - 1; i++) {
                currentPath += `/${segments[i]}`

                if (!fileMap[currentPath]) {
                    fileMap[currentPath] = {
                        type: 'folder',
                    }
                }
            }
        }

        return fileMap
    }, [fragment?.code])
}

/**
 * Gets a specific file's content from the fragment
 */
export function getFileFromFragment(
    fragment: DeepPartial<FragmentSchema> | undefined,
    filePath: string,
): string | undefined {
    if (!fragment?.code) return undefined

    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

    const file = fragment.code.find(
        (f) =>
            f?.file_path === normalizedPath ||
            f?.file_path === `/${normalizedPath}` ||
            f?.file_path === filePath,
    )

    return file?.file_content || undefined
}
