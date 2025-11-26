'use client'

import { memo, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, File as FileIcon, Folder as FolderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NODE_PADDING_LEFT = 12
const DEFAULT_HIDDEN_FILES = [/\/node_modules\//, /\/\.next/, /\/\.git/, /\/dist\//, /\/build\//]

export interface FileMap {
    [path: string]: {
        type: 'file' | 'folder'
        content?: string
    }
}

interface Props {
    files?: FileMap
    selectedFile?: string
    onFileSelect?: (filePath: string) => void
    rootFolder?: string
    hideRoot?: boolean
    collapsed?: boolean
    allowFolderSelection?: boolean
    hiddenFiles?: Array<string | RegExp>
    unsavedFiles?: Set<string>
    className?: string
}

export const FileTree = memo(
    ({
        files = {},
        onFileSelect,
        selectedFile,
        rootFolder = '/',
        hideRoot = true,
        collapsed = false,
        allowFolderSelection = false,
        hiddenFiles,
        className,
        unsavedFiles,
    }: Props) => {
        const computedHiddenFiles = useMemo(
            () => [...DEFAULT_HIDDEN_FILES, ...(hiddenFiles ?? [])],
            [hiddenFiles],
        )

        const fileList = useMemo(() => {
            return buildFileList(files, rootFolder, hideRoot, computedHiddenFiles)
        }, [files, rootFolder, hideRoot, computedHiddenFiles])

        const [collapsedFolders, setCollapsedFolders] = useState(() => {
            return collapsed
                ? new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath))
                : new Set<string>()
        })

        useEffect(() => {
            if (collapsed) {
                setCollapsedFolders(
                    new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath)),
                )
                return
            }

            setCollapsedFolders((prevCollapsed) => {
                const newCollapsed = new Set<string>()

                for (const folder of fileList) {
                    if (folder.kind === 'folder' && prevCollapsed.has(folder.fullPath)) {
                        newCollapsed.add(folder.fullPath)
                    }
                }

                return newCollapsed
            })
        }, [fileList, collapsed])

        const filteredFileList = useMemo(() => {
            const list = []
            let lastDepth = Number.MAX_SAFE_INTEGER

            for (const fileOrFolder of fileList) {
                const depth = fileOrFolder.depth

                if (lastDepth === depth) {
                    lastDepth = Number.MAX_SAFE_INTEGER
                }

                if (collapsedFolders.has(fileOrFolder.fullPath)) {
                    lastDepth = Math.min(lastDepth, depth)
                }

                if (lastDepth < depth) {
                    continue
                }

                list.push(fileOrFolder)
            }

            return list
        }, [fileList, collapsedFolders])

        const toggleCollapseState = (fullPath: string) => {
            setCollapsedFolders((prevSet) => {
                const newSet = new Set(prevSet)

                if (newSet.has(fullPath)) {
                    newSet.delete(fullPath)
                } else {
                    newSet.add(fullPath)
                }

                return newSet
            })
        }

        return (
            <div className={cn('text-sm overflow-y-auto', className)}>
                {filteredFileList.map((fileOrFolder) => {
                    switch (fileOrFolder.kind) {
                        case 'file': {
                            return (
                                <FileItem
                                    key={fileOrFolder.id}
                                    selected={selectedFile === fileOrFolder.fullPath}
                                    file={fileOrFolder}
                                    unsavedChanges={unsavedFiles?.has(fileOrFolder.fullPath)}
                                    onClick={() => {
                                        onFileSelect?.(fileOrFolder.fullPath)
                                    }}
                                />
                            )
                        }
                        case 'folder': {
                            return (
                                <FolderItem
                                    key={fileOrFolder.id}
                                    folder={fileOrFolder}
                                    selected={allowFolderSelection && selectedFile === fileOrFolder.fullPath}
                                    collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
                                    onClick={() => {
                                        toggleCollapseState(fileOrFolder.fullPath)
                                    }}
                                />
                            )
                        }
                        default: {
                            return undefined
                        }
                    }
                })}
            </div>
        )
    },
)

FileTree.displayName = 'FileTree'

interface FolderItemProps {
    folder: FolderNode
    collapsed: boolean
    selected?: boolean
    onClick: () => void
}

function FolderItem({ folder: { depth, name }, collapsed, selected = false, onClick }: FolderItemProps) {
    return (
        <NodeButton
            className={cn(
                'group hover:bg-accent/50',
                selected ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            )}
            depth={depth}
            icon={
                collapsed ? (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                )
            }
            onClick={onClick}
        >
            <FolderIcon className="w-4 h-4 shrink-0 mr-1" />
            {name}
        </NodeButton>
    )
}

interface FileItemProps {
    file: FileNode
    selected: boolean
    unsavedChanges?: boolean
    onClick: () => void
}

