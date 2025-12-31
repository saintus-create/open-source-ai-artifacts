// MCP (Model Context Protocol) Validation and Testing Utilities
// Ensures compatibility with any MCP-compliant service

import { MCPIntegrationManager } from './mcp-integration'
import { mcpCompatibilityManager } from './mcp-compatibility'
import { securityManager } from './security'
import { monitoringManager } from './monitoring'

export interface MCPValidationResult {
  compliant: boolean
  checks: MCPCheck[]
  errors: string[]
  warnings: string[]
}

export interface MCPCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  details: any
  timestamp: number
}

export class MCPValidator {
  private static instance: MCPValidator

  static getInstance(): MCPValidator {
    if (!MCPValidator.instance) {
      MCPValidator.instance = new MCPValidator()
    }
    return MCPValidator.instance
  }

  // Comprehensive MCP compliance validation
  async validateMCPCompliance(): Promise<MCPValidationResult> {
    const result: MCPValidationResult = {
      compliant: true,
      checks: [],
      errors: [],
      warnings: []
    }

    // 1. Configuration validation
    const configCheck = await this.validateConfiguration()
    result.checks.push(configCheck)
    if (configCheck.status === 'fail') {
      result.compliant = false
      result.errors.push('Configuration validation failed')
    } else if (configCheck.status === 'warn') {
      result.warnings.push('Configuration has warnings')
    }

    // 2. Security compliance validation
    const securityCheck = await this.validateSecurityCompliance()
    result.checks.push(securityCheck)
    if (securityCheck.status === 'fail') {
      result.compliant = false
      result.errors.push('Security compliance failed')
    }

    // 3. Protocol compliance validation
    const protocolCheck = await this.validateProtocolCompliance()
    result.checks.push(protocolCheck)
    if (protocolCheck.status === 'fail') {
      result.compliant = false
      result.errors.push('Protocol compliance failed')
    }

    // 4. Performance compliance validation
    const performanceCheck = await this.validatePerformanceCompliance()
    result.checks.push(performanceCheck)
    if (performanceCheck.status === 'fail') {
      result.compliant = false
      result.errors.push('Performance compliance failed')
    }

    // 5. Service discovery validation
    const discoveryCheck = await this.validateServiceDiscovery()
    result.checks.push(discoveryCheck)
    if (discoveryCheck.status === 'fail') {
      result.compliant = false
      result.errors.push('Service discovery failed')
    }

    return result
  }

  // Configuration validation
  private async validateConfiguration(): Promise<MCPCheck> {
    const integrationManager = MCPIntegrationManager.getInstance()
    const config = integrationManager.getStatus()

    const checks = []

    // Check if MCP is enabled
    if (!config.enabled) {
      checks.push({ name: 'MCP Enabled', status: 'warn', details: 'MCP integration is disabled' })
    } else {
      checks.push({ name: 'MCP Enabled', status: 'pass', details: 'MCP integration is enabled' })
    }

    // Check endpoint configuration
    if (!config.endpoint) {
      checks.push({ name: 'Endpoint Configuration', status: 'fail', details: 'MCP endpoint not configured' })
    } else {
      checks.push({ name: 'Endpoint Configuration', status: 'pass', details: `Endpoint: ${config.endpoint}` })
    }

    // Check timeout configuration
    if (config.timeout < 1000 || config.timeout > 600000) {
      checks.push({ name: 'Timeout Configuration', status: 'fail', details: 'Invalid timeout configuration' })
    } else {
      checks.push({ name: 'Timeout Configuration', status: 'pass', details: `Timeout: ${config.timeout}ms` })
    }

    // Check rate limiting configuration
    if (config.rateLimit.requests < 1 || config.rateLimit.requests > 10000) {
      checks.push({ name: 'Rate Limit Configuration', status: 'fail', details: 'Invalid rate limit configuration' })
    } else {
      checks.push({ name: 'Rate Limit Configuration', status: 'pass', details: `Rate limit: ${config.rateLimit.requests}/window` })
    }

    const allPassed = checks.every(check => check.status === 'pass')
    const hasWarnings = checks.some(check => check.status === 'warn')

    return {
      name: 'Configuration Validation',
      status: allPassed ? 'pass' : (hasWarnings ? 'warn' : 'fail'),
      details: checks,
      timestamp: Date.now()
    }
  }

