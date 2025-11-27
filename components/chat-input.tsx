'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isFileInArray } from '@/lib/utils'
import { ArrowUp, Paperclip, Square, X, Sparkles } from 'lucide-react'
import { SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export function ChatInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  children: React.ReactNode
}) {
  // ----- Deterministic mode toggle -----
  const [deterministic, setDeterministic] = useState<boolean>(false)
  useEffect(() => {
    const saved = localStorage.getItem('deterministicMode')
    if (saved) setDeterministic(saved === 'true')
  }, [])
  const toggleDeterministic = () => {
    setDeterministic((prev) => {
      const next = !prev
      localStorage.setItem('deterministicMode', String(next))
      return next
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  const handleFileRemove = useCallback((file: File) => {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }, [handleFileChange])

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()

        const file = item.getAsFile()
        if (file) {
          handleFileChange((prev) => {
            if (!isFileInArray(file, prev)) {
              return [...prev, file]
            }
            return prev
          })
        }
      }
    }
  }

  const [dragActive, setDragActive] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (droppedFiles.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedFiles.filter(
          (file) => !isFileInArray(file, prev),
        )
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative group"
          key={file.name}
        >
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm z-10"
          >
            <X className="h-3 w-3" />
          </span>
          <Image
            src={URL.createObjectURL(file)}
            alt={file.name}
            width={48}
            height={48}
            unoptimized
            className="rounded-lg w-12 h-12 object-cover border border-border/50 shadow-sm"
          />
        </motion.div>
      )
    })
  }, [files, handleFileRemove])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal, handleFileChange])

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-4 mt-auto flex flex-col bg-background px-4 pb-4"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      <AnimatePresence>
        {isErrored && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`flex items-center p-2 text-sm font-medium mx-auto w-full max-w-[800px] mb-4 rounded-lg border ${isRateLimited
              ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
          >
            <span className="flex-1 px-1.5">{errorMessage}</span>
            <button
              className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${isRateLimited ? 'bg-orange-500/20 hover:bg-orange-500/30' : 'bg-red-500/20 hover:bg-red-500/30'
                }`}
              onClick={retry}
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deterministic mode toggle */}
      <div className="flex items-center justify-end mb-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={deterministic}
            onChange={toggleDeterministic}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Sparkles className="h-4 w-4 text-primary" />
          Deterministic mode
        </label>
      </div>

      <div className="relative w-full max-w-[800px] mx-auto">
        <motion.div
          animate={{
            boxShadow: isFocused || dragActive
              ? "0 0 0 2px hsl(var(--primary) / 0.3), 0 8px 20px -4px hsl(var(--primary) / 0.1)"
              : "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
            borderColor: isFocused || dragActive ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border) / 0.5)"
          }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl relative z-10 bg-card/80 backdrop-blur-xl border overflow-hidden`}
        >
          <div className="flex items-center px-4 py-2 gap-2 border-b border-border/40 bg-muted/30">
            {children}
          </div>

          <div className="relative">
            <TextareaAutosize
              autoFocus={true}
              minRows={3}
              maxRows={10}
              className="text-sm px-4 py-4 resize-none bg-transparent w-full m-0 outline-none text-foreground placeholder:text-muted-foreground/50 font-sans leading-relaxed"
              required={true}
              placeholder="Ask Antigravity..."
              disabled={isErrored}
              value={input}
              onChange={handleInputChange}
              onPaste={isMultiModal ? handlePaste : undefined}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            {/* Subtle corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none" />
          </div>

          <div className="flex px-3 py-2 gap-2 items-center justify-between bg-gradient-to-b from-transparent to-muted/10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <input
                type="file"
                id="multimodal"
                name="multimodal"
                accept="image/*"
                multiple={true}
                className="hidden"
                onChange={handleFileInput}
              />
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!isMultiModal || isErrored}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('multimodal')?.click()
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add attachments</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AnimatePresence>
                {files.length > 0 && filePreview}
              </AnimatePresence>
            </div>

            <div>
              {!isLoading ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored || input.trim().length === 0}
                        variant="default"
                        size="icon"
                        type="submit"
                        className="rounded-lg h-9 w-9 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-lg h-9 w-9 bg-muted text-muted-foreground animate-pulse"
                        onClick={(e) => {
                          e.preventDefault()
                          stop()
                        }}
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-3 text-center font-medium tracking-wide uppercase">
        Antigravity can make mistakes. Check generated code.
      </p>
    </form>
  )
}
