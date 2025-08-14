# Implementation Phases Tracker — science-nova-lite

Purpose: a living, single source of truth for phases delivered, files changed, and what remains. Keep this updated at the end of each phase. Always reference this doc when planning the next increment.

Conventions:
- Paths are relative to `science-nova-lite/` unless otherwise noted.
- Dates reflect when the phase was completed or last materially updated.
- Each phase lists: goal, key edits (files + intent), and validation notes.

Last updated: 2025-08-14

---

## Phase 1 — Fixed Navbar overlay and label rename (Global UX)
Goal: Ensure content doesn’t sit under the fixed navbar; rename Topics → Lessons in the nav.

Key edits:
- `components/layout/navbar.tsx`: Added dynamic spacer below fixed navbar (measure height via ref) to prevent overlay; relabeled the nav item from “Topics” to “Lessons”.

Validation:
- Pages start below the header with no overlap. Label displays “Lessons”.

---

## Phase 2 — RBAC scaffolding and Admin area
Goal: Introduce Teacher and Developer roles, and add an admin area gated by role.

Key edits:
- `contexts/auth-context.tsx`: Extended `Profile.role` union to include `TEACHER` and `DEVELOPER`.
- `components/layout/role-guard.tsx`: New component to guard content by allowed roles (TEACHER, ADMIN, DEVELOPER).
- `app/admin/page.tsx`: Admin landing (neutral background; no student navbar) — initial scaffold.

Validation:
- Admin routes inaccessible to STUDENT/unauthenticated; accessible to allowed roles.

---

## Phase 3 — Lesson Builder v1 (Canvas-first authoring)
Goal: Build a Figma-like lesson builder with infinite canvas, grid, palette, and inspector.

Key edits:
- `app/admin/lessons/builder/page.tsx`: 
  - Infinite central canvas with gridlines; drag/resize blocks for tools.
  - Left palette (TEXT, FLASHCARDS, QUIZ, CROSSWORD); right inspector (layers + properties).
  - Snap-to-grid (20px). Duplicate/Delete/Configure actions per block.
- `app/lessons/preview/page.tsx`: Student-side preview that reads from sessionStorage (prototype).

Validation:
- Blocks can be added, moved, resized; gridlines visible; properties editable (basic fields).

---

## Phase 4 — Scoped Vanta and canvas polish
Goal: Keep admin surfaces neutral; show Vanta only behind the editor canvas.

Key edits:
- `components/vanta-background.tsx`: Added `scoped` prop; z-index/pointer-events layering so effect appears only inside the canvas container.
- `app/admin/lessons/builder/page.tsx`: Wrapped the canvas with `<VantaBackground scoped>`; tuned gridline highlight during drag.

Validation:
- Admin pages are neutral; Vanta animates within the builder canvas only.

---

## Phase 5 — Vanta visibility fix
Goal: Ensure the Vanta effect is always visible behind the editing surface.

Key edits:
- `components/vanta-background.tsx`: Adjusted absolute layering and timing for effect initialization; added fallback gradients if scripts fail.
- `app/admin/lessons/builder/page.tsx`: Ensured container styles allow the effect to show through.

Validation:
- Canvas reliably shows the chosen Vanta effect.

---

## Phase 6 — Persistence (Option A) groundwork
Goal: Add server-side helpers and lessons API to support draft/publish workflows.

Key edits:
- `lib/server-supabase.ts`: Service client; auth header decoding; `getProfileRole` helper.
- `app/api/lessons/route.ts`: 
  - `GET`: list lessons with optional `status` filter; TEACHER restricted to own; later expanded to support `?id`.
  - `POST`: create/update lessons with `{ title, topic, grade_level, vanta_effect, layout_json, status }`; sets `owner_id` for new.

Validation:
- API returns expected data with role-aware filtering (initial iteration).

---

## Phase 7 — End-to-end authoring: Save, Publish, Admin list, Student rendering, AI helpers
Goal: Complete a minimal end-to-end workflow: save drafts to DB, publish, list lessons, render student view, and integrate AI helpers.

