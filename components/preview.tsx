'use client'

import { FragmentCode } from './fragment-code'
import { SandpackPreview } from './sandpack-preview'
import { FileTree } from './file-tree/file-tree'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { useFileMap, getFileFromFragment } from '@/lib/hooks/use-file-map'
import { downloadProjectAsZip } from '@/lib/download-project'
import { DeepPartial } from 'ai'
import { ChevronsRight, LoaderCircle, Play, Download } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { toast } from '@/components/ui/use-toast'

export function Preview({
  teamID,
  accessToken,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  selectedTab: 'code' | 'fragment'
  onSelectedTabChange: Dispatch<SetStateAction<'code' | 'fragment'>>
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  const fileMap = useFileMap(fragment)
  const [selectedFile, setSelectedFile] = useState<string | undefined>()

  // Auto-select first file when fragment changes
  useState(() => {
    if (fragment?.code && fragment.code.length > 0 && !selectedFile) {
      const firstFile = fragment.code[0]
      if (firstFile?.file_path) {
        const path = firstFile.file_path.startsWith('/')
          ? firstFile.file_path
          : `/${firstFile.file_path}`
        setSelectedFile(path)
      }
    }
  })

  if (!fragment) {
    return null
  }

  const hasMultipleFiles = (fragment.code?.length || 0) > 1
  const selectedFileContent = selectedFile
    ? getFileFromFragment(fragment, selectedFile)
    : fragment.code?.[0]?.file_content

  const displayFileName = selectedFile
    ? selectedFile.split('/').pop()
    : fragment.code?.[0]?.file_path

  const handleDownload = async () => {
    try {
      await downloadProjectAsZip(fragment)
      toast({
        title: 'Project downloaded',
        description: 'Your project has been downloaded as a ZIP file.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description:
          error instanceof Error ? error.message : 'Failed to download project',
      })
    }
  }

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-hidden">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'fragment')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 flex items-center justify-between border-b">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground" onClick={onClose}>
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="code"
              >
                {isChatLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!fragment.code || fragment.code.length === 0}
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="fragment"
              >
                <Play className="h-3 w-3" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleDownload}
                  disabled={!fragment.code || fragment.code.length === 0}
                >
                  <Download className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download as ZIP</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {fragment && (
          <div className="overflow-hidden w-full h-full">
            <TabsContent value="code" className="h-full m-0">
              {fragment.code && fragment.code.length > 0 && (
                <PanelGroup direction="horizontal" className="h-full">
                  {hasMultipleFiles && (
                    <>
                      <Panel
                        defaultSize={25}
                        minSize={15}
                        maxSize={40}
                        className="bg-muted/30"
                      >
                        <div className="h-full flex flex-col">
                          <div className="px-3 py-2 border-b bg-muted/50">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                              Files
                            </h3>
                          </div>
                          <FileTree
                            files={fileMap}
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                            className="flex-1"
                          />
                        </div>
                      </Panel>
                      <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors" />
                    </>
                  )}
                  <Panel defaultSize={hasMultipleFiles ? 75 : 100}>
                    <FragmentCode
                      files={[
                        {
                          name: displayFileName || 'code',
                          content: selectedFileContent || '',
                        },
                      ]}
                    />
                  </Panel>
                </PanelGroup>
              )}
            </TabsContent>
            <TabsContent value="fragment" className="h-full m-0">
              {fragment.code && fragment.code.length > 0 && (
                <SandpackPreview
                  files={fragment.code.reduce(
                    (acc, file) => {
                      if (file?.file_path && file?.file_content) {
                        return {
                          ...acc,
                          [file.file_path]: file.file_content,
                        }
                      }
                      return acc
                    },
                    {} as Record<string, string>,
                  )}
                />
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
