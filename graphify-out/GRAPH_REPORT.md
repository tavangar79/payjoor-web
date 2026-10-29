# Graph Report - web  (2026-10-29)

## Corpus Check
- 28 files · ~12,642 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 156 nodes · 291 edges · 11 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0141ae77`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_web|web/]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_Home.tsx|Home.tsx]]
- [[_COMMUNITY_Design System Pagesanj (پیج‌سنج)|Design System: Pagesanj (پیج‌سنج)]]
- [[_COMMUNITY_server.js|server.js]]
- [[_COMMUNITY_devDependencies|devDependencies]]

## God Nodes (most connected - your core abstractions)
1. `Strings` - 14 edges
2. `useSite()` - 13 edges
3. `compilerOptions` - 11 edges
4. `Design System: Pagesanj (پیج‌سنج)` - 10 edges
5. `LegalPage()` - 8 edges
6. `formatNumber()` - 8 edges
7. `scripts` - 7 edges
8. `Locale` - 7 edges
9. `Rich()` - 6 edges
10. `fillTemplate()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Phone()` --calls--> `useSite()`  [EXTRACTED]
  web/src/pages/Home.tsx → web/src/site.tsx
- `ShareSheet()` --calls--> `useSite()`  [EXTRACTED]
  web/src/pages/Home.tsx → web/src/site.tsx
- `DeletionStatus()` --indirect_call--> `CheckCircle()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx
- `DeletionStatus()` --indirect_call--> `Clock()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx
- `DeletionStatus()` --indirect_call--> `SearchX()`  [INFERRED]
  web/src/pages/DeletionStatus.tsx → web/src/components/Icons.tsx

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.18
Nodes (13): App(), PageData, dataEl, render(), startMotion(), DataDeletion(), Home(), Privacy() (+5 more)

### Community 1 - "devDependencies"
Cohesion: 0.10
Nodes (20): dependencies, express, @fontsource-variable/geist, @fontsource-variable/geist-mono, @fontsource-variable/vazirmatn, react, react-dom, engines (+12 more)

### Community 2 - "index.ts"
Cohesion: 0.21
Nodes (14): BlockView(), LegalPage(), StatusForm(), en, fa, Block, LegalDoc, Section (+6 more)

### Community 3 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+4 more)

### Community 4 - "web/"
Cohesion: 0.33
Nodes (5): Commands, graphify, How it renders, Rules (Meta App Review depends on these), web/

### Community 5 - "scripts"
Cohesion: 0.33
Nodes (8): Layout(), SUBPATHS, Rich(), CtaButton(), Route, directUrl(), instagramUrl(), useSite()

### Community 6 - "Home.tsx"
Cohesion: 0.10
Nodes (17): ArrowEnd(), Check(), CheckCircle(), ChevronBack(), Clock(), Globe(), Info(), SearchX() (+9 more)

### Community 8 - "Design System: Pagesanj (پیج‌سنج)"
Cohesion: 0.18
Nodes (10): 1. Visual Theme & Atmosphere, 2. Color Palette & Roles, 3. Typography Rules, 4. Hero Section, 5. Component Stylings, 6. Layout Principles, 7. Responsive Rules, 8. Motion & Interaction (+2 more)

### Community 9 - "server.js"
Cohesion: 0.26
Nodes (8): createSite(), CSP, DEFAULT_DIST, escapeHtml(), fillTemplate(), scriptJson(), servers, site()

### Community 10 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react

## Knowledge Gaps
- **55 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `devDependencies`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Strings` connect `index.ts` to `App.tsx`, `scripts`, `Home.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1010752688172043 - nodes in this community are weakly interconnected._