# Project North Star — science-nova-lite

Purpose: a concise, always-current description of the overall goal and scope guiding all implementation phases.

Last updated: 2025-08-14

---

## Vision
Design a lesson-centric platform where educators create engaging, Vanta-powered, interactive lessons with AI assistance, and students experience polished, age-appropriate content. Authoring should feel like a lightweight design tool; delivery should be simple, fast, and reliable.

## Core outcomes (must-haves)
- Lessons, not topics: student-facing navigation and content are lesson-first.
- RBAC: STUDENT, TEACHER, ADMIN, DEVELOPER.
  - Teachers can author and manage their own lessons; Admin/Developer can manage all; Students can view published lessons only.
- Authoring (admin): Figma-like builder
  - Infinite canvas, snap-to-grid, drag/resize blocks.
  - Tools: TEXT, FLASHCARDS, QUIZ, CROSSWORD (incremental depth).
  - Scoped Vanta effect only behind the canvas.
  - Right panel for properties, actions (Save/Preview/Publish), and layers.
- AI helpers per tool
  - Quick generation of text, flashcards, crossword words (quiz next).
  - Sensible fallbacks when no model key is configured.
- Persistence (Option A)
  - `lessons` table with JSON layout, metadata, draft/published.
  - RLS policies enforcing role ownership and public access to published.
  - Republish-in-place semantics.
- Student renderer
  - `/lessons/[id]` consumes stored layout, applies selected Vanta effect.

## Non-goals (for later)
- Full collaborative editing and realtime cursors.
- Version history UI and rollbacks (may store metadata later).
- Complex tool editors (rich quiz designer, crossword grid builder) — planned next.
- Asset library and media uploads.

## Success criteria
- Teacher can create, save, publish, and re-open a lesson end-to-end.
- Student can open `/lessons/[id]` without auth and view published content.
- RLS blocks cross-tenant access; STUDENT cannot access drafts.
- AI helpers populate content quickly and safely (or degrade gracefully).

## Milestones (rolling)
- M1: Admin scaffolding + builder v1 (done).
- M2: Persistence + publish + student renderer (done).
- M3: Rich editors for FLASHCARDS/QUIZ/CROSSWORD (next).
- M4: Admin list polish, delete, pagination.

## Definitions
- Draft: editable by owner/privileged roles; not visible to students.
- Publish: set status to `published`; student route renders latest state.

## Update policy
- Keep this file synced with actual scope; when priorities change, update here first, then plan a new Phase in `IMPLEMENTATION_PHASES.md`.
