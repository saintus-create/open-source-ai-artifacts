// Testing utilities for Fragments application
import { FragmentSchema } from './schema'
import { TemplateId } from './templates'

// Mock data generators for testing
export class TestDataManager {
  static generateMockFragment(template: TemplateId): FragmentSchema {
    const baseFragment: Partial<FragmentSchema> = {
      title: 'Test Project',
      description: 'A test project for validation',
      commentary: 'This is a test fragment generated for testing purposes',
      template,
      additional_dependencies: [],
      has_additional_dependencies: false,
      install_dependencies_command: '',
      port: null,
      code: []
    }

    switch (template) {
      case 'nextjs-developer':
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'pages/index.tsx',
              file_content: `import React from 'react'

export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <p>This is a test Next.js component</p>
    </div>
  )
}`
            },
            {
              file_path: 'package.json',
              file_content: JSON.stringify({
                name: 'test-project',
                version: '1.0.0',
                dependencies: {
                  react: '^18.0.0',
                  'react-dom': '^18.0.0'
                }
              }, null, 2)
            }
          ]
        } as FragmentSchema

      case 'vue-developer':
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'App.vue',
              file_content: `<template>
  <div>
    <h1>Hello Vue</h1>
    <p>This is a test Vue component</p>
  </div>
</template>

<script setup>
// Vue 3 Composition API
</script>`
            }
          ]
        } as FragmentSchema

      case 'streamlit-developer':
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'app.py',
              file_content: `import streamlit as st

st.title('Test Streamlit App')
st.write('This is a test Streamlit application')`
            }
          ]
        } as FragmentSchema

      case 'gradio-developer':
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'app.py',
              file_content: `import gradio as gr

def greet(name):
    return f"Hello {name}!"

demo = gr.Interface(fn=greet, inputs="text", outputs="text")
demo.launch()`
            }
          ]
        } as FragmentSchema

      case 'code-interpreter-v1':
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'script.py',
              file_content: `import pandas as pd
import matplotlib.pyplot as plt

# Test data analysis
data = {'x': [1, 2, 3, 4, 5], 'y': [2, 4, 6, 8, 10]}
df = pd.DataFrame(data)
print(df.describe())`
            }
          ]
        } as FragmentSchema

      default:
        return {
          ...baseFragment,
          code: [
            {
              file_path: 'index.js',
              file_content: 'console.log("Hello World");'
            }
          ]
        } as FragmentSchema
    }
  }

  static generateMockTemplate(): any {
    return {
      name: 'Test Template',
      lib: ['test-lib'],
      file: 'test.js',
      instructions: 'A test template',
      port: null
    }
  }
}

// Test validators
export class TestValidators {
  static validateFragment(fragment: FragmentSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!fragment.title || fragment.title.length === 0) {
      errors.push('Fragment must have a title')
    }

    if (!fragment.description || fragment.description.length === 0) {
      errors.push('Fragment must have a description')
    }

    if (!fragment.code || fragment.code.length === 0) {
      errors.push('Fragment must have code')
    }

    if (fragment.code) {
      fragment.code.forEach((file, index) => {
        if (!file.file_path) {
          errors.push(`File ${index} must have a file_path`)
        }
        if (!file.file_content) {
          errors.push(`File ${index} must have file_content`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateTemplate(template: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.name) {
      errors.push('Template must have a name')
    }

    if (!template.lib || !Array.isArray(template.lib)) {
      errors.push('Template must have a lib array')
    }

    if (!template.file) {
      errors.push('Template must have a file')
    }

    if (!template.instructions) {
      errors.push('Template must have instructions')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Performance testing utilities
export class PerformanceTester {
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, time: end - start }
  }

  static async measureMemoryUsage<T>(fn: () => Promise<T>): Promise<{ result: T; memory: number }> {
    // Note: performance.memory is not available in all environments
    const startMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    const result = await fn()
    const endMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    return { result, memory: endMemory - startMemory }
  }

  static async benchmarkFunction<T>(
    fn: () => Promise<T>,
    iterations: number = 10
  ): Promise<{ avgTime: number; minTime: number; maxTime: number; totalTime: number }> {
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const { time } = await this.measureExecutionTime(fn)
      times.push(time)
    }

    return {
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0)
    }
  }
}

// Mock functions for testing
export const mockFunctions = {
  mockE2BClient: () => ({
    create: () => Promise.resolve({ id: 'test-sandbox-id' }),
    run: () => Promise.resolve({ success: true }),
    kill: () => Promise.resolve(true),
    listFiles: () => Promise.resolve(['file1.js', 'file2.js']),
    readFile: () => Promise.resolve('file content'),
    writeFile: () => Promise.resolve(true)
  }),

  mockAIProvider: () => ({
    generate: () => Promise.resolve({
      text: 'Generated code',
      usage: { promptTokens: 100, completionTokens: 200 }
    }),
    stream: () => ({
      toTextStreamResponse: () => new Response('stream')
    })
  }),

  mockFileSystem: () => ({
    existsSync: () => true,
    readFileSync: () => 'file content',
    writeFileSync: () => {},
    mkdirSync: () => {},
    readdirSync: () => ['file1.js', 'file2.js']
  })
}

// Export test utilities
export const testDataManager = TestDataManager
export const testValidators = TestValidators
export const performanceTester = PerformanceTester