import type { CalcState, Key } from "@/lib/calculator"
import { Display, type Script } from "@/components/Display"
import { Keypad } from "@/components/Keypad"

interface Props {
  state: CalcState
  script: Script | null
  onPress: (key: Key) => void
  onSettled: () => void
}

export function CalculatorUnit({ state, script, onPress, onSettled }: Props) {
  return (
    <div className="w-full max-w-[420px] rounded-[22px] bg-[var(--color-case)] p-4 shadow-[0_34px_70px_-20px_rgb(0_0_0/0.8),0_2px_0_0_var(--color-case-lip)_inset,0_-2px_0_0_var(--color-case-shadow)_inset]">
      <h1 className="mb-3 px-1 text-[11px] font-medium text-[var(--color-key-mark)]/45">
        AI-Powered Calculator
      </h1>
      <Display
        expression={state.expression}
        value={state.display}
        script={script}
        onSettled={onSettled}
      />
      <Keypad onPress={onPress} />
    </div>
  )
}
