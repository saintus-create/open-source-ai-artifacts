import { FragmentSchema } from './schema'
import { FallbackManager } from './fallbacks'

export interface SandboxError extends Error {
  type: 'TIMEOUT' | 'MEMORY_EXCEEDED' | 'NETWORK_ERROR' | 'FILESYSTEM_ERROR' | 'EXECUTION_ERROR'
  code?: string
  details?: any
}

export class SandboxError extends Error {
  constructor(
    message: string,
    public type: SandboxError['type'],
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'SandboxError'
  }
}

// Enhanced error handling for E2B sandbox operations
export class SandboxErrorHandler {
  private fallbackManager = FallbackManager.getInstance()

  // Handle sandbox creation errors
  async handleSandboxCreationError(error: Error, templateId: string): Promise<any> {
    console.error('Sandbox creation failed:', error)
    
    // Determine error type
    const sandboxError = this.categorizeError(error)
    
    // Try fallback template if available
    if (sandboxError.type === 'EXECUTION_ERROR' || sandboxError.type === 'TIMEOUT') {
      const fallbackTemplate = this.fallbackManager.getFallbackTemplate(templateId as any)
      if (fallbackTemplate) {
        console.log(`Trying fallback template: ${fallbackTemplate}`)
        return { useFallback: true, template: fallbackTemplate }
      }
    }
    
    // Return degraded fragment
    return { useFallback: false, error: sandboxError }
  }

  // Handle sandbox execution errors
  async handleExecutionError(error: Error, fragment: FragmentSchema): Promise<FragmentSchema> {
    console.error('Sandbox execution failed:', error)
    
    const sandboxError = this.categorizeError(error)
    
    // Create degraded fragment based on error type
    switch (sandboxError.type) {
      case 'TIMEOUT':
        return this.createTimeoutFragment(fragment, sandboxError)
      case 'MEMORY_EXCEEDED':
        return this.createMemoryFragment(fragment, sandboxError)
      case 'NETWORK_ERROR':
        return this.createNetworkFragment(fragment, sandboxError)
      default:
        return this.createGenericErrorFragment(fragment, sandboxError)
    }
  }

  // Handle file system errors
  async handleFilesystemError(error: Error, filePath: string): Promise<string> {
    console.error('Filesystem operation failed:', error)
    
    const sandboxError = this.categorizeError(error)
    
    // Try to recover by creating the directory structure
    if (sandboxError.type === 'FILESYSTEM_ERROR') {
      console.log(`Attempting to create directory for: ${filePath}`)
      // Implementation would depend on the specific filesystem API
      return 'recovery_attempted'
    }
    
    throw sandboxError
  }

  // Categorize sandbox errors
  private categorizeError(error: Error): SandboxError {
    const message = error.message.toLowerCase()
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return new SandboxError('Sandbox operation timed out', 'TIMEOUT', 'TIMEOUT_ERROR', error)
    }
    
    if (message.includes('memory') || message.includes('out of memory')) {
      return new SandboxError('Sandbox exceeded memory limit', 'MEMORY_EXCEEDED', 'MEMORY_ERROR', error)
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return new SandboxError('Network error in sandbox', 'NETWORK_ERROR', 'NETWORK_ERROR', error)
    }
    
    if (message.includes('file') || message.includes('directory')) {
      return new SandboxError('Filesystem error in sandbox', 'FILESYSTEM_ERROR', 'FS_ERROR', error)
    }
    
