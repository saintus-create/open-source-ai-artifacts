// MCP (Model Context Protocol) Integration Layer
// Provides seamless integration with any MCP-compliant service

import React from 'react'
import { tool } from 'ai'
import { z } from 'zod'
import { mcpCompatibilityManager, mcpTools } from './mcp-compatibility'
import { securityManager } from './security'
import { monitoringManager } from './monitoring'
import { performanceTester } from './testing'

export interface MCPIntegrationConfig {
  enabled: boolean
  endpoint: string
  apiKey?: string
  timeout: number
  retries: number
  rateLimit: {
    requests: number
    windowMs: number
  }
  services: {
    fileOperations: boolean
    kpiData: boolean
    webBrowsing: boolean
    gitOperations: boolean
    serviceDiscovery: boolean
    complianceValidation: boolean
  }
}

export class MCPIntegrationManager {
  private static instance: MCPIntegrationManager
  private config: MCPIntegrationConfig
  private isInitialized: boolean = false

  static getInstance(): MCPIntegrationManager {
    if (!MCPIntegrationManager.instance) {
      MCPIntegrationManager.instance = new MCPIntegrationManager()
    }
    return MCPIntegrationManager.instance
  }

  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_MCP_ENABLED === 'true',
      endpoint: process.env.MCP_ENDPOINT || 'http://localhost:3001',
      apiKey: process.env.MCP_API_KEY,
      timeout: parseInt(process.env.MCP_TIMEOUT || '10000'),
      retries: parseInt(process.env.MCP_RETRIES || '3'),
      rateLimit: {
        requests: parseInt(process.env.MCP_RATE_LIMIT_REQUESTS || '100'),
        windowMs: parseInt(process.env.MCP_RATE_LIMIT_WINDOW || '60000')
      },
      services: {
        fileOperations: true,
        kpiData: true,
        webBrowsing: true,
        gitOperations: true,
        serviceDiscovery: true,
        complianceValidation: true
      }
    }
  }

  // Initialize MCP integration
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[MCP] Integration disabled')
      return
    }

    try {
      // Initialize compatibility manager
      mcpCompatibilityManager.initialize({
        endpoint: this.config.endpoint,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        retries: this.config.retries,
        rateLimit: this.config.rateLimit
      })

      // Discover available services
      const services = await mcpCompatibilityManager.discoverServices()
      console.log(`[MCP] Discovered ${services.length} services`)

      this.isInitialized = true
      console.log('[MCP] Integration initialized successfully')
    } catch (error) {
      console.error('[MCP] Integration initialization failed:', error)
      this.isInitialized = false
    }
  }

  // Get MCP-compliant tools
  getTools(): Record<string, any> {
    if (!this.isInitialized || !this.config.enabled) {
      return {}
    }

    const tools: Record<string, any> = {}

    // Add file operations tool if enabled
    if (this.config.services.fileOperations) {
      tools.read_file = mcpTools.read_file
    }

    // Add KPI data tool if enabled
    if (this.config.services.kpiData) {
      tools.fetch_kpi_data = mcpTools.fetch_kpi_data
    }

    // Add web browsing tool if enabled
    if (this.config.services.webBrowsing) {
      tools.browse_docs = mcpTools.browse_docs
    }

    // Add Git operations tool if enabled
    if (this.config.services.gitOperations) {
      tools.git_tool = mcpTools.git_tool
    }

    // Add service discovery tool if enabled
    if (this.config.services.serviceDiscovery) {
      tools.discover_mcp_services = mcpTools.discover_mcp_services
    }

    // Add compliance validation tool if enabled
    if (this.config.services.complianceValidation) {
      tools.validate_mcp_compliance = mcpTools.validate_mcp_compliance
    }

    return tools
  }

  // Validate MCP configuration
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.endpoint) {
      errors.push('MCP endpoint is required')
    }

    if (this.config.timeout < 1000 || this.config.timeout > 600000) {
      errors.push('MCP timeout must be between 1000ms and 600000ms')
    }

    if (this.config.retries < 0 || this.config.retries > 10) {
      errors.push('MCP retries must be between 0 and 10')
    }

    if (this.config.rateLimit.requests < 1 || this.config.rateLimit.requests > 10000) {
      errors.push('MCP rate limit requests must be between 1 and 10000')
    }

    if (this.config.rateLimit.windowMs < 1000 || this.config.rateLimit.windowMs > 3600000) {
      errors.push('MCP rate limit window must be between 1000ms and 3600000ms')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Health check for MCP integration
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Array<{ id: string; status: string; responseTime: number }>
    errors: string[]
  }> {
    const result = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      services: [] as Array<{ id: string; status: string; responseTime: number }>,
      errors: [] as string[]
    }

    if (!this.isInitialized) {
      result.status = 'unhealthy'
      result.errors.push('MCP integration not initialized')
      return result
    }

    try {
      const services = await mcpCompatibilityManager.discoverServices()
      
      for (const service of services) {
        const startTime = performance.now()
        
        try {
          const response = await fetch(`${service.endpoint}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          })
          
          const responseTime = performance.now() - startTime
          result.services.push({
            id: service.id,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime
          })

          if (!response.ok) {
            result.status = 'degraded'
          }
          } catch (error) {
            result.services.push({
              id: service.id,
              status: 'error',
              responseTime: performance.now() - startTime
            })
            result.status = 'unhealthy'
            result.errors.push(`Service ${service.id} error: ${(error as Error).message}`)
          }
      }
    } catch (error) {
      result.status = 'unhealthy'
      result.errors.push(`Health check failed: ${(error as Error).message}`)
    }

    return result
  }

  // MCP protocol compliance check
  async complianceCheck(): Promise<{
    compliant: boolean
    checks: Array<{ name: string; status: 'pass' | 'fail'; details: any }>
  }> {
    const checks = []

    // Security compliance
    try {
      const securityCheck = await mcpCompatibilityManager.getMCPTools().validate_mcp_compliance.execute({
        checkSecurity: true,
        checkPerformance: false,
        checkConnectivity: false
      }, {})
      checks.push({
        name: 'Security Compliance',
        status: 'pass' as 'pass' | 'fail',
        details: securityCheck.security
      })
    } catch (error) {
      checks.push({
        name: 'Security Compliance',
        status: 'fail' as 'pass' | 'fail',
        details: { error: (error as Error).message }
      })
    }

    // Performance compliance
    try {
      const performanceCheck = await mcpCompatibilityManager.getMCPTools().validate_mcp_compliance.execute({
        checkSecurity: false,
        checkPerformance: true,
        checkConnectivity: false
      }, {})
      checks.push({
        name: 'Performance Compliance',
        status: 'pass' as 'pass' | 'fail',
        details: performanceCheck.performance
      })
    } catch (error) {
      checks.push({
        name: 'Performance Compliance',
        status: 'fail' as 'pass' | 'fail',
        details: { error: (error as Error).message }
      })
    }

    // Connectivity compliance
    try {
      const connectivityCheck = await mcpCompatibilityManager.getMCPTools().validate_mcp_compliance.execute({
        checkSecurity: false,
        checkPerformance: false,
        checkConnectivity: true
      }, {})
      checks.push({
        name: 'Connectivity Compliance',
        status: 'pass' as 'pass' | 'fail',
        details: connectivityCheck.connectivity
      })
    } catch (error) {
      checks.push({
        name: 'Connectivity Compliance',
        status: 'fail' as 'pass' | 'fail',
        details: { error: (error as Error).message }
      })
    }

    const compliant = checks.every(check => check.status === 'pass')

    return {
      compliant,
      checks
    }
  }

  // Get integration status
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      endpoint: this.config.endpoint,
      services: this.config.services,
      rateLimit: this.config.rateLimit,
      timeout: this.config.timeout,
      retries: this.config.retries
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<MCPIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[MCP] Configuration updated')
  }

  // Enable/disable specific services
  updateServiceConfig(service: keyof MCPIntegrationConfig['services'], enabled: boolean): void {
    this.config.services[service] = enabled
    console.log(`[MCP] Service ${service} ${enabled ? 'enabled' : 'disabled'}`)
  }
}

// Export singleton instance
export const mcpIntegrationManager = MCPIntegrationManager.getInstance()

// React hook for MCP integration
export function useMCPIntegration() {
  const [status, setStatus] = React.useState(mcpIntegrationManager.getStatus())
  const [health, setHealth] = React.useState<any>(null)
  const [compliance, setCompliance] = React.useState<any>(null)

  React.useEffect(() => {
    mcpIntegrationManager.initialize().then(() => {
      setStatus(mcpIntegrationManager.getStatus())
    })
  }, [])

  const refreshHealth = React.useCallback(async () => {
    const healthData = await mcpIntegrationManager.healthCheck()
    setHealth(healthData)
  }, [])

  const refreshCompliance = React.useCallback(async () => {
    const complianceData = await mcpIntegrationManager.complianceCheck()
    setCompliance(complianceData)
  }, [])

  return {
    status,
    health,
    compliance,
    refreshHealth,
    refreshCompliance,
    getTools: () => mcpIntegrationManager.getTools(),
    updateConfig: (config: Partial<MCPIntegrationConfig>) => mcpIntegrationManager.updateConfig(config),
    updateService: (service: keyof MCPIntegrationConfig['services'], enabled: boolean) => 
      mcpIntegrationManager.updateServiceConfig(service, enabled)
  }
}