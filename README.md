# AI-Powered Calculator

A parody. The arithmetic is real; the intelligence is not. Every time you
press equals, a fabricated language model spends a second thinking, shows you its reasoning, and then explains — at length, in a serif
typeface, with unsolicited caveats — that two plus two comes to four.

There is no API key, no network call, and no model. `src/lib/oracle.ts` is a pile
of templates and a seeded random number generator.

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
- `src/lib/oracle.ts` — fabricates the model's output. Given an expression, its
  result, a model and a seed, it returns reasoning steps, prose, a confidence
  score and a token count. The same seed always produces the same response, so
  Regenerate simply increments the seed.

The React layer wraps those: `useStreamingText` reveals the answer a few
characters at a time, `AssistantTurn` handles one exchange's thinking-then-
streaming lifecycle, and `App` holds the transcript and the running bill.

The calculator's display is gated on the model. Press equals and the LCD keeps
showing the expression with a blinking wait indicator where the answer belongs;
the number only appears once the model has finished explaining it. The value is
computed immediately underneath, so chaining still works — the display is merely
withholding it. Any keypress takes the display back from the model.

Dividing by zero is the one case where the model declines rather than inventing
a number, and its confidence drops accordingly.

## Design notes

Two materials in one screen. The calculator is a physical object — warm plastic,
key travel, an LCD — in the spirit of a Braun ET66. The console beside it is a
flat surface: deep petrol, hairline rules, brass accents. Archivo sets the
chrome; Newsreader sets the model's prose, because an academic serif is the
funniest possible frame for a paragraph about adding two numbers.
