import type { CalcState, Key } from "@/lib/calculator"
import { Keypad } from "@/components/Keypad"

interface Props {
  state: CalcState
  /** The expression the model is still working on, if the display is waiting. */
  awaiting: string | null
  onPress: (key: Key) => void
}

const DELAYS = ["[animation-delay:0ms]", "[animation-delay:160ms]", "[animation-delay:320ms]"]

export function CalculatorUnit({ state, awaiting, onPress }: Props) {
  return (
    <div className="w-full max-w-[336px] rounded-[20px] bg-[var(--color-case)] p-4 shadow-[0_28px_60px_-18px_rgb(0_0_0/0.75),0_2px_0_0_var(--color-case-lip)_inset,0_-2px_0_0_var(--color-case-shadow)_inset]">
      <div className="mb-4 rounded-[10px] bg-[var(--color-lcd)] px-4 py-3 shadow-[inset_0_2px_6px_0_rgb(0_0_0/0.35)]">
        <div
          className="h-5 truncate text-right text-[13px] tracking-wide text-[var(--color-lcd-ink)]/55 tabular-nums"
          aria-hidden
        >
          {awaiting ?? (state.expression || " ")}
        </div>
        <output
          aria-live="polite"
          className="block truncate text-right text-[42px] leading-none font-medium text-[var(--color-lcd-ink)] tabular-nums"
        >
          {awaiting ? (
            <>
              <span className="sr-only">Waiting for the model</span>
              <span aria-hidden className="inline-flex items-center gap-2.5 align-middle">
                {DELAYS.map((delay) => (
                  <span
                    key={delay}
                    className={`size-3.5 rounded-[2px] bg-[var(--color-lcd-ink)] animate-[lcd-wait_1.05s_ease-in-out_infinite] ${delay}`}
                  />
                ))}
              </span>
            </>
          ) : (
            state.display
          )}
        </output>
      </div>
      <Keypad onPress={onPress} />
    </div>
  )
}
