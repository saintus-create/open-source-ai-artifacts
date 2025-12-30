import crypto from 'crypto'

// Security utilities for AI code generation and sandbox execution
export class SecurityManager {
  private static instance: SecurityManager
  private readonly allowedDomains: string[] = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'e2b.dev',
    'api.openai.com',
    'api.anthropic.com',
    'api.groq.com',
    'api.fireworks.ai',
    'api.together.ai',
    'api.mistral.ai',
    'api.x.ai'
  ]

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Validate and sanitize user input
  validateInput(input: string): string {
    // Remove potentially dangerous characters
    const sanitized = input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JS protocols
      .replace(/data:/gi, '') // Remove data URLs
      .replace(/file:/gi, '') // Remove file protocols
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\./i,
      /window\./i,
      /localStorage/i,
      /sessionStorage/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Input contains potentially dangerous code patterns')
      }
    }

    return sanitized
  }

  // Validate file paths to prevent directory traversal
  validateFilePath(filePath: string): string {
    // Normalize path
    const normalized = filePath.replace(/\\/g, '/').replace(/\/+/g, '/')
    
    // Check for directory traversal attempts
    if (normalized.includes('../') || normalized.includes('..\\')) {
      throw new Error('Invalid file path: directory traversal detected')
    }

    // Check for absolute paths
    if (normalized.startsWith('/') || normalized.match(/^[A-Za-z]:/)) {
      throw new Error('Invalid file path: absolute paths not allowed')
    }

    return normalized
  }

  // Validate URLs for network requests
  validateUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      
      // Check if domain is allowed
      if (!this.allowedDomains.includes(urlObj.hostname)) {
        throw new Error(`Domain not allowed: ${urlObj.hostname}`)
      }

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol: only HTTP/HTTPS allowed')
      }

      return url
    } catch (error) {
      throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate secure hash for code validation
  generateCodeHash(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
  }

  // Validate code hash
  validateCodeHash(code: string, expectedHash: string): boolean {
    const actualHash = this.generateCodeHash(code)
    return actualHash === expectedHash
  }

  // Content Security Policy generator
  generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.groq.com https://api.fireworks.ai https://api.together.ai https://api.mistral.ai https://api.x.ai",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }

  // Sanitize HTML output
  sanitizeHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Remove forms
  }

  // Validate sandbox configuration
  validateSandboxConfig(config: any): boolean {
    const required = ['timeout', 'memory', 'cpu']
    const valid = required.every(key => 
      config[key] !== undefined && 
      config[key] > 0 && 
      config[key] <= this.getMaxValue(key)
    )

    if (!valid) {
      throw new Error('Invalid sandbox configuration: values out of range')
    }

    return true
  }

  private getMaxValue(key: string): number {
    const limits: Record<string, number> = {
      timeout: 600000, // 10 minutes max
      memory: 4096,    // 4GB max
      cpu: 4           // 4 cores max
    }
    return limits[key] || 1000
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance()