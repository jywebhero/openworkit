# switch

2026-10-28 · transformation engine (legacy `new-york` style has no `base-*` counterpart), classes kept verbatim. Verdict: migrated; the only judgement call was `disabled:*` → `data-disabled:*`.

## Changed

- [src/renderer/src/components/ui/switch.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L1) — `@radix-ui/react-switch` → `@base-ui/react/switch`; `import * as React` dropped.
- [switch.tsx:4](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L4) — props `React.ComponentProps<typeof SwitchPrimitive.Root>` → `SwitchPrimitive.Root.Props`; `data-slot="switch"` kept.
- [switch.tsx:11](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L11) — the radix-only `data-[state=…]` variants renamed to `data-checked:` / `data-unchecked:` on both Root ([switch.tsx:11-12](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L11)) and Thumb ([switch.tsx:19](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L19)). Tailwind 4.3.3 compiles the bare `data-open:`-style shorthand, which is what the Base UI `data-*` attributes need.
- [switch.tsx:10](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/switch.tsx#L10) — `disabled:cursor-not-allowed disabled:opacity-50` became `data-disabled:cursor-not-allowed data-disabled:opacity-50`. Reason: Base UI's Switch Root is a `role="switch"` widget whose DOM element does not carry the HTML `disabled` attribute in the same way radix's `<button>` did, so `:disabled` styling is unreliable while `data-disabled` is guaranteed by the primitive.
- Everything else — `h-5 w-9`, `bg-input`, `peer`, `focus-visible:ring-2 focus-visible:ring-ring/30`, the thumb's `size-4 … transition-transform` and the `translate-x-[18px]` / `translate-x-0.5` travel, `dark:bg-card` — is byte-identical to the pre-migration file.
- Consumers unchanged: [pages/settings/dirs.tsx:112](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/dirs.tsx#L112), [pages/settings/appearance.tsx:92](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/appearance.tsx#L92), [pages/settings/preferences.tsx:50](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/preferences.tsx#L50) and :60, [pages/installed-page.tsx:388](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L388) all keep `checked` / `onCheckedChange`, which Base UI names identically.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state" src/renderer/src/components/ui/switch.tsx` → no matches.

## Left alone

- `components/ui/sonner.tsx`, `badge.tsx`, `input.tsx` — not radix.
- The `peer` class on Root — kept even though no sibling consumes `peer-checked:` today, because removing it would be an unrelated cleanup.

## Behavior changes

- Keyboard semantics move from a native `<button role="switch">` (radix) to Base UI's own focusable widget node; Space still toggles and `aria-checked` is still emitted. Flagged rather than verified exhaustively.
- `onCheckedChange` receives `checked, event` in both libraries, so no call-site coercion was needed.
- The switch no longer inherits native `:disabled` pointer-block styling from the `disabled:` utilities; `data-disabled:` reproduces it, but a *caller* that relied on `disabled:` classes via `className` override would now need `data-disabled:` too.

## Verify by hand

Twenty seconds: 设置 → 外观 → toggle 紧凑模式 (the page's only switch, [appearance.tsx:92](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/appearance.tsx#L92)) and confirm the whole UI tightens; 设置 → 目录 → toggle a directory off and on; 已安装 → toggle a skill and confirm the row dims and the toast fires. Then Tab to any switch and press Space — it must toggle without scrolling the page.
