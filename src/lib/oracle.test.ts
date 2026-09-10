import { describe, expect, test } from "vitest"
import { MODELS, generateResponse } from "./oracle"

const ask = (overrides: Partial<Parameters<typeof generateResponse>[0]> = {}) =>
  generateResponse({
    expression: "2 + 2",
    result: "4",
    model: "cognitex-4-ultra",
    seed: 0,
    ...overrides,
  })

describe("answering", () => {
  test("states the result somewhere in the answer", () => {
    expect(ask().answer).toContain("4")
  })

  test("shows its working in at least three steps", () => {
    expect(ask().reasoning.length).toBeGreaterThanOrEqual(3)
  })

  test("every reasoning step is prose, not an empty placeholder", () => {
    for (const step of ask().reasoning) expect(step.trim().length).toBeGreaterThan(10)
  })

  test("is implausibly confident", () => {
    const { confidence } = ask()
    expect(confidence).toBeGreaterThanOrEqual(90)
    expect(confidence).toBeLessThan(100)
  })
})

describe("seeding", () => {
  test("the same seed reproduces the same response", () => {
    expect(ask({ seed: 7 })).toEqual(ask({ seed: 7 }))
  })

  test("regenerating with new seeds reaches several different phrasings", () => {
    const answers = new Set(
      Array.from({ length: 10 }, (_, seed) => ask({ seed }).answer),
    )
    expect(answers.size).toBeGreaterThanOrEqual(3)
  })

  test("every phrasing still contains the correct result", () => {
    for (let seed = 0; seed < 25; seed++) {
      expect(ask({ seed, expression: "9 × 9", result: "81" }).answer).toContain("81")
    }
  })
})

describe("models", () => {
  test("the verbose model spends more tokens than the terse one", () => {
    const ultra = ask({ model: "cognitex-4-ultra" })
    const mini = ask({ model: "slide-rule-mini" })
    expect(ultra.tokens).toBeGreaterThan(mini.tokens)
  })

  test("each model has its own thinking latency", () => {
    const latencies = MODELS.map((m) => ask({ model: m.id }).latencyMs)
    expect(new Set(latencies).size).toBe(MODELS.length)
  })

  test("cost is billed per token at the model's rate", () => {
    const model = MODELS[0]
    const response = ask({ model: model.id })
    expect(response.cost).toBeCloseTo(response.tokens * model.pricePerToken, 10)
  })
})

describe("undefined results", () => {
  const declined = () => ask({ expression: "8 ÷ 0", result: "Undefined" })

  test("declines rather than inventing a number", () => {
    expect(declined().declined).toBe(true)
  })

  test("loses its nerve about the confidence score", () => {
    expect(declined().confidence).toBeLessThan(50)
  })

  test("never claims the answer is undefined-as-a-value", () => {
    expect(declined().answer).not.toMatch(/\bis\s+Undefined\b/)
  })
})