function FileItem({ file: { depth, name }, onClick, selected, unsavedChanges = false }: FileItemProps) {
    return (
        <NodeButton
            className={cn(
                'group hover:bg-accent/50',
                selected ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            )}
            depth={depth}
            icon={<FileIcon className="w-4 h-4 shrink-0 mr-1" />}
            onClick={onClick}
        >
            <div className="flex items-center flex-1 min-w-0">
                <div className="flex-1 truncate">{name}</div>
                {unsavedChanges && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 ml-2" />
                )}
            </div>
        </NodeButton>
    )
}

interface NodeButtonProps {
    depth: number
    icon: ReactNode
    children: ReactNode
    className?: string
    onClick?: () => void
}

function NodeButton({ depth, icon, onClick, className, children }: NodeButtonProps) {
    return (
        <button
            className={cn(
                'flex items-center gap-1 w-full pr-2 py-1.5 text-left cursor-pointer transition-colors',
                className,
            )}
            style={{ paddingLeft: `${8 + depth * NODE_PADDING_LEFT}px` }}
            onClick={() => onClick?.()}
        >
            {icon}
            <div className="truncate w-full flex items-center">{children}</div>
        </button>
    )
}

type Node = FileNode | FolderNode

interface BaseNode {
    id: number
    depth: number
    name: string
    fullPath: string
}

interface FileNode extends BaseNode {
    kind: 'file'
}

interface FolderNode extends BaseNode {
    kind: 'folder'
}

function buildFileList(
    files: FileMap,
    rootFolder = '/',
    hideRoot: boolean,
    hiddenFiles: Array<string | RegExp>,
): Node[] {
    const folderPaths = new Set<string>()
    const fileList: Node[] = []

    let defaultDepth = 0

    if (rootFolder === '/' && !hideRoot) {
        defaultDepth = 1
        fileList.push({ kind: 'folder', name: '/', depth: 0, id: 0, fullPath: '/' })
    }

    for (const [filePath, dirent] of Object.entries(files)) {
        if (!dirent) continue

        const segments = filePath.split('/').filter((segment) => segment)
        const fileName = segments.at(-1)

        if (!fileName || isHiddenFile(filePath, fileName, hiddenFiles)) {
            continue
        }

        let currentPath = ''
        let i = 0
        let depth = 0

        while (i < segments.length) {
            const name = segments[i]
            const fullPath = (currentPath += `/${name}`)

            if (!fullPath.startsWith(rootFolder) || (hideRoot && fullPath === rootFolder)) {
                i++
                continue
            }

            if (i === segments.length - 1 && dirent?.type === 'file') {
                fileList.push({
                    kind: 'file',
                    id: fileList.length,
                    name,
                    fullPath,
                    depth: depth + defaultDepth,
                })
            } else if (!folderPaths.has(fullPath)) {
                folderPaths.add(fullPath)

                fileList.push({
                    kind: 'folder',
                    id: fileList.length,
                    name,
                    fullPath,
                    depth: depth + defaultDepth,
                })
            }

            i++
            depth++
        }
    }

    return sortFileList(rootFolder, fileList, hideRoot)
}

function isHiddenFile(filePath: string, fileName: string, hiddenFiles: Array<string | RegExp>) {
    return hiddenFiles.some((pathOrRegex) => {
        if (typeof pathOrRegex === 'string') {
            return fileName === pathOrRegex
        }

        return pathOrRegex.test(filePath)
    })
}

function sortFileList(rootFolder: string, nodeList: Node[], hideRoot: boolean): Node[] {
    const nodeMap = new Map<string, Node>()
    const childrenMap = new Map<string, Node[]>()

    // pre-sort nodes by name and type
    nodeList.sort((a, b) => compareNodes(a, b))

    for (const node of nodeList) {
        nodeMap.set(node.fullPath, node)

        const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf('/'))

        if (parentPath !== rootFolder.slice(0, rootFolder.lastIndexOf('/'))) {
            if (!childrenMap.has(parentPath)) {
                childrenMap.set(parentPath, [])
            }

            childrenMap.get(parentPath)?.push(node)
        }
    }

    const sortedList: Node[] = []

    const depthFirstTraversal = (path: string): void => {
        const node = nodeMap.get(path)

        if (node) {
            sortedList.push(node)
        }

        const children = childrenMap.get(path)

        if (children) {
            for (const child of children) {
                if (child.kind === 'folder') {
                    depthFirstTraversal(child.fullPath)
                } else {
                    sortedList.push(child)
                }
            }
        }
    }

    if (hideRoot) {
        const rootChildren = childrenMap.get(rootFolder) || []

        for (const child of rootChildren) {
            depthFirstTraversal(child.fullPath)
        }
    } else {
        depthFirstTraversal(rootFolder)
    }

    return sortedList
}

function compareNodes(a: Node, b: Node): number {
    if (a.kind !== b.kind) {
        return a.kind === 'folder' ? -1 : 1
    }

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}
