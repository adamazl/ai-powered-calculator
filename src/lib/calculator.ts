export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
export type Operator = "add" | "sub" | "mul" | "div"
export type Key = Digit | "." | Operator | "eq" | "clear" | "neg" | "pct"

export interface Evaluation {
  expression: string
  result: string
}

export interface CalcState {
  /** What the display shows right now. */
  display: string
  /** The live keypad entry, or null when the display holds a computed value. */
  entry: string | null
  /** Operands and operators already locked in, as typed. */
  committed: string[]
  additive: { value: number; op: Operator } | null
  multiplicative: { value: number; op: Operator } | null
  expression: string
  error: boolean
  lastEvaluation: Evaluation | null
  /**
   * The state as it was before the most recent operator press, so a second
   * operator press replaces the first instead of stacking on top of it.
   */
  beforeOperator: CalcState | null
}

export const SYMBOLS: Record<Operator, string> = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
}

export const initialState: CalcState = {
  display: "0",
  entry: null,
  committed: [],
  additive: null,
  multiplicative: null,
  expression: "",
  error: false,
  lastEvaluation: null,
  beforeOperator: null,
}

const MAX_ENTRY_LENGTH = 12

const isDigit = (key: Key): key is Digit => key >= "0" && key <= "9"

const isOperator = (key: Key): key is Operator =>
  key === "add" || key === "sub" || key === "mul" || key === "div"

/** Trims the binary floating point noise a pocket calculator would never show. */
export function format(value: number): string {
  if (!Number.isFinite(value)) return "Undefined"
  return String(Number(value.toPrecision(12)))
}

function compute(left: number, op: Operator, right: number): number {
  switch (op) {
    case "add":
      return left + right
    case "sub":
      return left - right
    case "mul":
      return left * right
    case "div":
      return left / right
  }
}

const currentValue = (state: CalcState): number =>
  Number(state.entry ?? state.display)

/** The expression as written so far, including whatever is still being typed. */
function readExpression(committed: string[], entry: string | null): string {
  return [...committed, entry ?? ""].filter(Boolean).join(" ")
}

function withEntry(state: CalcState, entry: string): CalcState {
  return {
    ...state,
    entry,
    display: entry,
    expression: readExpression(state.committed, entry),
    beforeOperator: null,
  }
}

function pressOperator(base: CalcState, op: Operator): CalcState {
  let current = currentValue(base)
  let { additive, multiplicative } = base

  if (multiplicative) {
    current = compute(multiplicative.value, multiplicative.op, current)
    multiplicative = null
  }

  if (op === "mul" || op === "div") {
    multiplicative = { value: current, op }
  } else {
    if (additive) current = compute(additive.value, additive.op, current)
    additive = { value: current, op }
  }

  const operand =
    base.entry ?? (base.committed.length === 0 ? base.display : null)
  const committed = [
    ...base.committed,
    ...(operand === null ? [] : [operand]),
    SYMBOLS[op],
  ]

  return {
    ...base,
    display: format(current),
    entry: null,
    committed,
    additive,
    multiplicative,
    expression: readExpression(committed, null),
    beforeOperator: base,
  }
}

function pressEquals(state: CalcState): CalcState {
  let current = currentValue(state)
  if (state.multiplicative) {
    current = compute(
      state.multiplicative.value,
      state.multiplicative.op,
      current,
    )
  }
  if (state.additive) {
    current = compute(state.additive.value, state.additive.op, current)
  }

  const tail =
    state.entry ?? (state.committed.length === 0 ? state.display : null)
  const expression = readExpression(
    state.committed,
    tail === null ? null : tail,
  )
  const result = format(current)

  return {
    ...initialState,
    display: result,
    // The question stays on screen next to its answer, until the next entry
    // replaces it.
    expression,
    error: result === "Undefined",
    lastEvaluation: { expression, result },
  }
}

export function press(state: CalcState, key: Key): CalcState {
  if (key === "clear") return initialState

  if (state.error) {
    return isDigit(key) ? press(initialState, key) : state
  }

  if (isDigit(key)) {
    const current = state.entry ?? ""
    if (current.replace(/[-.]/g, "").length >= MAX_ENTRY_LENGTH) return state
    return withEntry(state, current === "0" ? key : current + key)
  }

  if (key === ".") {
    const current = state.entry
    if (current === null) return withEntry(state, "0.")
    if (current.includes(".")) return state
    return withEntry(state, current + ".")
  }

  if (key === "neg") {
    const current = state.entry ?? state.display
    if (current === "0") return state
    return withEntry(
      state,
      current.startsWith("-") ? current.slice(1) : "-" + current,
    )
  }

  if (key === "pct") return withEntry(state, format(currentValue(state) / 100))

  if (isOperator(key)) return pressOperator(state.beforeOperator ?? state, key)

  return pressEquals(state)
}
