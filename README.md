# AI-Powered Calculator

A parody, and nothing else: one calculator, on its own, in the middle of the
screen. The arithmetic is real. The intelligence is not.

Press equals and the display doesn't give you the answer. It thinks for a
moment, then types out an entire essay — warming up, parsing your query,
retrieving the Peano axioms, verifying its own working, and finally, several
paragraphs and a few unsolicited caveats later, telling you what two plus four
comes to. Then the screen clears and the number appears.

There is no API key, no network call and no model. `src/lib/oracle.ts` is a pile
of templates and a seeded random number generator.

Live at <https://adamazl.github.io/ai-powered-calculator/>

## Running it

Requires Node 22 or newer (see `.nvmrc`).

```sh
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # vitest
pnpm build    # production bundle
```

## Deploying

`.github/workflows/deploy.yml` runs the tests, the linter and the build on every
push and pull request against `main`, and publishes `dist/` to GitHub Pages when
`main` passes.

Pages serves the site from `/<repo-name>/`, so `vite.config.ts` sets `base` to
match when building. The dev server stays at the root. If you rename or fork the
repo, change `REPO` in `vite.config.ts` or the built assets will 404.

## How it fits together

Two pure modules do the real work, and both are covered by tests:

- `src/lib/calculator.ts` — an honest four-function calculator. Keeps a pending
  additive and multiplicative term so `2 + 3 × 4` is 14, rounds away binary
  floating point noise, and records each completed sum as an `Evaluation`. The
  expression stays on the display's upper line after equals, so the answer never
  arrives without its question, and clears when the next entry begins.
- `src/lib/oracle.ts` — fabricates what a model would say, as one continuous
  script for the display to crawl through. Given an expression, its result and a
  seed it returns the script and a short warm-up latency. The same seed always
  produces the same script.

Around those: `useStreamingText` reveals the script a few characters at a time,
`Display` runs one exchange's warm-up-then-crawl-then-settle lifecycle and keeps
the newest line in view, and `App` holds the calculator state.

The result is computed the instant you press equals — the display is merely
withholding it, so chaining still works. Any keypress takes the display back
from the model. Dividing by zero is the one case where it declines rather than
inventing a number.

## Design notes

The calculator is a physical object: warm plastic, key travel, a green LCD, in
the spirit of a Braun ET66 crossed with a Casio whose dot-matrix screen shows
sentences. It sits alone in a pool of light on a deep petrol ground. One
typeface throughout — Archivo, an industrial grotesk — because an LCD has no
business setting a serif.

shadcn/ui supplies the `Button` the keypad is built from; the rest of the kit
came out along with the chat panel it was serving.
