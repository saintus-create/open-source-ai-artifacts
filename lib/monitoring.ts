// Comprehensive monitoring and observability for Fragments application
import { FragmentSchema } from './schema'

export interface Metrics {
  timestamp: number
  type: 'performance' | 'error' | 'usage' | 'system'
  data: Record<string, any>
}

export interface ErrorReport {
  id: string
  timestamp: number
  error: Error
  context: Record<string, any>
  stack?: string
  user?: string
  session?: string
}

export class MonitoringManager {
  private static instance: MonitoringManager
  private metrics: Metrics[] = []
  private errorReports: ErrorReport[] = []
  private isEnabled: boolean = true

  static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager()
    }
    return MonitoringManager.instance
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric('performance', {
        label,
        duration,
        timestamp: Date.now()
      })
    }
  }

  // Error tracking
  reportError(error: Error, context: Record<string, any> = {}): void {
    if (!this.isEnabled) return

    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      error,
      context,
      stack: error.stack,
      user: this.getCurrentUserId(),
      session: this.getSessionId()
    }

    this.errorReports.push(errorReport)
    this.recordMetric('error', {
      errorType: error.name,
      errorMessage: error.message,
      context,
      timestamp: Date.now()
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', errorReport)
    }

    // Send to external service if configured
    this.sendToExternalService(errorReport)
  }

  // Usage tracking
  trackEvent(event: string, data: Record<string, any> = {}): void {
    if (!this.isEnabled) return

    this.recordMetric('usage', {
      event,
      data,
      timestamp: Date.now(),
      user: this.getCurrentUserId(),
      session: this.getSessionId()
    })
  }

  // System health monitoring
  getSystemHealth(): {
    memory: { used: number; total: number; percentage: number }
    performance: { uptime: number; avgResponseTime: number }
    errors: { count: number; lastError: ErrorReport | null }
  } {
    const memory = this.getMemoryUsage()
    const performance = this.getPerformanceMetrics()
    const errors = this.getErrorMetrics()

    return {
      memory,
      performance,
      errors
    }
  }

  // Custom metrics
  recordMetric(type: Metrics['type'], data: Record<string, any>): void {
    const metric: Metrics = {
      timestamp: Date.now(),
      type,
      data
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }
  }

  // Get metrics for analysis
  getMetrics(type?: Metrics['type']): Metrics[] {
    return type 
      ? this.metrics.filter(m => m.type === type)
      : this.metrics
  }

  // Get error reports
  getErrorReports(): ErrorReport[] {
    return this.errorReports
  }

  // Health check endpoint data
  getHealthCheckData(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: boolean; message: string }>
    metrics: any
  } {
    const healthChecks = this.runHealthChecks()
    const metrics = this.getSystemHealth()

    const status = Object.values(healthChecks).every(check => check.status)
      ? 'healthy'
      : 'degraded'

    return {
      status,
      checks: healthChecks,
      metrics
    }
  }

  // Configuration
  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  // Private methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private getCurrentUserId(): string | undefined {
    // Implementation depends on your auth system
    return undefined
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    return this.generateId()
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  }

  private getPerformanceMetrics(): { uptime: number; avgResponseTime: number } {
    const now = Date.now()
    const startTime = this.metrics[0]?.timestamp || now
    const uptime = now - startTime

    const performanceMetrics = this.metrics.filter(m => m.type === 'performance')
    const avgResponseTime = performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, m) => sum + (m.data.duration || 0), 0) / performanceMetrics.length
      : 0

    return { uptime, avgResponseTime }
  }

  private getErrorMetrics(): { count: number; lastError: ErrorReport | null } {
    return {
      count: this.errorReports.length,
      lastError: this.errorReports[this.errorReports.length - 1] || null
    }
  }

  private runHealthChecks(): Record<string, { status: boolean; message: string }> {
    const checks: Record<string, { status: boolean; message: string }> = {}

    // Check memory usage
    const memory = this.getMemoryUsage()
    checks.memory = {
      status: memory.percentage < 80,
      message: `Memory usage: ${memory.percentage.toFixed(2)}%`
    }

    // Check error rate
    const recentErrors = this.errorReports.filter(e => Date.now() - e.timestamp < 60000) // Last minute
    checks.errorRate = {
      status: recentErrors.length < 5,
      message: `Recent errors: ${recentErrors.length}`
    }

    // Check response time
    const performance = this.getPerformanceMetrics()
    checks.responseTime = {
      status: performance.avgResponseTime < 5000, // 5 seconds
      message: `Average response time: ${performance.avgResponseTime.toFixed(2)}ms`
    }

    return checks
  }

  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    // Implementation for sending to external monitoring services
    // (e.g., Sentry, LogRocket, DataDog, etc.)
    try {
      const endpoint = process.env.ERROR_REPORTING_ENDPOINT
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        })
      }
    } catch (error) {
      console.warn('Failed to send error report to external service:', error)
    }
  }
}

// Export singleton instance
export const monitoringManager = MonitoringManager.getInstance()

// React hook for monitoring
export function useMonitoring() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    monitoringManager.reportError(error, context)
  }

  const trackEvent = (event: string, data?: Record<string, any>) => {
    monitoringManager.trackEvent(event, data)
  }

  const startTimer = (label: string) => {
    return monitoringManager.startTimer(label)
  }

  return {
    reportError,
    trackEvent,
    startTimer,
    getSystemHealth: () => monitoringManager.getSystemHealth(),
    getHealthCheckData: () => monitoringManager.getHealthCheckData()
  }
}