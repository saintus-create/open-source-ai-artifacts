'use client'

import { useEffect, useRef, useState } from 'react'
import type { DeepPartial } from 'ai'
import type { FragmentSchema } from '@/lib/schema'

// Lightweight in-browser Python via Pyodide CDN
// This avoids any server/proprietary runtime
// Minimal HTML that loads pyodide and runs the provided code
const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { height: 100%; margin: 0; background: #0b0b0b; color: #e5e5e5; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      pre { white-space: pre-wrap; word-break: break-word; }
      .wrap { display: flex; flex-direction: column; height: 100%; }
      .head { padding: 10px; border-bottom: 1px solid #222; font-size: 12px; color: #aaa; }
      .body { flex: 1; overflow: auto; padding: 12px; }
      .ok { color: #9ae6b4 }
      .err { color: #feb2b2 }
    </style>
    <script defer src="https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js"></script>
  </head>
  <body>
    <div class="wrap">
      <div class="head">Pyodide Python runner</div>
      <div id="out" class="body"></div>
    </div>
    <script>
      function write(txt, cls) {
        const el = document.getElementById('out');
        const pre = document.createElement('pre');
        if (cls) pre.className = cls;
        pre.textContent = txt;
        el.appendChild(pre);
      }
      (async () => {
        try {
          const pyodide = await loadPyodide({ stdout: (t) => write(t, 'ok'), stderr: (t) => write(t, 'err') });
          const code = atob(window.location.hash.slice(1));
          if (!code) { write('No code provided.', 'err'); return; }
          await pyodide.runPythonAsync(code);
          write('\n[done]', 'ok');
        } catch (e) {
          write(String(e), 'err');
        }
      })();
    </script>
  </body>
</html>`

export function PyodideInterpreter({
  fragment,
}: {
  fragment: DeepPartial<FragmentSchema>
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Blob URL for isolated iframe document
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const iframe = iframeRef.current
    if (!iframe) return

    const codeContent = fragment.code?.[0]?.file_content || ''
    iframe.src = url + '#' + btoa(codeContent)
    setReady(true)
    return () => URL.revokeObjectURL(url)
  }, [fragment.code])

  return (
    <div className="flex flex-col w-full h-full">
      <iframe
        ref={iframeRef}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
      />
    </div>
  )
}
