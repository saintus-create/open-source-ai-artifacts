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
import { ChevronsRight, LoaderCircle, Play, Download, Code2, Layers } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { toast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="top-0 left-0 z-10 absolute md:relative bg-background/95 shadow-2xl backdrop-blur-sm border-border/50 md:border-y md:border-l md:rounded-tl-3xl md:rounded-bl-3xl w-full h-full overflow-hidden"
    >
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'fragment')
        }
        className="flex flex-col justify-start items-start h-full"
      >
        <div className="flex justify-between items-center bg-muted/20 p-2 border-border/40 border-b w-full">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    className="hover:bg-muted p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
                    onClick={onClose}
                    aria-label="Close sidebar"
                  >
                    <ChevronsRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex justify-center bg-muted/50 p-1 border border-border/50 rounded-lg">
            <TabsList className="gap-1 bg-transparent p-0 h-auto">
              <TabsTrigger
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 rounded-md font-medium text-muted-foreground data-[state=active]:text-foreground hover:text-foreground text-xs transition-all duration-200"
                value="code"
              >
                {isChatLoading ? (
                  <LoaderCircle
                    strokeWidth={3}
                    className="w-3.5 h-3.5 text-primary animate-spin"
                  />
                ) : (
                  <Code2 className="w-3.5 h-3.5" />
                )}
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!fragment.code || fragment.code.length === 0}
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 rounded-md font-medium text-muted-foreground data-[state=active]:text-foreground hover:text-foreground text-xs transition-all duration-200"
                value="fragment"
              >
                <Play className="w-3.5 h-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="hover:bg-primary/10 p-2 rounded-lg text-muted-foreground hover:text-primary transition-all duration-200"
                  onClick={handleDownload}
                  disabled={!fragment.code || fragment.code.length === 0}
                  aria-label="Download project as ZIP"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download as ZIP</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {fragment && (
          <div className="relative bg-card/50 w-full h-full overflow-hidden">
            <AnimatePresence mode="wait">
              {isPreviewLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="z-50 absolute inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                    </div>
                    <span className="font-medium text-muted-foreground text-sm animate-pulse">Building preview...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="code" className="m-0 h-full">
              {fragment.code && fragment.code.length > 0 && (
                <PanelGroup direction="horizontal" className="h-full">
                  {hasMultipleFiles && (
                    <>
                      <Panel
                        defaultSize={25}
                        minSize={15}
                        maxSize={40}
                        className="bg-muted/10 border-border/40 border-r"
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-2 bg-muted/20 px-4 py-3 border-border/40 border-b">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                              Files
                            </h3>
                          </div>
                          <FileTree
                            files={fileMap}
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                            className="flex-1 p-2"
                          />
                        </div>
                      </Panel>
                      <PanelResizeHandle className="bg-transparent hover:bg-primary/20 w-1 transition-colors" />
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
            <TabsContent value="fragment" className="m-0 h-full">
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
    </motion.div>
  )
}