Key edits:
- Lessons API refinements
  - `app/api/lessons/route.ts`:
    - `GET`: now supports `?id=<uuid>` and enforces published-only for unauthenticated/STUDENT; TEACHER still restricted to own.
    - `POST`: safe defaults; teacher ownership checks for updates; numeric grade coercion.
  - `app/api/lessons/publish/route.ts`: New endpoint to set `status='published'`; TEACHER can only publish own; ADMIN/DEVELOPER can publish any.

- Builder wiring
  - `app/admin/lessons/builder/page.tsx`:
    - Save Draft calls `/api/lessons` with auth token; stores returned `lessonId`.
    - Publish first saves, then calls `/api/lessons/publish`.
    - Load-by-id (`?id=...`) fetches an existing lesson and populates meta + items.
    - Fixed grade select values to map correctly.
    - AI helper buttons in Properties:
      - TEXT: Generate paragraph.
      - FLASHCARDS: Suggest Q&A pair.
      - CROSSWORD: Suggest vocabulary words.

- Admin list
  - `app/admin/lessons/page.tsx`: Fetches drafts and published via `/api/lessons` with auth; provides Edit (draft) and Open (published) links.

- Student renderer
  - `app/lessons/[id]/page.tsx`: Server component that fetches a single lesson (published only for public) and renders with Vanta background; basic renderers for TEXT/FLASHCARDS.

- AI helper API
  - `app/api/ai-helper/route.ts`: When model key is present, returns structured JSON for FLASHCARDS and CROSSWORD; includes robust fallback parsing.

- Database schema & RLS
  - `../create-lessons-table.sql` (at repository root): Creates `public.lessons` table with Option A fields and RLS policies.
  - Policy fix: comparisons use `p.role::text in ('ADMIN','DEVELOPER')` to avoid enum literal errors (e.g., when `DEVELOPER` isn’t present in the enum).

Validation:
- Authenticated TEACHER/ADMIN/DEVELOPER can save and publish; unauthenticated/STUDENT can only access published lessons via `/lessons/[id]`.
- Builder AI buttons populate fields as expected (or gracefully do nothing if no key).

---

## Current status (2025-08-14)
- Authoring flow (draft → publish → student view) is functional.
- RBAC enforced both at API level and via RLS.
- Admin list provides quick access to drafts and published items.
- AI helpers integrated for TEXT/FLASHCARDS/CROSSWORD; QUIZ structured output and editor in place.
- Builder UX polish: z-order (layers) management, grid overlay toggle, and snap-to-grid toggle implemented.
- Student renderer now mirrors builder layout using absolute positioning (x/y/w/h) with sensible min-size clamps.

---

## Phase 8 — Admin list polish + search/pagination/delete; FLASHCARDS multi-card; student viewer update
Goal: Improve admin lesson management UX and enrich flashcards editing/rendering.

Key edits:
- Lessons API: `app/api/lessons/route.ts`
  - GET supports `search`, `limit`, `offset` for simple title/topic search and pagination.
  - DELETE added with role checks and teacher-ownership enforcement.
- Admin lessons list: `app/admin/lessons/page.tsx`
  - Search field, Prev/Next pagination, and Delete actions for both drafts/published.
- Builder flashcards editor: `app/admin/lessons/builder/page.tsx`
  - Multi-card support with add, delete, and reordering; AI can append suggested cards.
- Student renderer: `app/lessons/[id]/page.tsx`
  - Display multiple flashcards.

Validation:
- Search and pagination work with the new API; delete respects RBAC.
- Flashcards can manage multiple Q/A pairs and render on the student page.

---

## Phase 9 — QUIZ AI structured output, editor UI, and student interactive viewer
Goal: Enable authors to create MCQ/TF/FIB quizzes with AI assistance and provide an interactive student-side experience with per-question checking and scoring.

