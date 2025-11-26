'use client'

import { useEffect, useRef } from 'react'
import sdk from '@stackblitz/sdk'

export function SandpackPreview({
  files,
}: {
  files: Record<string, string>
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !files || Object.keys(files).length === 0) {
      return
    }

    // Build project files for StackBlitz
    const projectFiles: Record<string, string> = {
      'package.json': JSON.stringify({
        name: 'ai-generated-preview',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': 'latest',
          recharts: 'latest',
          clsx: 'latest',
          'tailwind-merge': 'latest',
        },
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
      'src/App.tsx': files['/page.tsx'] || files['/App.tsx'] || files['/App.js'] ||
        'export default function App() { return <div>No component generated</div> }',
    }

    // Add any additional files from the fragment
    Object.entries(files).forEach(([path, content]) => {
      const clean = path.replace(/^\//, '')
      if (!['page.tsx', 'App.tsx', 'App.js', 'main.tsx'].includes(clean)) {
        projectFiles[`src/${clean}`] = content
      }
    })

    // Embed the project
    sdk.embedProject(
      containerRef.current,
      {
        title: 'AI Generated Preview',
        description: 'Live preview of AI-generated code',
        template: 'node',
        files: projectFiles,
      },
      {
        openFile: 'src/App.tsx',
        view: 'preview',
        height: '100%',
        hideNavigation: true,
      }
    )
  }, [files])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: '400px' }}
    />
  )
}
