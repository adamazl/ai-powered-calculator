/**
 * Fabricates what a large language model would say if you asked it to add two
 * small numbers, as one continuous script for the calculator's display to crawl
 * through. No network, no inference — templates, a seeded shuffle, and an
 * unshakeable commitment to over-explaining.
 */

export interface OracleRequest {
  expression: string
  result: string
  seed: number
}

export interface OracleResponse {
  /** The whole essay, paragraph-separated, for the display to work through. */
  script: string
  /** A beat of dead air before any text appears. */
  latencyMs: number
  declined: boolean
}

/** mulberry32 — small, fast, and identical for a given seed on every run. */
function makeRandom(seed: number): () => number {
  let state = (seed + 0x6d2b79f5) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(random: () => number, options: T[]): T =>
  options[Math.floor(random() * options.length)]

function take<T>(random: () => number, options: T[], count: number): T[] {
  const pool = [...options]
  const taken: T[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    taken.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }
  return taken
}

const WARMING = [
  "Loading model weights.",
  "Consulting numerical priors.",
  "Establishing a decoding strategy.",
  "Aligning with arithmetic conventions.",
  "Warming the inference cache.",
  "Selecting an appropriate reasoning depth.",
]

const RESTATE = [
  'Parsing the submitted query. The input "{expr}" appears to be an arithmetic expression rather than a request for creative writing.',
  'Identifying intent. The user has supplied "{expr}" and is, I infer, seeking its value.',
  'Reading the prompt "{expr}". Classifying as: numerical reasoning, difficulty tier 1 of 10.',
]

const DECOMPOSE = [
  "Decomposing into operands and operators. I count {operands} operand(s) and {operators} operator(s), with no parentheses to complicate precedence.",
  "Tokenising. Every symbol maps cleanly onto a known arithmetic primitive. No ambiguity detected, though I remain alert to the possibility.",
  "Screening for trick phrasing, alternate bases, or implied units. Finding none, I proceed with ordinary decimal arithmetic.",
]

const RECALL = [
  "Retrieving the relevant axioms from the Peano construction of the natural numbers. All appear to be intact.",
  "Consulting my internal representation of the real number line. It is, reassuringly, still ordered.",
  "Cross-referencing against roughly forty thousand structurally similar expressions seen in pre-training. Consensus is strong.",
]

const VERIFY = [
  "Computing the result. Then computing it a second time, independently, to guard against arithmetic drift.",
  "Verifying the candidate answer by working the operation backwards. It reconciles.",
  "Sanity-checking the magnitude of the result against my prior expectations. No surprises.",
]

const REFLECT = [
  "Considering whether you might have wanted an approximation instead. Concluding that you did not.",
  "Screening the draft output for harmful content. It is a number, and appears benign.",
  "Assessing my own confidence in this answer. I feel good about it, insofar as I feel anything.",
]

const OPENERS = [
  "Great question — let's work through it together.",
  "Happy to help with this one.",
  "Thanks for the clear input; that makes this straightforward.",
  "Let's take this step by step.",
  "Certainly. This falls well within my capabilities.",
]

const STATEMENTS = [
  "The expression {expr} evaluates to {result}.",
  "Working through {expr} carefully, I arrive at {result}.",
  "{expr} resolves to {result}.",
  "After due consideration, the value of {expr} is {result}.",
  "Putting it plainly: {expr} comes to {result}.",
]

const CAVEATS = [
  "It's worth noting that this assumes standard base-10 arithmetic and the conventional order of operations.",
  "Do bear in mind that if your operands were intended as measurements, the units will need carrying through separately.",
  "One small caveat: floating-point representations vary between systems, so treat this as accurate to the precision shown.",
  "This holds under the usual field axioms; results in more exotic algebras may differ.",
  "I've assumed you meant this literally rather than as an illustrative example. Let me know if that was wrong.",
  "If this figure is going anywhere financial, medical, or load-bearing, I'd gently suggest verifying it independently.",
  "For completeness, the result is exact rather than approximate, so no rounding has been applied.",
]

const FOLLOW_UPS = [
  "Would you like me to show the working in more detail, or try a related expression?",
  "Let me know if you'd prefer this as a fraction, a percentage, or in another base.",
  "I'm happy to walk through the underlying arithmetic if that would be useful.",
  "If it helps, I can produce a short written summary of what we just did.",
  "Is there anything else you'd like me to compute?",
]

const DECLINE_REASONING = [
  'Parsing "{expr}". I notice immediately that the divisor is zero, which is where this gets delicate.',
  "Checking whether a limit exists. Approaching from the left gives negative infinity; from the right, positive infinity. These disagree.",
  "Consulting my guidelines on giving confident answers to questions that do not have them.",
  "Weighing the options. I could produce something that looks like a number, but you would be right not to trust it.",
]

const DECLINE_ANSWERS = [
  "I've thought about this one carefully, and I don't believe there's an answer I can responsibly give you. Dividing by zero isn't a difficult calculation — it's a request for a number that doesn't exist. I could invent something confident-sounding, but that would be worse than saying so plainly.",
  "This is a case where the honest response is to stop. There's no value that {expr} can take; the operation simply isn't defined. I'd rather tell you that than produce a figure you might rely on.",
  "I have to decline this one. Zero divisors don't yield a result — they yield a gap in the arithmetic. Anything I offered here would be fabrication dressed up as computation.",
]

const DECLINE_FOLLOW_UPS = [
  "If it's the limiting behaviour you're after, I'd be glad to talk through that instead.",
  "Happy to help if you'd like to try a different divisor.",
  "Let me know if you'd like the reasoning behind why this is left undefined.",
]

const fill = (
  template: string,
  values: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  )

export function generateResponse(request: OracleRequest): OracleResponse {
  const { expression, result, seed } = request
  const random = makeRandom(seed)

  const parts = expression.split(" ").filter(Boolean)
  const values = {
    expr: expression,
    result,
    operands: parts.filter((part) => /\d/.test(part)).length,
    operators: parts.filter((part) => !/\d/.test(part)).length,
  }

  const declined = result === "Undefined"

  const paragraphs = declined
    ? [
        ...take(random, WARMING, 2),
        ...DECLINE_REASONING,
        pick(random, DECLINE_ANSWERS),
        pick(random, DECLINE_FOLLOW_UPS),
      ]
    : [
        ...take(random, WARMING, 2),
        pick(random, RESTATE),
        pick(random, DECOMPOSE),
        pick(random, RECALL),
        pick(random, VERIFY),
        pick(random, REFLECT),
        pick(random, OPENERS),
        pick(random, STATEMENTS),
        ...take(random, CAVEATS, 3),
        pick(random, FOLLOW_UPS),
      ]

  return {
    script: paragraphs.map((part) => fill(part, values)).join("\n\n"),
    latencyMs: Math.round(420 + random() * 380),
    declined,
  }
}
