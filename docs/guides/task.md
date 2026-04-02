# Task Checklist: Phase 5 & 6 Execution

## Phase 5: The DropZone Architecture
- [ ] Create `/web/components/DropZone.tsx` utilizing Framer Motion for Drag & Drop UI states.
- [ ] Implement shimmering border / dynamic fluid effects upon `onDragEnter`.
- [ ] Add loading/progress visualizer simulating state calculation upon drop.

## Phase 6: PQC Python Interop API
- [ ] Create an API route handler (e.g., `/web/app/api/encrypt/route.ts`) bridging Next.js to the python layer.
- [ ] Design the subprocess execution logic (or API fetch stub) targeting `zip-pqc` micromamba environment context.
- [ ] Expose robust error boundaries for when Python dependencies or encryption layers fail via BMAD UI.

## Post-Phase Verification
- [ ] Verify Drag & Drop state management handles bad file inputs safely.
- [ ] Update `/docs/guides/FINAL_WALKTHROUGH.md` for Iteration 5 & 6.
