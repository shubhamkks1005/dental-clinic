# Go / No-go criteria (10.1.1)

Decision: when is it safe to cut over from paper to the software?

**Decision makers:** Doctor (sister) + Developer (owner). Both must agree "Go." Either can say "No-go" — which means the cutover date moves, not that anything is cut.

---

## Go criteria — all must be Yes

| # | Criterion | Status | Confirmed by |
|---|-----------|--------|-------------|
| G1 | Phase 1–9 CI gates passed (see STATE.md gate tables) | Waiting | Developer |
| G2 | Restore drill completed — B2 restore timed and recorded (9.1.7) | Waiting | Developer |
| G3 | No open P0 or P1 bugs | Waiting | Developer |
| G4 | Pre-load sample check passed (10.1.9) — 50 random rows match paper | Waiting | Developer |
| G5 | Dress rehearsal passed (10.1.11) — 28/30 mock scenarios without help | Waiting | Doctor + Receptionist |
| G6 | Privacy notice version fixed and printed (10.1.14) | Waiting | Doctor + Developer |
| G7 | Paper kit complete — day list, blank forms, receipt book on desk | Waiting | Receptionist |
| G8 | Hardware ready — PC, printer, UPS, backup internet tested (10.1.5) | Waiting | Developer + Receptionist |
| G9 | Staff trained — training sessions done, cheat sheet on desk (9.5.3) | Waiting | Doctor + Receptionist |
| G10 | Cutover date is not on a holiday, festival, or busy week | Waiting | Doctor |
| G11 | Developer available full first week | Waiting | Developer |

---

## No-go criteria — any one means wait

| # | Criterion | Action |
|---|-----------|--------|
| N1 | Any P0 or P1 bug open | Fix first; reschedule |
| N2 | Restore drill not done | Do the drill; reschedule |
| N3 | Dress rehearsal has fewer than 28/30 passed | Fix the gaps; redo rehearsal |
| N4 | Privacy notice not finalised | Finish the notice; reschedule |
| N5 | Hardware not tested (UPS, backup internet) | Complete testing; reschedule |
| N6 | Doctor or receptionist not available for the first week | Pick a different week |
| N7 | Pre-load data has errors (mobiles, duplicates) | Fix data; redo dry-run; reschedule |

---

## Decision record

| Date | Decision | Decided by | Notes |
|------|---------|-----------|-------|
| (pending) | | Doctor + Developer | Sign here when Go |

---

## Notes

- "No-go" is not a failure — it means the cutover date moves. Cutting with open risks is riskier than waiting.
- The doctor's clinical judgement overrides everything — if she is not comfortable, it is No-go.
- Once "Go" is confirmed, write the cutover date in `docs/PILOT_PREP.md` and proceed with Stage 0 (10.1.x).
