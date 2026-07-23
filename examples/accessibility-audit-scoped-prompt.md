# Example: a disciplined, scope-limited QA request

A real prompt used during development of this app. **Not verified verbatim** — I only have this reconstructed from a compressed conversation summary earlier in the session, which had already truncated parts of the original message with "...". The text below fills those gaps with a plausible reading rather than the real original wording, so treat it as reconstructed, not an exact quote. If you have the original text, paste it and I'll replace this.

## Prompt (reconstructed, not confirmed exact)

```
Do an accessibility audit on the app and fix the low-hanging fruit only — I don't want a full redesign, just the common, cheap-to-fix offenders. Aim for WCAG AA as the bar. Specifically check for: icon-only buttons, unlabeled inputs, color contrast, keyboard traps, missing focus indicators. Be disciplined about scope. Actually tab through at least two pages yourself and verify the fixes work, don't just make the changes and assume. When you're done, give me a list of exactly what was changed.
```

## Why this prompt works

- **Names the bar** ("WCAG AA"), not just a vague goal — gives a concrete stopping point instead of open-ended polish.
- **Enumerates the exact checks** up front (icon-only buttons, unlabeled inputs, contrast, keyboard traps, focus indicators) — narrows a huge surface area ("accessibility") to a fixed, auditable checklist.
- **Explicitly fences off scope creep** ("low-hanging fruit only," "not a full redesign") — the single most common failure mode for an audit request is it quietly becoming a redesign.
- **Demands real verification, not just a diff** — tabbing through actual pages catches things a code-only read misses (e.g. a focus outline that's present in CSS but overridden elsewhere).
- **Asks for an accounting at the end** — a plain list of what changed, so the scope-limiting instruction is checkable after the fact, not just stated up front.

This pairs naturally with the `qa-review` skill/`qa-reviewer` agent in this plugin for the code-reading half of an audit — but the tab-through-it-yourself verification step is something no code-only review can substitute for, and is worth keeping in any similar prompt.
