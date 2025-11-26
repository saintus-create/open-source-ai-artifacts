import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { githubDark } from '@uiw/codemirror-theme-github'

export function CodeView({ code, lang }: { code: string; lang: string }) {
  const extensions = []

  if (lang === 'js' || lang === 'jsx' || lang === 'ts' || lang === 'tsx') {
    extensions.push(javascript({ jsx: true, typescript: true }))
  } else if (lang === 'py' || lang === 'python') {
    extensions.push(python())
  }

  return (
    <CodeMirror
      value={code}
      height="100%"
      theme={githubDark}
      extensions={extensions}
      readOnly={true}
      editable={false}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: false,
      }}
      style={{ fontSize: 12, height: '100%' }}
    />
  )
}
