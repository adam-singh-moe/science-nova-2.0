# Science Nova 2.0 – AI Development Handoff

_Last updated: 2025-09-09_

This document is a concise yet exhaustive handoff for a new AI development agent to continue the Admin Content Platform work exactly where it left off. It captures architecture, implemented features, conventions, and the prioritized next steps.

---
## 1. Project Purpose
A Next.js + Supabase powered educational platform with an Admin "Content Hub" for managing two learning content categories:
- **Discovery**: Short factual/informational snippets (FACT / INFO)
- **Arcade**: Interactive learning objects (QUIZ, FLASHCARDS, GAME, expandable to more)

The admin interface supports content creation, AI-assisted generation, editing, publishing workflow, bulk actions, and (in progress) rich per-item editing.

---
## 2. Tech Stack
- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind (implied by classes) – client components in `app/`.
- **Backend**: Next.js API routes under `app/api/...` hitting Supabase Postgres via server-side environment.
- **Database**: Supabase Postgres with RLS (role logic assumed); tables include `topic_content_entries`, `content_engagement_events`, `ai_generation_usage` plus topic & user tables (pre-existing).
- **Validation**: Zod schemas (in `lib/schemas/content.ts`).
- **Auth**: Supabase session context via `useAuth()` and `RoleGuard` restricting admin pages to `TEACHER | ADMIN | DEVELOPER`.

---
## 3. Core Data Model
### 3.1 Table: `topic_content_entries`
Represents all admin-managed content items (both Discovery & Arcade) with subtype specialization.

Likely columns (inferred from code & migrations narrative):
- `id` (uuid, pk)
- `topic_id` (fk -> topics)
- `category` ENUM or text: `DISCOVERY` | `ARCADE`
- `subtype` (e.g., FACT, INFO, QUIZ, FLASHCARDS, GAME)
- `title` (nullable)
- `status` (`draft` | `published`)
- `payload` (JSONB) – structure varies by subtype
- `deleted_at` (timestamp null = active; soft delete mechanism)
- `created_at`, `updated_at`
- Generated / derived columns (e.g., preview text) for Discovery list views

### 3.2 Table: `content_engagement_events`
Tracks user interactions (view/play/etc.) – currently foundational, not actively used in UI yet.

### 3.3 Table: `ai_generation_usage`
Stores AI generation events for rate limiting (probably per user & day). Endpoints increment and check counts.

### 3.4 Views (Admin Optimized)
- `admin_discovery_facts` – flattened listing for Discovery category including topic title, grade, preview snippet, deleted_at.
- `admin_arcade_entries` – analogous listing for Arcade types.

### 3.5 Soft Delete Strategy
Items are never hard-deleted immediately. `DELETE` sets `deleted_at`. Undo within ~8s via toast clears `deleted_at`. (Full restore view not yet implemented.)

---
## 4. API Endpoints (Implemented)
### Listing
- `GET /api/admin/discovery`
  - Query params: `status` (`all|draft|published`), `grade`, `topic_id`, `subtype`, `search`, `limit`, `offset`, `sort` (created_at|title|status), `direction` (asc|desc)
  - Returns: `{ items: [...], total, limit, offset }`
  - Backed by view `admin_discovery_facts` with COUNT(*) for pagination.

- `GET /api/admin/arcade`
  - Same pattern & params as discovery (subtype includes QUIZ, FLASHCARDS, GAME).

### Single Item
- `GET /api/admin/content/:id` – Returns `{ item }` including `payload` for editor.
- `PATCH /api/admin/content/:id` – Partial updates; only changed fields sent. Supports updating `title`, `status`, `payload`, `deleted_at` (for restore), etc.
- `DELETE /api/admin/content/:id` – Soft delete (sets `deleted_at`).

### Creation
- `POST /api/admin/discovery` – Creates a draft Discovery entry (payload fields: `text`, optional `source` in payload; title optional).
- `POST /api/admin/content` – Generic create for Arcade builders (expects full payload + subtype/category).

