// Accessibility utilities for Fragments application
export class AccessibilityManager {
  private static instance: AccessibilityManager

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  // Generate ARIA labels for dynamic content
  generateAriaLabel(type: string, content: string): string {
    const labels: Record<string, string> = {
      'chat-message': `Chat message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      'code-block': `Code block: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
      'file-tree': `File tree item: ${content}`,
      'preview': `Preview panel: ${content}`,
      'loading': `Loading: ${content}`,
      'error': `Error: ${content}`
    }
    return labels[type] || content
  }

  // Keyboard navigation helpers
  handleKeyboardNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (index: number) => void
  ): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(currentIndex + 1, totalItems - 1)
        onNavigate(nextIndex)
        break
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        onNavigate(prevIndex)
        break
      case 'Home':
        event.preventDefault()
        onNavigate(0)
        break
      case 'End':
        event.preventDefault()
        onNavigate(totalItems - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        // Activate current item
        break
    }
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.getElementById('screen-reader-announcer')
    if (announcer) {
      announcer.textContent = message
      announcer.setAttribute('aria-live', priority)
    }
  }

  // Focus management
  focusElement(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus({ preventScroll: true })
    }
  }

  // High contrast mode detection
  isHighContrastMode(): boolean {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    return mediaQuery.matches
  }

  // Reduced motion preference
  prefersReducedMotion(): boolean {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    return mediaQuery.matches
  }

  // Generate accessible color combinations
  getAccessibleColors(baseColor: string): { text: string; background: string } {
    // Simple implementation - in production, use a proper color contrast library
    const isDark = this.isColorDark(baseColor)
    return {
      text: isDark ? '#ffffff' : '#000000',
      background: baseColor
    }
  }

  private isColorDark(color: string): boolean {
    // Simple luminance check
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance < 128
  }

  // Form validation messages
  generateValidationMessage(field: string, error: string): string {
    return `${field} ${error}. Please try again.`
  }

  // Loading state messages
  generateLoadingMessage(action: string): string {
    return `Loading ${action}. This may take a moment.`
  }

  // Error state messages
  generateErrorMessage(error: string): string {
    return `Error: ${error}. Please try refreshing the page or contact support if the problem persists.`
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance()

// React hook for accessibility
export function useAccessibility() {
  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    accessibilityManager.announce(message, priority)
  }

  const focusElement = (element: HTMLElement | null) => {
    accessibilityManager.focusElement(element)
  }

  return {
    announce,
    focusElement,
    isHighContrastMode: accessibilityManager.isHighContrastMode(),
    prefersReducedMotion: accessibilityManager.prefersReducedMotion(),
    generateAriaLabel: accessibilityManager.generateAriaLabel,
    handleKeyboardNavigation: accessibilityManager.handleKeyboardNavigation
  }
}