  // Security compliance validation
  private async validateSecurityCompliance(): Promise<MCPCheck> {
    const checks = []

    // Check input validation
    try {
      securityManager.validateInput('test input')
      checks.push({ name: 'Input Validation', status: 'pass', details: 'Input validation working correctly' })
    } catch (error) {
      checks.push({ name: 'Input Validation', status: 'fail', details: `Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    }

    // Check file path validation
    try {
      securityManager.validateFilePath('test/file.js')
      checks.push({ name: 'File Path Validation', status: 'pass', details: 'File path validation working correctly' })
    } catch (error) {
      checks.push({ name: 'File Path Validation', status: 'fail', details: `File path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    }

    // Check URL validation
    try {
      securityManager.validateUrl('https://example.com')
      checks.push({ name: 'URL Validation', status: 'pass', details: 'URL validation working correctly' })
    } catch (error) {
      checks.push({ name: 'URL Validation', status: 'fail', details: `URL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    }

    // Check CSP generation
    try {
      const csp = securityManager.generateCSP()
      checks.push({ name: 'Content Security Policy', status: 'pass', details: 'CSP generation working correctly' })
    } catch (error) {
      checks.push({ name: 'Content Security Policy', status: 'fail', details: `CSP generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    }

    const allPassed = checks.every(check => check.status === 'pass')

    return {
      name: 'Security Compliance Validation',
      status: allPassed ? 'pass' : 'fail',
      details: checks,
      timestamp: Date.now()
    }
  }

  // Protocol compliance validation
  private async validateProtocolCompliance(): Promise<MCPCheck> {
    const checks = []

    // Check tool definitions
    const tools = mcpCompatibilityManager.getMCPTools()
    const expectedTools = ['read_file', 'fetch_kpi_data', 'browse_docs', 'git_tool', 'discover_mcp_services', 'validate_mcp_compliance']
    
    for (const toolName of expectedTools) {
      if (tools[toolName]) {
        checks.push({ name: `Tool: ${toolName}`, status: 'pass', details: 'Tool is properly defined' })
      } else {
        checks.push({ name: `Tool: ${toolName}`, status: 'fail', details: 'Tool is missing or not properly defined' })
      }
    }

    // Check tool parameters
    const readFileTool = tools.read_file
    if (readFileTool && readFileTool.parameters) {
      checks.push({ name: 'Tool Parameters', status: 'pass', details: 'Tool parameters are properly defined' })
    } else {
      checks.push({ name: 'Tool Parameters', status: 'fail', details: 'Tool parameters are missing or invalid' })
    }

    const allPassed = checks.every(check => check.status === 'pass')

    return {
      name: 'Protocol Compliance Validation',
      status: allPassed ? 'pass' : 'fail',
      details: checks,
      timestamp: Date.now()
    }
  }

  // Performance compliance validation
  private async validatePerformanceCompliance(): Promise<MCPCheck> {
    const checks = []

    // Check monitoring system
    try {
      const health = monitoringManager.getSystemHealth()
      if (health.performance.avgResponseTime < 1000) {
        checks.push({ name: 'Response Time', status: 'pass', details: `Average response time: ${health.performance.avgResponseTime}ms` })
      } else {
        checks.push({ name: 'Response Time', status: 'warn', details: `High response time: ${health.performance.avgResponseTime}ms` })
      }

      if (health.memory.percentage < 80) {
        checks.push({ name: 'Memory Usage', status: 'pass', details: `Memory usage: ${health.memory.percentage.toFixed(2)}%` })
      } else {
        checks.push({ name: 'Memory Usage', status: 'warn', details: `High memory usage: ${health.memory.percentage.toFixed(2)}%` })
      }

      if (health.errors.count < 10) {
        checks.push({ name: 'Error Rate', status: 'pass', details: `Error count: ${health.errors.count}` })
      } else {
        checks.push({ name: 'Error Rate', status: 'warn', details: `High error count: ${health.errors.count}` })
      }
    } catch (error) {
      checks.push({ name: 'Monitoring System', status: 'fail', details: `Monitoring system error: ${error.message}` })
    }

    const allPassed = checks.every(check => check.status === 'pass')
    const hasWarnings = checks.some(check => check.status === 'warn')

    return {
      name: 'Performance Compliance Validation',
      status: allPassed ? 'pass' : (hasWarnings ? 'warn' : 'fail'),
      details: checks,
      timestamp: Date.now()
    }
  }

  // Service discovery validation
  private async validateServiceDiscovery(): Promise<MCPCheck> {
    const checks = []

    try {
      const services = await mcpCompatibilityManager.discoverServices()
      checks.push({ name: 'Service Discovery', status: 'pass', details: `Discovered ${services.length} services` })

      // Check service health
      let healthyServices = 0
      for (const service of services) {
        try {
          const response = await fetch(`${service.endpoint}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          })
          if (response.ok) {
            healthyServices++
          }
        } catch (error) {
          // Service is not healthy
        }
      }

      if (healthyServices === services.length) {
        checks.push({ name: 'Service Health', status: 'pass', details: 'All services are healthy' })
      } else if (healthyServices > 0) {
        checks.push({ name: 'Service Health', status: 'warn', details: `${healthyServices}/${services.length} services are healthy` })
      } else {
        checks.push({ name: 'Service Health', status: 'fail', details: 'No healthy services found' })
      }
    } catch (error) {
      checks.push({ name: 'Service Discovery', status: 'fail', details: `Service discovery failed: ${error.message}` })
    }

    const allPassed = checks.every(check => check.status === 'pass')
    const hasWarnings = checks.some(check => check.status === 'warn')

    return {
      name: 'Service Discovery Validation',
      status: allPassed ? 'pass' : (hasWarnings ? 'warn' : 'fail'),
      details: checks,
      timestamp: Date.now()
    }
  }

  // Test MCP integration with mock services
  async testMCPIntegration(): Promise<{
    success: boolean
    results: Array<{ service: string; operation: string; success: boolean; duration: number; error?: string }>
  }> {
    const results = []
    const integrationManager = MCPIntegrationManager.getInstance()

    // Test file operations
    try {
      const startTime = performance.now()
      const tools = integrationManager.getTools()
      
      if (tools.read_file) {
        // Test with a safe file
        const result = await tools.read_file.execute({ filePath: 'package.json', maxSize: 1000 })
        const duration = performance.now() - startTime
        results.push({
          service: 'File Operations',
          operation: 'read_file',
          success: true,
          duration
        })
      }
    } catch (error) {
      results.push({
        service: 'File Operations',
        operation: 'read_file',
        success: false,
        duration: 0,
        error: error.message
      })
    }

    // Test KPI data fetching
    try {
      const startTime = performance.now()
      const tools = integrationManager.getTools()
      
      if (tools.fetch_kpi_data) {
        const result = await tools.fetch_kpi_data.execute({ domain: 'test', timeRange: 'month' })
        const duration = performance.now() - startTime
        results.push({
          service: 'KPI Data',
          operation: 'fetch_kpi_data',
          success: true,
          duration
        })
      }
    } catch (error) {
      results.push({
        service: 'KPI Data',
        operation: 'fetch_kpi_data',
        success: false,
        duration: 0,
        error: error.message
      })
    }

    // Test service discovery
    try {
      const startTime = performance.now()
      const tools = integrationManager.getTools()
      
      if (tools.discover_mcp_services) {
        const result = await tools.discover_mcp_services.execute({})
        const duration = performance.now() - startTime
        results.push({
          service: 'Service Discovery',
          operation: 'discover_mcp_services',
          success: true,
          duration
        })
      }
    } catch (error) {
      results.push({
        service: 'Service Discovery',
        operation: 'discover_mcp_services',
        success: false,
        duration: 0,
        error: error.message
      })
    }

    const success = results.every(result => result.success)

    return {
      success,
      results
    }
  }

  // Generate MCP compliance report
  async generateComplianceReport(): Promise<string> {
    const validation = await this.validateMCPCompliance()
    const testResults = await this.testMCPIntegration()

    let report = '# MCP Compliance Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    // Summary
    report += '## Summary\n\n'
    report += `- **Compliance Status**: ${validation.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n`
    report += `- **Total Checks**: ${validation.checks.length}\n`
    report += `- **Passed**: ${validation.checks.filter(c => c.status === 'pass').length}\n`
    report += `- **Failed**: ${validation.checks.filter(c => c.status === 'fail').length}\n`
    report += `- **Warnings**: ${validation.checks.filter(c => c.status === 'warn').length}\n`
    report += `- **Integration Test**: ${testResults.success ? '✅ PASSED' : '❌ FAILED'}\n\n`

    // Detailed checks
    report += '## Detailed Checks\n\n'
    validation.checks.forEach(check => {
      const statusIcon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'
      report += `### ${statusIcon} ${check.name}\n\n`
      report += `**Status**: ${check.status.toUpperCase()}\n`
      report += `**Timestamp**: ${new Date(check.timestamp).toISOString()}\n\n`
      
      if (Array.isArray(check.details)) {
        check.details.forEach(detail => {
          const detailIcon = detail.status === 'pass' ? '✅' : detail.status === 'warn' ? '⚠️' : '❌'
          report += `- ${detailIcon} ${detail.name}: ${detail.details}\n`
        })
      } else {
        report += `**Details**: ${JSON.stringify(check.details, null, 2)}\n\n`
      }
      report += '\n'
    })

    // Test results
    report += '## Integration Test Results\n\n'
    testResults.results.forEach(result => {
      const statusIcon = result.success ? '✅' : '❌'
      report += `- ${statusIcon} **${result.service}** - ${result.operation}: ${result.duration.toFixed(2)}ms`
      if (result.error) {
        report += ` (Error: ${result.error})`
      }
      report += '\n'
    })

    // Errors and warnings
    if (validation.errors.length > 0) {
      report += '\n## Errors\n\n'
      validation.errors.forEach(error => {
        report += `- ❌ ${error}\n`
      })
    }

    if (validation.warnings.length > 0) {
      report += '\n## Warnings\n\n'
      validation.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`
      })
    }

    return report
  }
}

// Export singleton instance
export const mcpValidator = MCPValidator.getInstance()