### AI Generation
- `POST /api/admin/generate-discovery` – Body: `{ topic_id, count, style? }`
- `POST /api/admin/generate-arcade` – Body: `{ topic_id, generate: ['FLASHCARDS', ...] }`
  - Both enforce rate limits via `ai_generation_usage`.

(Exact internal rate-limiting logic is in other files not shown here; assumed working.)

---
## 5. Frontend Admin UI (Current State)
File: `app/admin/content/page.tsx`

### Implemented Features
- Discovery creation form (topic select + subtype FACT/INFO, text, optional title/source, AI generation buttons)
- Discovery listing with:
  - Search / filters / subtype / status / sort + direction
  - Pagination (limit 30, controlled via `pageDisc`, `pageSize` constant)
  - Bulk publish & bulk delete
  - Inline title editing (`EditableTitle` component)
  - Soft delete with undo toast
  - Click-to-open dual-pane editor (new)
  - Keyboard friendly (checkbox selection; editorial enhancements in progress)
- Arcade section with:
  - Search / filters / subtype / status / grade / sort + direction
  - Pagination / bulk publish / bulk delete
  - Builders (QUIZ, FLASHCARDS, GAME) – initial creation logic using `POST /api/admin/content`
  - AI generation quick action for FLASHCARDS placeholder
- Shared skeleton loaders & pagination component
- Dual-pane layout: When a Discovery item is active, list shrinks to 7/12 width; editor sits in sticky 5/12 pane.

### Recent Enhancements (Just Completed)
- Click card or Edit button to set `activeDiscoveryId`
- Active card highlighting and subtle hover affordance
- DiscoveryEditor integrated side-by-side

---
## 6. Discovery Editor Component
File: `components/admin/DiscoveryEditor.tsx`

Features:
- Loads full item via single GET endpoint
- Dirty detection (title/text/source/status vs original)
- Minimal PATCH delta (only changed fields sent)
- Publish button (status -> published)
- Revert to original
- Preview pane for text & source link
- Keyboard shortcuts:
  - Ctrl/Cmd+S → Save if dirty
  - Esc → Close (with confirm if dirty)
- Saved indicator (transient)

Not Yet Implemented:
- Toast notifications (success/error) – currently inline error display
- Field-level validation feedback
- Rich formatting / markdown support

---
## 7. Builders (Arcade)
Components: `QuizBuilder`, `FlashcardsBuilder`, `GameBuilder` (in `components/admin/builders/`)

Current Behavior:
- Accept `onCreate(payload, meta)` callback
- Parent wraps with POST to `/api/admin/content` using:
  - `category: 'ARCADE'`
  - Provided `subtype`
  - `title`, `payload`, `status: 'draft'`

Payload Schemas (implied; verify in `lib/schemas/content.ts`):
- QUIZ: likely question set with options & answer indices
- FLASHCARDS: array of `{ front, back }`
- GAME: placeholder structure (details pending expansion)

### Future Improvements
- Reordering + drag & drop
- Live preview/test harness inside builder
- Validation surfaced before POST
- Editing existing Arcade entries (parallel to DiscoveryEditor) – currently missing

---
## 8. Validation Layer
Zod schemas unify validation. `validatePayload` (referenced in PATCH route) decides shape by subtype. Ensure new subtypes update this schema + UI.

When adding a new subtype:
1. Extend allowed subtype union.
2. Add Zod schema for payload.
3. Update switch in `validatePayload` & creation endpoints.
4. Update builder & list filter dropdowns.

---
## 9. Soft Delete & Undo Flow
1. User clicks Delete → `DELETE /api/admin/content/:id` sets `deleted_at`.
2. UI shows Undo toast for ~8s with a timer.
3. Undo triggers `PATCH` with `{ deleted_at: null }`.
4. No permanent purge mechanism yet (future: cron or admin purge view).

