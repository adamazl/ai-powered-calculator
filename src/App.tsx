import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { initialState, press, type Evaluation, type Key } from "@/lib/calculator"
import { generateResponse, getModel, type ModelId } from "@/lib/oracle"
import { CalculatorUnit } from "@/components/CalculatorUnit"
import { ModelPicker } from "@/components/ModelPicker"
import { AssistantTurn, type Turn } from "@/components/AssistantTurn"
import { EmptyConsole } from "@/components/EmptyConsole"
import { UsageBar } from "@/components/UsageBar"
import { usePageScroll } from "@/hooks/use-page-scroll"
import { TooltipProvider } from "@/components/ui/tooltip"

const KEYBOARD: Record<string, Key> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "add", "-": "sub", "*": "mul", "/": "div",
  "%": "pct", "=": "eq", Enter: "eq", Escape: "clear",
}

let turnCount = 0

function buildTurn(evaluation: Evaluation, model: ModelId, seed: number): Turn {
  return {
    id: `turn-${++turnCount}`,
    expression: evaluation.expression,
    result: evaluation.result,
    model,
    seed,
    response: generateResponse({ ...evaluation, model, seed }),
  }
}

export default function App() {
  const [calc, setCalc] = useState(initialState)
  const [model, setModel] = useState<ModelId>("cognitex-4-ultra")
  const [turns, setTurns] = useState<Turn[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [awaiting, setAwaiting] = useState<{ id: string; expression: string } | null>(null)
  const [settled, setSettled] = useState<string | null>(null)
  const handled = useRef<Evaluation | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const { steerTo, steerHome } = usePageScroll()

  const handlePress = useCallback((key: Key) => {
    // Any keypress hands the display back to the user, model or no model.
    setAwaiting(null)
    setSettled(null)
    setCalc((previous) => press(previous, key))
  }, [])

  // Each completed sum becomes a turn in the transcript, exactly once.
  useEffect(() => {
    const evaluation = calc.lastEvaluation
    if (!evaluation || handled.current === evaluation) return
    handled.current = evaluation
    const turn = buildTurn(evaluation, model, Math.floor(Math.random() * 100000))
    setTurns((existing) => [...existing, turn])
    // The result is computed, but the display withholds it until the model
    // has finished explaining itself.
    setAwaiting({ id: turn.id, expression: turn.expression })
  }, [calc.lastEvaluation, model])

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

  const handleProgress = useCallback((id: string, fraction: number) => {
    setProgress((current) =>
      current[id] === fraction ? current : { ...current, [id]: fraction },
    )
    if (fraction >= 1) {
      setAwaiting((current) => (current?.id === id ? null : current))
      setSettled(id)
    }
  }, [])

  const handleRegenerate = useCallback((id: string) => {
    setTurns((existing) =>
      existing.map((turn) =>
        turn.id === id
          ? {
              ...turn,
              seed: turn.seed + 1,
              response: generateResponse({
                expression: turn.expression,
                result: turn.result,
                model: turn.model,
                seed: turn.seed + 1,
              }),
            }
          : turn,
      ),
    )
  }, [])

  const usage = useMemo(
    () =>
      turns.reduce(
        (total, turn) => {
          const spent = turn.response.tokens * (progress[turn.id] ?? 0)
          return {
            tokens: total.tokens + Math.round(spent),
            cost: total.cost + spent * getModel(turn.model).pricePerToken,
          }
        },
        { tokens: 0, cost: 0 },
      ),
    [turns, progress],
  )

  // A new turn always jumps into view; the user just pressed equals.
  useEffect(() => {
    const node = scroller.current
    if (node) node.scrollTop = node.scrollHeight
  }, [turns.length])

  // `awaiting` is set only when a sum is first evaluated, never on a
  // regenerate, so this steers the reader down exactly once per question.
  // Stacked on a narrow screen the transcript is off the bottom of the page;
  // side by side it is already visible and this does nothing.
  useEffect(() => {
    if (!awaiting) return
    steerTo(document.getElementById(awaiting.id))
  }, [awaiting, steerTo])

  // Growing text follows along, unless the reader has scrolled up to re-read.
  useEffect(() => {
    const node = scroller.current
    if (!node) return
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    if (distance < 260) node.scrollTop = node.scrollHeight
  }, [progress])

  // Once the model stops writing, hold for a beat and return them to the keypad.
  useEffect(() => {
    if (!settled) return
    const timer = window.setTimeout(steerHome, 700)
    return () => window.clearTimeout(timer)
  }, [settled, steerHome])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3.5 lg:px-8">
          <div>
            <h1 className="text-[15px] leading-[1.15] font-semibold tracking-[-0.01em] sm:text-[17px]">
              AI-Powered Calculator
            </h1>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Arithmetic, reasoned about
            </p>
          </div>
          <ModelPicker value={model} onChange={setModel} />
        </header>

        <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
          <section
            className="flex min-h-dvh items-center justify-center border-b border-border bg-[#0c161d] px-6 py-10 lg:min-h-0 lg:w-[404px] lg:shrink-0 lg:border-r lg:border-b-0"
          >
            <CalculatorUnit
              state={calc}
              awaiting={awaiting?.expression ?? null}
              onPress={handlePress}
            />
          </section>

          <section className="flex min-h-dvh flex-1 flex-col lg:min-h-0">
            <div ref={scroller} className="flex flex-1 flex-col lg:overflow-y-auto">
              <div className="lg:mt-auto">
                {turns.length === 0 ? (
                  <EmptyConsole />
                ) : (
                  turns.map((turn) => (
                    <AssistantTurn
                      key={`${turn.id}-${turn.seed}`}
                      turn={turn}
                      onRegenerate={handleRegenerate}
                      onProgress={handleProgress}
                    />
                  ))
                )}
              </div>
            </div>
            <UsageBar tokens={usage.tokens} cost={usage.cost} />
          </section>
        </main>
      </div>
    </TooltipProvider>
  )
}
