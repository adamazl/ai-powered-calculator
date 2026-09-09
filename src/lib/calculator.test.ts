import { describe, expect, test } from "vitest"
import { initialState, press, type CalcState } from "./calculator"

const run = (...keys: string[]): CalcState =>
  keys.reduce((state, key) => press(state, key as never), initialState)

describe("entry", () => {
  test("digits accumulate into the display", () => {
    expect(run("4", "2").display).toBe("42")
  })

  test("a leading zero is replaced by the next digit", () => {
    expect(run("0", "7").display).toBe("7")
  })

  test("a second decimal point is ignored", () => {
    expect(run("1", ".", "5", ".", "2").display).toBe("1.52")
  })

  test("negate flips the sign of the current entry", () => {
    expect(run("8", "neg").display).toBe("-8")
  })

  test("percent divides the current entry by one hundred", () => {
    expect(run("5", "0", "pct").display).toBe("0.5")
  })

  test("clear returns to the initial state", () => {
    expect(run("9", "add", "3", "clear")).toEqual(initialState)
  })
})

describe("evaluation", () => {
  test("adds two operands", () => {
    expect(run("2", "add", "2", "eq").display).toBe("4")
  })

  test("multiplication binds tighter than addition", () => {
    expect(run("2", "add", "3", "mul", "4", "eq").display).toBe("14")
  })

  test("folds a pending addition when another addition is entered", () => {
    expect(run("2", "add", "3", "add").display).toBe("5")
  })

  test("continues from the result when an operator follows equals", () => {
    expect(run("2", "add", "2", "eq", "mul", "3", "eq").display).toBe("12")
  })

  test("rounds away binary floating point noise", () => {
    expect(run("0", ".", "1", "add", "0", ".", "2", "eq").display).toBe("0.3")
  })

  test("division by zero is undefined", () => {
    expect(run("8", "div", "0", "eq").display).toBe("Undefined")
  })
})

describe("expression", () => {
  test("reads back the keystrokes as written", () => {
    expect(run("2", "add", "3", "mul", "4").expression).toBe("2 + 3 × 4")
  })

  test("replacing an operator does not repeat it", () => {
    expect(run("6", "add", "sub").expression).toBe("6 −")
  })

  test("equals records the whole expression and its result", () => {
    expect(run("2", "add", "2", "eq").lastEvaluation).toEqual({
      expression: "2 + 2",
      result: "4",
    })
  })

  test("equals leaves the question on screen beside its answer", () => {
    expect(run("2", "add", "2", "eq").expression).toBe("2 + 2")
  })

  test("a declined sum also stays on screen", () => {
    expect(run("8", "div", "0", "eq").expression).toBe("8 ÷ 0")
  })

  test("typing a new number clears the finished expression", () => {
    expect(run("2", "add", "2", "eq", "7").expression).toBe("7")
  })

  test("an operator after equals continues from the result", () => {
    expect(run("2", "add", "2", "eq", "mul").expression).toBe("4 ×")
  })

  test("clear wipes the finished expression", () => {
    expect(run("2", "add", "2", "eq", "clear").expression).toBe("")
  })
})
