import { describe, expect, test } from "vitest"
import { generateResponse } from "./oracle"

const ask = (overrides: Partial<Parameters<typeof generateResponse>[0]> = {}) =>
  generateResponse({ expression: "9 × 9", result: "81", seed: 0, ...overrides })

const paragraphs = (script: string) => script.split("\n\n")

describe("the script", () => {
  test("states the result", () => {
    expect(ask().script).toContain("81")
  })

  test("restates the expression it was given", () => {
    expect(ask().script).toContain("9 × 9")
  })

  test("runs to an unreasonable number of paragraphs", () => {
    expect(paragraphs(ask().script).length).toBeGreaterThanOrEqual(8)
  })

  test("has no empty paragraphs to pad it out", () => {
    for (const part of paragraphs(ask().script)) {
      expect(part.trim().length).toBeGreaterThan(10)
    }
  })

  test("works through its reasoning before reaching the answer", () => {
    const index = paragraphs(ask().script).findIndex((p) => p.includes("81"))
    expect(index).toBeGreaterThan(3)
  })

  test("takes a moment to warm up before any text appears", () => {
    const { latencyMs } = ask()
    expect(latencyMs).toBeGreaterThan(200)
    expect(latencyMs).toBeLessThan(2000)
  })
})

describe("seeding", () => {
  test("the same seed reproduces the same script", () => {
    expect(ask({ seed: 7 })).toEqual(ask({ seed: 7 }))
  })

  test("different seeds reach several different scripts", () => {
    const scripts = new Set(
      Array.from({ length: 10 }, (_, seed) => ask({ seed }).script),
    )
    expect(scripts.size).toBeGreaterThanOrEqual(3)
  })

  test("every variation still states the correct result", () => {
    for (let seed = 0; seed < 25; seed++) {
      expect(ask({ seed, expression: "2 + 4", result: "6" }).script).toContain("6")
    }
  })
})

describe("undefined results", () => {
  const declined = () => ask({ expression: "8 ÷ 0", result: "Undefined" })

  test("declines rather than inventing a number", () => {
    expect(declined().declined).toBe(true)
  })

  test("still explains itself at length", () => {
    expect(paragraphs(declined().script).length).toBeGreaterThanOrEqual(5)
  })

  test("never claims the answer is undefined-as-a-value", () => {
    expect(declined().script).not.toMatch(/\bis\s+Undefined\b/)
  })
})
