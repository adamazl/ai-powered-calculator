/**
 * Fabricates the output of a large language model that has been asked to add
 * two small numbers. No network, no inference — just templates, a seeded
 * shuffle, and an unshakeable commitment to over-explaining.
 */

export type ModelId = "cognitex-4-ultra" | "abacus-70b" | "slide-rule-mini"

export interface Model {
  id: ModelId
  name: string
  note: string
  /** Base "thinking" time before the answer starts streaming. */
  latencyMs: number
  /** How many unsolicited caveats it attaches to a sum. */
  verbosity: 1 | 2 | 3
  pricePerToken: number
}

export const MODELS: Model[] = [
  {
    id: "cognitex-4-ultra",
    name: "Cognitex-4 Ultra",
    note: "frontier reasoning",
    latencyMs: 1500,
    verbosity: 3,
    pricePerToken: 0.0000031,
  },
  {
    id: "abacus-70b",
    name: "Abacus-70B",
    note: "balanced",
    latencyMs: 950,
    verbosity: 2,
    pricePerToken: 0.0000008,
  },
  {
    id: "slide-rule-mini",
    name: "Slide-Rule-mini",
    note: "legacy, deprecated",
    latencyMs: 550,
    verbosity: 1,
    pricePerToken: 0.0000002,
  },
]

export const getModel = (id: ModelId): Model =>
  MODELS.find((model) => model.id === id) ?? MODELS[0]

export interface OracleRequest {
  expression: string
  result: string
  model: ModelId
  seed: number
}

export interface OracleResponse {
  reasoning: string[]
  answer: string
  confidence: number
  tokens: number
  cost: number
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
  "Cross-referencing against roughly 40,000 structurally similar expressions seen in pre-training. Consensus is strong.",
]

const VERIFY = [
  "Computing the result. Then computing it a second time, independently, to guard against arithmetic drift.",
  "Verifying the candidate answer by working the operation backwards. It reconciles.",
  "Sanity-checking the magnitude of the result against my prior expectations. No surprises.",
]

const REFLECT = [
  "Considering whether the user might have wanted an approximation instead. Concluding that they did not.",
  "Screening the draft output for harmful content. It is a number, and appears benign.",
  "Assessing my own confidence in this answer. I feel good about it, insofar as I feel anything.",
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

/** Rough parity with how a real tokeniser would bill this nonsense. */
const countTokens = (text: string): number => Math.ceil(text.length / 4)

export function generateResponse(request: OracleRequest): OracleResponse {
  const { expression, result, seed } = request
  const model = getModel(request.model)
  const random = makeRandom(seed)

  const parts = expression.split(" ").filter(Boolean)
  const values = {
    expr: expression,
    result,
    operands: parts.filter((part) => /\d/.test(part)).length,
    operators: parts.filter((part) => !/\d/.test(part)).length,
  }

  const declined = result === "Undefined"

  const reasoning = declined
    ? DECLINE_REASONING.map((step) => fill(step, values))
    : [
        pick(random, RESTATE),
        pick(random, DECOMPOSE),
        pick(random, RECALL),
        pick(random, VERIFY),
        ...(model.verbosity === 3 ? [pick(random, REFLECT)] : []),
      ].map((step) => fill(step, values))

  const answer = declined
    ? [fill(pick(random, DECLINE_ANSWERS), values), pick(random, DECLINE_FOLLOW_UPS)].join(
        "\n\n",
      )
    : [
        pick(random, OPENERS),
        fill(pick(random, STATEMENTS), values),
        ...take(random, CAVEATS, model.verbosity),
        pick(random, FOLLOW_UPS),
      ].join("\n\n")

  const confidence = declined
    ? Math.round((22 + random() * 14) * 10) / 10
    : Math.round((96 + random() * 3.9) * 10) / 10

  const promptTokens = 400 * model.verbosity + 218
  const tokens =
    promptTokens + countTokens(answer) + countTokens(reasoning.join(" "))

  return {
    reasoning,
    answer,
    confidence,
    tokens,
    cost: tokens * model.pricePerToken,
    latencyMs: Math.round(model.latencyMs + random() * 400),
    declined,
  }
}

/** Rotating status lines for the thinking phase, before any text arrives. */
export const THINKING_STAGES = [
  "Loading model weights",
  "Consulting numerical priors",
  "Decomposing the expression",
  "Aligning with arithmetic conventions",
  "Verifying against known axioms",
  "Composing a response",
]