Edge Case: If user deletes an active editor item, editor is closed (already handled in card delete logic modification).

---
## 10. Pagination & Sorting Contract
Query params consumed by listing endpoints:
- `limit` (int) – UI uses 30.
- `offset` (int) – (page - 1) * limit.
- `sort` – whitelist enforced server-side (avoid SQL injection).
- `direction` – `asc` | `desc`.
- Response includes `total` enabling page count computation client-side.

Ensure any new listing (e.g., Deleted Items view) follows same shape for UI reuse.

---
## 11. Roles & Access
- `RoleGuard` wraps admin page; allowed: `TEACHER`, `ADMIN`, `DEVELOPER`.
- Backend endpoints likely also verify (check source files before altering security posture).
- When adding new endpoints, replicate role assertion pattern.

---
## 12. AI Generation
- Discovery AI: bulk insert of facts (count 3 or 6; style optional)
- Arcade AI: currently only FLASHCARDS generation stub
- Rate limiting: table `ai_generation_usage` tracks usage; logic prevents overuse (details in earlier code – confirm before modifying). Any new AI route must increment usage atomically.

Future: Add per-topic & per-role caps, expose remaining quota in UI.

---
## 13. Code Conventions & Patterns
- Prefer minimal PATCH bodies (diff-based updates) for efficiency & audit clarity.
- Soft delete instead of hard delete; provide immediate undo affordance.
- Keep list endpoints pure (no side effects).
- UI: Tailwind utility styling; responsive grid collapses into dual-pane only when editing.
- Components remain lean; heavy logic in API route queries.
- Error handling: Currently minimal; toasts planned for improved UX.

---
## 14. Known Gaps / TODO Backlog (Prioritized)
| Priority | Task | Description | Acceptance Criteria |
|----------|------|-------------|---------------------|
| P1 | Arcade Item Editor | Implement dual-pane editor for Arcade entries parallel to DiscoveryEditor | Click Arcade card opens editor; supports title, payload editing, status change, save/publish, keyboard shortcuts |
| P1 | Toast System | Central success/error notifications (save, publish, delete, undo) | Reusable hook/component; no blocking modals for normal flows |
| P1 | Unsaved Guard Nav | Block page unload/route change if editor dirty | Browser beforeunload + internal route intercept |
| P2 | Deleted Items View | Filter to show soft-deleted entries + restore bulk | New filter toggle + restore action |
| P2 | AI Usage Indicator | Show remaining AI generation quota per user | Badge near AI buttons; fetched from new endpoint |
| P2 | Arcade Payload Validation UI | Form-level feedback before POST | Red outlines + inline messages from Zod errors |
| P3 | Sorting Persistence | Persist last sort/filter in localStorage | Restored on mount |
| P3 | Keyboard Navigation | Arrow key selection & Enter to open editor | Works in Discovery & Arcade lists |
| P3 | Bulk Restore | For deleted items | Multi-select restore button |
| P4 | Audit Log | Track PATCH deltas in a log table | New table + endpoint + optional UI |
| P4 | Versioning | Keep historical payload versions | Append-only versions table with revert |

---
## 15. Immediate Next Steps (Start Here)
1. **Add ArcadeEditor** (mirror DiscoveryEditor) – location: `components/admin/ArcadeEditor.tsx`.
   - GET existing payload via single-item endpoint (already returns payload for any subtype).
   - Conditional render triggered by clicking an Arcade card (similar pattern added to Discovery cards; replicate).
   - Support QUIZ, FLASHCARDS, GAME editing (scaffold switch on subtype with specialized child components or JSON editor fallback initially).
2. **Introduce Toast Hook** (`useToast`) + `<Toaster />` root mount.
   - Replace inline error div & saved indicator with ephemeral toasts.
   - Provide variants: success, error, info, warning, undo (action).
3. **Add beforeunload Guard** for dirty editor states.