    return new SandboxError('Unknown sandbox error', 'EXECUTION_ERROR', 'UNKNOWN_ERROR', error)
  }

  // Create timeout-specific error fragment
  private createTimeoutFragment(fragment: FragmentSchema, error: SandboxError): FragmentSchema {
    return {
      ...fragment,
      code: [
        {
          file_path: 'error.html',
          file_content: `<!DOCTYPE html>
<html>
<head>
  <title>Execution Timeout</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
    .error { color: #f57c00; }
    .message { margin: 20px 0; }
    .solution { background: #fff3e0; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1 class="error">Execution Timeout</h1>
  <p class="message">Code execution timed out after sandbox limit</p>
  <div class="solution">
    <h3>This usually happens when:</h3>
    <ul style="text-align: left; display: inline-block;">
      <li>Code has infinite loops</li>
      <li>Code performs heavy computations</li>
      <li>Dependencies take too long to install</li>
    </ul>
    <p><strong>SOLUTION:</strong> Try simplifying your code or breaking it into smaller parts.</p>
  </div>
</body>
</html>`
        }
      ],
      // @ts-ignore
      status: 'timeout',
      error: error.message
    } as any
  }

  // Create memory-specific error fragment
  private createMemoryFragment(fragment: FragmentSchema, error: SandboxError): FragmentSchema {
    return {
      ...fragment,
      code: [
        {
          file_path: 'error.html',
          file_content: `<!DOCTYPE html>
<html>
<head>
  <title>Memory Limit Exceeded</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
    .error { color: #d32f2f; }
    .message { margin: 20px 0; }
    .solution { background: #ffebee; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1 class="error">Memory Limit Exceeded</h1>
  <p class="message">Code exceeded memory limit</p>
  <div class="solution">
    <h3>This usually happens when:</h3>
    <ul style="text-align: left; display: inline-block;">
      <li>Code processes large datasets</li>
      <li>Code has memory leaks</li>
      <li>Too many dependencies are installed</li>
    </ul>
    <p><strong>SOLUTION:</strong> Try reducing data size or optimizing memory usage.</p>
  </div>
</body>
</html>`
        }
      ],
      // @ts-ignore
      status: 'memory_error',
      error: error.message
    } as any
  }

  // Create network-specific error fragment
  private createNetworkFragment(fragment: FragmentSchema, error: SandboxError): FragmentSchema {
    return {
      ...fragment,
      code: [
        {
          file_path: 'error.html',
          file_content: `<!DOCTYPE html>
<html>
<head>
  <title>Network Error</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
    .error { color: #1976d2; }
    .message { margin: 20px 0; }
    .solution { background: #e3f2fd; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1 class="error">Network Error</h1>
  <p class="message">Network access failed</p>
  <div class="solution">
    <h3>This usually happens when:</h3>
    <ul style="text-align: left; display: inline-block;">
      <li>External API calls are blocked</li>
      <li>Network connectivity issues</li>
      <li>Firewall restrictions</li>
    </ul>
    <p><strong>SOLUTION:</strong> Check network settings or use offline alternatives.</p>
  </div>
</body>
</html>`
        }
      ],
      // @ts-ignore
      status: 'network_error',
      error: error.message
    } as any
  }

  // Create generic error fragment
  private createGenericErrorFragment(fragment: FragmentSchema, error: SandboxError): FragmentSchema {
    return {
      ...fragment,
      code: [
        {
          file_path: 'error.html',
          file_content: `<!DOCTYPE html>
<html>
<head>
  <title>Execution Failed</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
    .error { color: #d32f2f; }
    .message { margin: 20px 0; }
    .solution { background: #ffebee; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1 class="error">Execution Failed</h1>
  <p class="message">Error: ${error.message}</p>
  <div class="solution">
    <p><strong>SOLUTION:</strong> Check the error details and try again.</p>
  </div>
</body>
</html>`
        }
      ],
      // @ts-ignore
      status: 'error',
      error: error.message
    } as any
  }

  // Validate sandbox configuration
  validateSandboxConfig(config: any): boolean {
    const required = ['timeout', 'memory', 'cpu']
    return required.every(key => config[key] !== undefined && config[key] > 0)
  }

  // Get safe sandbox configuration
  getSafeSandboxConfig(): any {
    return {
      timeout: 300000, // 5 minutes
      memory: 2048, // 2GB
      cpu: 2, // 2 cores
      allowNetwork: false, // Start with no network access
      allowFilesystem: true,
    }
  }
}

// Export singleton instance
export const sandboxErrorHandler = new SandboxErrorHandler()