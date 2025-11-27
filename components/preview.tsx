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
      className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-background/95 backdrop-blur-sm h-full w-full overflow-hidden border-border/50"
    >
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'fragment')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 flex items-center justify-between border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                    onClick={onClose}
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex justify-center bg-muted/50 p-1 rounded-lg border border-border/50">
            <TabsList className="p-0 bg-transparent h-auto gap-1">
              <TabsTrigger
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 font-medium text-xs py-1.5 px-3 rounded-md gap-2 flex items-center"
                value="code"
              >
                {isChatLoading ? (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3.5 w-3.5 animate-spin text-primary"
                  />
                ) : (
                  <Code2 className="h-3.5 w-3.5" />
                )}
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!fragment.code || fragment.code.length === 0}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 font-medium text-xs py-1.5 px-3 rounded-md gap-2 flex items-center"
                value="fragment"
              >
                <Play className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
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
          <div className="relative overflow-hidden w-full h-full bg-card/50">
            <AnimatePresence mode="wait">
              {isPreviewLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground animate-pulse">Building preview...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="code" className="h-full m-0">
              {fragment.code && fragment.code.length > 0 && (
                <PanelGroup direction="horizontal" className="h-full">
                  {hasMultipleFiles && (
                    <>
                      <Panel
                        defaultSize={25}
                        minSize={15}
                        maxSize={40}
                        className="bg-muted/10 border-r border-border/40"
                      >
                        <div className="h-full flex flex-col">
                          <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                      <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors" />
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
    </motion.div>
  )
}