Deliver these in small, verifiable commits.

---
## 16. Pitfalls & Edge Cases
- Pagination + active editor: Reloading list after save may remove current page item if filters change; preserve `activeDiscoveryId` if still present.
- Soft delete while editing: Ensure editor closes gracefully (Discovery path already handles; replicate for Arcade).
- Race conditions: Concurrent PATCH & DELETE – server should reject operations on deleted items (verify / enforce if absent).
- Payload schema drift: When adjusting Zod schema, update both creation (POST) & editing (PATCH) flows or items may become unsaveable.
- Large AI batches: Ensure rate limit increments atomically to prevent overshoot under concurrency.

---
## 17. Testing Recommendations (Not Yet Added)
Add lightweight tests (if test framework present or introduce one):
- Endpoint pagination returns stable total with different offsets.
- PATCH diff excludes unchanged fields (spy on query or log output).
- Soft delete then undo returns item in list again.
- AI generation respects daily quota (mock counter).

If no harness exists, start with a simple script under `scripts/tests/` calling fetch against local dev server.

---
## 18. Extension Patterns for New Subtypes
1. Define UI builder/editor.
2. Extend `subtype` filter dropdowns.
3. Add validation schema.
4. Ensure list view preview (maybe add a `preview_text` generator if needed).

---
## 19. Suggested File to Create Next
`components/admin/ArcadeEditor.tsx` with structure:
- Props: `{ id, sessionToken, onClose, onSaved }`
- Load item (same endpoint)
- Dynamic render by subtype (e.g., Flashcards form editing array; Quiz question editor; Game placeholder)
- Reuse keyboard shortcuts & diff-based save logic from `DiscoveryEditor.tsx`.

---
## 20. Glossary
- **Discovery Entry**: Simple factual text snippet with optional source & title.
- **Arcade Entry**: Interactive structured learning object.
- **Subtype**: Defines payload shape & UI handling logic.
- **Soft Delete**: Non-destructive removal using `deleted_at`.
- **Dual-Pane**: Layout pattern where list & editor coexist horizontally.

---
## 21. Quick Reference: Current Component Interactions
```
AdminContentPage
 ├─ Discovery creation form
 ├─ Discovery cards (inline EditableTitle, selection, open editor)
 │   └─ DiscoveryEditor (loads full payload, diffs + PATCH)
 ├─ Arcade builders (select + create)
 ├─ Arcade cards (no editor yet)
 └─ UndoToast stack (soft delete undo)
```

---
## 22. Acceptance Criteria for ArcadeEditor (P1)
- Clicking an Arcade card highlights it & opens editor pane (mirrors Discovery flow).
- Editor shows subtype-specific editable fields.
- Save only sends changed fields.
- Publish button transitions status to published & refreshes list.
- Keyboard shortcuts (Ctrl+S, Esc) functional.
- Soft deleted active card closes editor.

---
## 23. Deployment / Environment Notes (Assumptions)
- Environment variables for Supabase configured (not shown here).
- Migrations numbered sequentially (latest included soft delete + view updates).
- Run order: apply SQL scripts under `science-nova-lite/scripts/` by ascending number.

If introducing new migrations: name `NN-description.sql` aligning with existing convention.

---
## 24. What NOT to Change Without Review
- Existing column names in `topic_content_entries` (UI & API rely on them).
- View column aliases (`topic_title`, `preview_text`) – used directly in list rendering.
- Status values (`draft`, `published`).
- Subtype strings already in production content.

---
## 25. Final Snapshot
State of work just completed: Dual-pane Discovery editor with click-to-edit & keyboard shortcuts; Arcade editor not yet started; toast & deleted items view pending.

Proceed with P1 tasks starting at Section 15.

---
## 26. Contact / Meta
Original development context captured from prior engineering assistant. This document is the authoritative handoff—treat unspecified behavior as open for pragmatic improvement while preserving existing APIs.

---
_End of handoff._
