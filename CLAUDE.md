# glow

A UI component library for Svelte 5 (runes): components under `src/lib/`, and a
docs site under `src/routes/` that is also the place every component is
demonstrated. Published to npm as `glow`; the docs deploy as a static site.

```sh
bun run dev      # the docs site
bun run check    # svelte-check; ~125 pre-existing errors, don't add more
bun run build    # vite build (docs → build/) + svelte-package (library → dist/)
```

## Seeing it work

`tools/` drives the built docs site in Chrome, for assertions and for the
screenshots that go in a pull request. **Use it rather than reasoning about
whether a change renders** — much of this library is portals, stacking
contexts, WebGL and theme tokens, and it is easy to be confidently wrong about
all four from the outside.

```sh
node tools/scripts/shots.mjs --cards <component>   # → .shots/*.png
node tools/scripts/publish-shots.mjs               # → markdown for the PR body
node tools/scripts/layers.test.mjs                 # the portalled components
```

`--no-build` reuses the `build/` already there; without it you pay for a
`vite build` first. `tools/README.md` has the rest, including why motion is
frozen by default and where that stops working.

## Adding a component

Five places, in this order:

1. `src/lib/<kebab-name>/<PascalName>.svelte` — the component.
2. `src/lib/index.ts` — export it. Form controls also go in `forms.ts`, data
   display in `data-display.ts`, layout primitives in `layout.ts`.
3. `src/routes/components/<kebab-name>/+page.svelte` — the docs page. One
   `<Card title="…" id="…">` per example, plus `Usage` and `Props` cards, the
   way the neighbouring pages do it. The `id` is what names its screenshot.
4. `src/routes/components/+page.svelte` — the catalogue entry.
5. `src/routes/+layout.svelte` — the sidebar entry, in the matching group.

Theme with the `--glow-*` tokens (`src/lib/style/theme.scss`,
`global.scss`) — never a hardcoded colour, and check both themes. Reach for
`--glow-dur-*` and `--glow-ease-*` for motion rather than a bare duration or
cubic-bezier: those tokens are what `prefers-reduced-motion` collapses, so a
hardcoded one silently opts the component out of it.

## Commits

The release workflow reads the **commit body** for a `semver:` line and
publishes nothing without one:

```
feat: add Accordion

semver: minor
```

`minor` for a new component or prop, `patch` for a fix, `major` for a breaking
change.

CI runs `bun install` and `bun run build` on a pull request, and that is the
gate — `bun run check` is not wired into it and does not currently pass.

## House style

Comments explain *why*, and are worth writing where a reader would otherwise
wonder — especially where a workaround is load-bearing or a default was chosen
against the obvious one. No comment should restate the line under it. Match the
surrounding file: tabs, and the prop/`$props()` shape its neighbours use.
