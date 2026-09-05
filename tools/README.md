# tools

Driving the built docs site in a real browser: to assert that something works,
and to take the picture that shows it working.

```sh
node tools/scripts/shots.mjs --cards accordion   # shots of one component
node tools/scripts/shots.mjs                     # every route, both themes
node tools/scripts/demo.mjs <component>          # → .shots/*.gif (needs ffmpeg)
node tools/scripts/publish-shots.mjs             # upload them, print markdown
node tools/scripts/layers.test.mjs               # the portalled components
node tools/scripts/motion-js.test.mjs            # the JS-driven motion
```

Add `--no-build` to any of them to use the `build/` already there. Everything
else takes about a minute of `vite build` first.

Chrome comes from the machine, not from a download: the dependency is
`playwright-core`, whose install is a few hundred kilobytes, rather than
`playwright`, whose postinstall pulls a few hundred megabytes of browser
binaries that CI would then pay for on every run. `ffmpeg` is needed only to
assemble a GIF.

## harness/ — not specific to glow

Shared with [`paper`](https://github.com/Somfic/paper/pull/11), which is where
it started. Two copies and no coupling; if it earns a third it should become
its own repo.

| | |
|---|---|
| `launch()` | build → serve → open Chrome, and one `close()` that undoes all of it |
| `checks()` | one-line assertions, console-error capture, exit code |
| `recorder()` | a drawn pointer, captions, and frame-by-frame recording |
| `serve()` | the built site, served the way the deployed one is |
| `devServer()` | a `bun run dev` (or any) server, waited for by its printed URL |

```js
const app = await launch({ build: true });          // vite build, then serve it
const app = await launch({ dev: true });            // a dev server instead
const app = await launch({ url: "http://…:5173" }); // something already up

try { /* app.page is a playwright Page */ } finally { await app.close(); }
```

Decisions worth keeping:

**A 200, not a 404.** glow builds with `adapter-static` and
`fallback: '200.html'`, so an unknown path on the deployed site is the SPA shell
with a 200, not an error. `serve()` does the same — and also tries `<path>.html`,
because the adapter prerenders `/components` to `build/components.html` rather
than `build/components/index.html`. This is the one file that differs from
`paper`'s copy, where Pages' 404 behaviour is the thing being reproduced.

**Motion off by default.** `launch()` sets Playwright's `reducedMotion: "reduce"`,
and `global.scss` collapses every `--glow-dur-*` to 1ms under that media query
while `Glow.svelte` parks its shader loop. One flag holds most of the library
still, which is what makes two runs of `shots.mjs` comparable. Pass
`reducedMotion: "no-preference"` (or `shots.mjs --motion`) when the motion *is*
the subject.

Note where the flag stops on its own: a Svelte `transition:` whose duration is
a number in the component is not a token and does not collapse. Those ask the
query themselves, via `src/lib/util/reducedMotion.svelte.ts` — anything new that
animates from JS has to do the same, and `motion-js.test.mjs` is what checks it.
An overlay can still be on screen for a few frames after the keypress that
dismissed it, so wait for the element, don't poll it once. `layers.test.mjs` has
the worked example.

**Screenshots, not video.** Playwright records video, and its timing is not
linear — the same script trimmed to "the last four seconds" caught a different
moment every run. `recorder()` takes frames at the moment the script says so and
hands them to ffmpeg; a held beat is the same frame written N times.

**A drawn pointer.** A real cursor is not in a screenshot, so a demo without one
is a series of things happening for no visible reason.

## glow/docs.mjs — specific to this repo

`routes()`, `open()`, `setTheme()`, `settle()`, `cards()`, `shootCard()`.

`routes()` reads the route list off the filesystem instead of holding a
catalogue. That is deliberate and load-bearing: a hardcoded list would have to
be edited by every branch that adds a component, so parallel worktrees would all
conflict on this one file and on nothing else. A new
`src/routes/components/<name>/+page.svelte` is shot the moment it exists.

`setTheme()` writes `localStorage['glow-theme']` and reloads, rather than
stamping `data-theme` on `<html>` directly. The attribute alone looks right but
leaves the store disagreeing, and the parts that read the theme in JS — the
sidebar, the shader's palette — keep rendering for the old one.

`settle()` hides the custom cursor. It is drawn into the page and sits wherever
the mouse was left, so without this it lands in a screenshot at a random offset.

`cards()` finds `.card[id]`. Docs pages are written as one
`<Card title="…" id="…">` per example, so an id-bearing card is exactly one
thing worth showing on its own, and `--cards` names each PNG after it.

## Screenshots in a pull request

```sh
node tools/scripts/shots.mjs --cards accordion   # → .shots/*.png
node tools/scripts/publish-shots.mjs             # → markdown to paste
```

A PR body cannot reference a file on your branch and render it as an image, and
committing PNGs puts binaries in the history of every branch that takes one. So
they go to assets on one long-lived, non-code release, `media-assets`, prefixed
with the branch name so two branches shooting the same component don't
overwrite each other. `.shots/` is gitignored.

## GIFs in a pull request

A still cannot show an interaction. Anything whose point is what happens when
you click, hover, drag or wait wants a GIF next to its screenshots.

```sh
node tools/scripts/demo.mjs modal        # → .shots/modal-dark.gif
node tools/scripts/publish-shots.mjs     # uploads .gif as well as .png
```

The demo lives in `tools/demos/<name>.mjs` — one file per component, so
parallel branches each add a file instead of all editing one. It exports the
`route` it drives and a default function:

```js
export const route = "/components/modal";

export default async function demo({ r, at, page }) {
	await r.say("A modal, opened from a button");
	await r.shot(6);                       // hold: the same frame, six times
	await r.click(...(await at(".card[id] button")));
	await r.shot(10);                      // shoot *through* the transition
	await page.keyboard.press("Escape");
	await r.shot(10);
}
```

`r` is `recorder()` from the harness — `say`, `point`, `click`, `shot`, and the
drawn pointer, because a real cursor doesn't appear in a screenshot and a demo
without one is a series of things happening for no visible reason. `at(sel)`
gives the centre of a match as `[x, y]`, which is what `point`/`click` want.

Two differences from `shots.mjs`, both deliberate: this runs with **motion on**
(`reducedMotion: "no-preference"`), since the animation is usually the subject;
and at `deviceScaleFactor: 1`, because a retina GIF is four times the bytes of a
format that is already the wrong tool for fine detail.

Frames are taken one at a time rather than by Playwright's video recorder,
whose timing is not linear — see the note at the top of `harness/record.mjs`.
That is why holding a beat means shooting the same frame N times, and why you
catch a transition by shooting through it rather than waiting for it to finish.
Needs `ffmpeg` on PATH.

## Writing another one

```js
import { launch } from "../harness/app.mjs";
import { checks } from "../harness/check.mjs";
import { open } from "../glow/docs.mjs";

const t = checks("what this is about");
const app = await launch({ build: !process.argv.includes("--no-build") });
t.watch(app.page);
try {
  await open(app.page, "/components/accordion");
  t.ok("it did the thing", await app.page.locator(".thing").isVisible());
} finally {
  await app.close();
}
t.done();
```

Assert properties of the component, not of the example, so the script survives
the next rewording of the docs page. Ask the browser what is *painted* —
`elementFromPoint` — rather than whether a node exists, for anything overlaid.
And always close in a `finally`: a leaked Chrome holds the port, and the next
run will not tell you why it is hanging.