Key edits:
- `app/api/ai-helper/route.ts`: Added structured QUIZ output as `{ items: [...] }` with robust parsing and fallbacks.
- `app/admin/lessons/builder/page.tsx`: Introduced a minimal QUIZ editor (add/edit/reorder/delete MCQ/TF/FIB), AI Suggest to append items.
- `app/lessons/[id]/page.tsx`: Replaced placeholder with an interactive quiz viewer; passes a per-lesson/block storage key.
- `components/quiz-viewer.tsx`: New client component rendering MCQ/TF/FIB with local state, Check button, correctness highlighting, and scoring; persists responses in localStorage; adds Review all and Reset; includes Review mode with submit flow.

Validation:
- Builder can author quizzes and save/publish; student page renders quizzes with immediate feedback and a running score.
 - Responses persist per lesson/block across reloads; Review/Reset controls work.
 - Review mode hides feedback until submit; URL `?mode=review` initializes review mode.

## Next steps
- Builder UX polish (remaining):
  - Alignment guides and snapping during resize; multi-select and group move; simple undo/redo.
  - Zoom/scale control for large canvases; optional grid size selector (10/20/40px).
- Mobile responsiveness:
  - Responsive canvas viewport and safe block clamping on small screens; pinch-zoom support (optional).
- Crossword improvements:
  - Assisted auto-placement tooling and richer conflict UI.
- Data and workflow:
  - Autosave and versioning; draft history/restore.
- Quality gates:
  - Unit/integration tests for API and viewers; basic e2e for authoring and publish.
  - Accessibility pass (keyboard, ARIA, contrast) across builder and viewers.
- Performance and reliability:
  - Lazy-load heavy viewers; SSR boundaries; caching/fallbacks for Vanta.
- Security and validation:
  - Schema validation of API payloads; RLS rule tests; audit logging where applicable.

---

## Phase 10 — Crossword grid builder and student interactive solver
Goal: Provide authors with a practical crossword editor (grid size, word placement, and clues) and deliver an interactive student solver with checking and reveal options.

Key edits:
- `app/admin/lessons/builder/page.tsx`: Added crossword properties editor with rows/cols, add/reorder/delete words, coordinates (row/col), direction (across/down), answer and clue; AI: Suggest words.
- `components/crossword-viewer.tsx`: New client component rendering an interactive grid, cell selection, arrow-key navigation, Check all, Reveal word, Reset, and localStorage persistence per lesson/block.
- `app/lessons/[id]/page.tsx`: Renders CrosswordViewer for CROSSWORD blocks with storage key.
- `app/api/ai-helper/route.ts`: Existing crossword suggestion path used for word suggestions.

Validation:
- Author can define a grid and place words without runtime errors; words/clues serialize and persist via lesson save.
- Student can type answers, check all, reveal the selected word, and resume progress after reload.

---

## Phase 11 — Builder UX polish (Layers/z-order, grid and snap toggles)
Goal: Improve authoring ergonomics with layer control and canvas toggles.

Key edits:
- `app/admin/lessons/builder/page.tsx`:
  - Added optional `z` to `PlacedTool`; render items sorted by `z` and apply `zIndex`.
  - Layers panel shows z and includes Up/Down and Front/Back controls via `onReorder`.
  - Selecting a block brings it to front by bumping z.
  - Added toolbar toggles: Grid overlay and Snap-to-grid; `Draggable` respects `snap`.

Validation:
- Blocks reorder visually as expected; grid/snap toggles work while dragging.

---

## Phase 12 — Student renderer layout parity and clamps
Goal: Align published lessons rendering with builder positions and improve robustness.

Key edits:
- `app/lessons/[id]/page.tsx`:
  - Absolute-positioned canvas honoring `x/y/w/h`; computed min canvas height.
  - Clamped min width/height and ensured overflow scrolling inside blocks.

Validation:
- Published lessons mirror builder layout; content no longer clips and remains scrollable within blocks.

## Updating this document
- At the end of each meaningful increment, add a new Phase section summarizing:
  - Goal, the files changed (and why), and validation.
- Update the “Current status” and, if needed, “Next steps”.
- Keep this as the entry point for planning subsequent work.
