---
description: Bolt.diy2 Feature Integration Plan
---

# Bolt.diy2 Feature Integration Plan

This workflow guides the integration of selected features from Bolt.diy2 into our open-source-ai-artifacts repo.

## Phase 1: File System Management (Week 1-2)

### 1.1 File Tree Component
**Priority**: HIGH ⭐⭐⭐⭐⭐
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create `components/file-tree/` directory structure
- [ ] Add `FileTree.tsx` component with folder/file navigation
- [ ] Add `FileTreeItem.tsx` for individual items
- [ ] Integrate with fragment state to show generated files
- [ ] Add file selection and highlighting
- [ ] Support expand/collapse folders

**Dependencies to Add**:
```json
"lucide-react": "^0.396.0" (already have)
"react-resizable-panels": "^2.1.7"
```

**Reference Files from Bolt.diy2**:
- `app/components/workbench/FileTree.tsx`
- `app/lib/stores/files.ts`

### 1.2 Multi-File Editor Support
**Priority**: HIGH ⭐⭐⭐⭐⭐
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Extend schema to support multiple files (not just code[0])
- [ ] Add file tabs above code editor
- [ ] Support switching between open files
- [ ] Add "close tab" functionality
- [ ] Persist open file state

**Reference Files from Bolt.diy2**:
- `app/components/workbench/EditorPanel.tsx`
- `app/lib/stores/editor.ts`

### 1.3 File Actions (Create, Delete, Rename)
**Priority**: MEDIUM ⭐⭐⭐⭐
**Estimated Time**: 2 days

**Tasks**:
- [ ] Add context menu to file tree items
- [ ] Implement create new file
- [ ] Implement delete file (with confirmation)
- [ ] Implement rename file
- [ ] Update fragment schema accordingly

---

## Phase 2: Terminal Integration (Week 2-3)

### 2.1 Terminal Component Setup
**Priority**: HIGH ⭐⭐⭐⭐⭐
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Install xterm dependencies
- [ ] Create `components/terminal/Terminal.tsx`
- [ ] Add terminal panel to workbench layout
- [ ] Setup resizable panels (file tree | editor | terminal)

**Dependencies to Add**:
```json
"@xterm/xterm": "^5.5.0",
"@xterm/addon-fit": "^0.10.0",
"@xterm/addon-web-links": "^0.11.0"
```

**Reference Files from Bolt.diy2**:
- `app/components/workbench/terminal/Terminal.tsx`
- `app/lib/stores/terminal.ts`

### 2.2 WebContainer Integration (Alternative Executor)
**Priority**: HIGH ⭐⭐⭐⭐⭐
**Estimated Time**: 4-5 days

**Tasks**:
- [ ] Create `lib/webcontainer/` directory
- [ ] Add WebContainer initialization
- [ ] Create executor that uses WebContainer instead of E2B
- [ ] Add toggle in settings: E2B vs WebContainer
- [ ] Connect terminal to WebContainer shell
- [ ] Handle npm install, build commands

**Dependencies to Add**:
```json
"@webcontainer/api": "^1.3.0"
```

**Reference Files from Bolt.diy2**:
- `app/lib/webcontainer/index.ts`
- `app/lib/runtime/action-runner.ts`

---

## Phase 3: Git Integration (Week 3-4)

### 3.1 GitHub Publishing
**Priority**: MEDIUM ⭐⭐⭐⭐
**Estimated Time**: 3-4 days

**Tasks**:
- [ ] Create `lib/git.ts` for Git operations
- [ ] Add "Publish to GitHub" button
- [ ] Use Octokit to create repositories
- [ ] Push generated code to new repo
- [ ] Add authentication flow (GitHub OAuth or token)

**Dependencies to Add**:
```json
"isomorphic-git": "^1.27.2",
"@octokit/rest": "^21.0.2"
```

**Reference Files from Bolt.diy2**:
- `app/lib/hooks/useGit.ts`
- `app/components/git/*`

### 3.2 Project Import
**Priority**: MEDIUM ⭐⭐⭐
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Add "Import from GitHub" feature
- [ ] Clone repo into fragment state
- [ ] Load into file tree
- [ ] Support loading local folder via file picker

**Reference Files from Bolt.diy2**:
- `app/utils/import.ts` (if exists)

---

## Phase 4: Enhanced Prompts & UX (Week 4-5)

### 4.1 Advanced Prompt System
**Priority**: MEDIUM ⭐⭐⭐⭐
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Study Bolt's prompt structure
- [ ] Add system prompts for file operations
- [ ] Implement prompt caching (if provider supports)
- [ ] Add prompt enhancement option

**Reference Files from Bolt.diy2**:
- `app/lib/.server/llm/prompts.ts`

### 4.2 Project Download (ZIP)
**Priority**: MEDIUM ⭐⭐⭐
**Estimated Time**: 1-2 days

**Tasks**:
- [ ] Add "Download Project" button
- [ ] Use jszip to create archive
- [ ] Include all files from fragment
- [ ] Trigger browser download

**Dependencies to Add**:
```json
"jszip": "^3.10.1",
"file-saver": "^2.0.5"
```

### 4.3 Chat History Improvements
**Priority**: LOW ⭐⭐⭐
**Estimated Time**: 2 days

**Tasks**:
- [ ] Add IndexedDB persistence
- [ ] Save/load conversation history
- [ ] Add conversation list sidebar
- [ ] Support multiple concurrent projects

**Reference Files from Bolt.diy2**:
- `app/lib/persistence/db.ts`
- `app/lib/persistence/useChatHistory.ts`

---

## Phase 5: Code Editor Enhancements (Week 5-6)

### 5.1 Advanced CodeMirror Features
**Priority**: LOW ⭐⭐⭐
**Estimated Time**: 2-3 days

**Tasks**:
- [ ] Add autocomplete extension
- [ ] Add search/replace functionality
- [ ] Improve syntax highlighting with more languages
- [ ] Add code folding

**Dependencies to Add**:
```json
"@codemirror/autocomplete": "^6.18.3",
"@codemirror/search": "^6.5.8"
```

---

## Implementation Order (Recommended)

**Week 1**: 
1. File Tree Component (1.1)
2. Multi-File Editor (1.2)

**Week 2**:
3. File Actions (1.3)
4. Terminal Component Setup (2.1)

**Week 3**:
5. WebContainer Integration (2.2)
6. GitHub Publishing (3.1)

**Week 4**:
7. Project Download (4.2)
8. Advanced Prompts (4.1)

**Week 5-6**:
9. Project Import (3.2)
10. Chat History (4.3)
11. Editor Enhancements (5.1)

---

## Quick Start Commands

```bash
# Install new dependencies (run as needed per phase)
npm install react-resizable-panels @xterm/xterm @xterm/addon-fit @xterm/addon-web-links

# For WebContainer support
npm install @webcontainer/api

# For Git features
npm install isomorphic-git @octokit/rest

# For project download
npm install jszip file-saver @types/file-saver

# Start development
npm run dev
```

---

## Testing Checklist

After each phase:
- [ ] Test with existing E2B functionality (ensure no regression)
- [ ] Test new feature in isolation
- [ ] Test integration with existing features
- [ ] Update documentation
- [ ] Commit with clear messages

---

## Notes

- Keep E2B as default, add WebContainer as opt-in feature
- Maintain backward compatibility with existing templates
- Use feature flags for gradual rollout
- Test on Vercel deployment (not just local)
