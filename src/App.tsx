import { useCallback, useEffect, useRef, useState } from "react"
import { initialState, press, type Evaluation, type Key } from "@/lib/calculator"
import { generateResponse } from "@/lib/oracle"
import { CalculatorUnit } from "@/components/CalculatorUnit"
import type { Script } from "@/components/Display"

const KEYBOARD: Record<string, Key> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "add", "-": "sub", "*": "mul", "/": "div",
  "%": "pct", "=": "eq", Enter: "eq", Escape: "clear",
}

let runCount = 0

export default function App() {
  const [calc, setCalc] = useState(initialState)
  const [script, setScript] = useState<Script | null>(null)
  const handled = useRef<Evaluation | null>(null)

  const handlePress = useCallback((key: Key) => {
    // Any keypress hands the display back to the user, model or no model.
    setScript(null)
    setCalc((previous) => press(previous, key))
  }, [])

  // Each completed sum sets the model talking, exactly once.
  useEffect(() => {
    const evaluation = calc.lastEvaluation
    if (!evaluation || handled.current === evaluation) return
    handled.current = evaluation
    const response = generateResponse({
      ...evaluation,
      seed: Math.floor(Math.random() * 100000),
    })
    setScript({
      id: `run-${++runCount}`,
      text: response.script,
      latencyMs: response.latencyMs,
    })
  }, [calc.lastEvaluation])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = KEYBOARD[event.key]
      if (!key) return
      event.preventDefault()
      handlePress(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handlePress])

  const handleSettled = useCallback(() => setScript(null), [])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_center,#16242d_0%,#0b151c_65%)] p-5">
      <CalculatorUnit
        state={calc}
        script={script}
        onPress={handlePress}
        onSettled={handleSettled}
      />
    </main>
  )
}
