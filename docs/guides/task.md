# Task Checklist: Phase 5 & 6 Execution

## Phase 5: The DropZone Architecture
- [x] Create `/web/components/DropZone.tsx` utilizing Framer Motion for Drag & Drop UI states.
- [x] Implement shimmering border / dynamic fluid effects upon `onDragEnter`.
- [x] Add loading/progress visualizer simulating state calculation upon drop.

## Phase 6: PQC Python Interop API
- [x] Create an API route handler (e.g., `/web/app/api/encrypt/route.ts`) bridging Next.js to the python layer.
- [x] Design the subprocess execution logic (or API fetch stub) targeting `zip-pqc` micromamba environment context.
- [x] Expose robust error boundaries for when Python dependencies or encryption layers fail via BMAD UI.

## Post-Phase Verification
- [x] Verify Drag & Drop state management handles bad file inputs safely.
- [x] Update `/docs/guides/FINAL_WALKTHROUGH.md` for Iteration 5 & 6.
