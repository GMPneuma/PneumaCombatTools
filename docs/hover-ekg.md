# Hover EKG

Current implementation: Combat Tools 0.8.1; source-reviewed 2026-09-23.

A visible hovered token can display an EKG beneath its nameplate. No numeric HP is exposed. Eligibility is **any one** of: viewer is a selected owned Medtech (or assigned Medtech with no selection); target has an installed Biomonitor; GM Always show EKG world option is on. GMs follow the same rule.

Medtech recognition uses a native role item with positive rank. Selecting a non-Medtech does not borrow the assigned character's role. This hover eligibility is separate from the main Biomonitor's default-focus resolver.

The trace reuses normal/wounded/serious/critical/flatline states; unavailable HP gives a static line. Visibility, hover exit, blur, deletion and scene teardown remove the panel. Relevant HP/role/implant changes refresh it; pan/zoom repositions it without restarting an unchanged waveform.

Styling root: `.pneuma-hover-ekg`; shared children `.pneuma-eye-vitals[data-state]` and `.pneuma-eye-ekg`. The overlay is noninteractive and independent of ranged-DV hover.

Implementation: [ekg-hover.ts](../src/scripts/ekg-hover.ts), [biomonitor.ts](../src/scripts/biomonitor.ts).
