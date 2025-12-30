'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Chat message skeleton
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'bg-muted/50' : ''}`}>
      <Skeleton className="rounded-full w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
  )
}

// Chat input skeleton
export function ChatInputSkeleton() {
  return (
    <div className="bg-background p-4 border-t">
      <div className="flex gap-2">
        <Skeleton className="flex-1 rounded-md h-10" />
        <Skeleton className="rounded-md w-10 h-10" />
      </div>
    </div>
  )
}

// Preview panel skeleton
export function PreviewSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Skeleton className="w-32 h-6" />
          <div className="flex gap-2">
            <Skeleton className="rounded-md w-8 h-8" />
            <Skeleton className="rounded-md w-8 h-8" />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <div className="bg-muted/50 h-64" />
      </CardContent>
    </Card>
  )
}

// File tree skeleton
export function FileTreeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="rounded w-4 h-4" />
          <Skeleton className="flex-1 h-4" />
        </div>
      ))}
    </div>
  )
}

// Code editor skeleton
export function CodeEditorSkeleton() {
  return (
    <div className="h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
      <div className="space-y-2 p-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="w-full h-4" />
        ))}
      </div>
    </div>
  )
}

// Full page loading skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-8 mx-auto py-8 container">
      <div className="flex justify-between items-center">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-32 h-10" />
      </div>
      
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Skeleton className="rounded-lg w-full h-64" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="rounded-lg w-full h-96" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-32" />
      </div>
    </div>
  )
}

// API loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm">
      <div className="space-y-4 text-center">
        <div className="mx-auto border-primary border-b-2 rounded-full w-12 h-12 animate-spin" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Button loading state
export function ButtonLoadingState() {
  return (
    <div className="flex items-center gap-2">
      <div className="border-current border-b-2 rounded-full w-4 h-4 animate-spin" />
      <span>Loading...</span>
    </div>
  )
}