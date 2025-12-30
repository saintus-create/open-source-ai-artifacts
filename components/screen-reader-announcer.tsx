'use client'

import { useEffect } from 'react'

// Screen reader announcer component for accessibility
export function ScreenReaderAnnouncer() {
  useEffect(() => {
    // Create announcer element if it doesn't exist
    let announcer = document.getElementById('screen-reader-announcer')
    
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'screen-reader-announcer'
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.style.position = 'absolute'
      announcer.style.left = '-10000px'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.overflow = 'hidden'
      document.body.appendChild(announcer)
    }

    return () => {
      // Cleanup on unmount
      if (announcer && announcer.parentNode) {
        announcer.parentNode.removeChild(announcer)
      }
    }
  }, [])

  return null
}

// Utility function to announce messages
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('screen-reader-announcer')
  if (announcer) {
    announcer.textContent = ''
    // Clear and set new content to ensure announcement
    setTimeout(() => {
      announcer.textContent = message
      announcer.setAttribute('aria-live', priority)
    }, 100)
  }
}

// Hook for announcing messages
export function useScreenReaderAnnouncer() {
  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    announceToScreenReader(message, priority)
  }

  return { announce }
}