import type { Key } from "@/lib/calculator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface KeyDef {
  key: Key
  label: string
  tone?: "operator" | "equals" | "modifier"
  wide?: boolean
}

const KEYS: KeyDef[] = [
  { key: "clear", label: "C", tone: "modifier" },
  { key: "neg", label: "±", tone: "modifier" },
  { key: "pct", label: "%", tone: "modifier" },
  { key: "div", label: "÷", tone: "operator" },
  { key: "7", label: "7" },
  { key: "8", label: "8" },
  { key: "9", label: "9" },
  { key: "mul", label: "×", tone: "operator" },
  { key: "4", label: "4" },
  { key: "5", label: "5" },
  { key: "6", label: "6" },
  { key: "sub", label: "−", tone: "operator" },
  { key: "1", label: "1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "add", label: "+", tone: "operator" },
  { key: "0", label: "0", wide: true },
  { key: ".", label: "." },
  { key: "eq", label: "=", tone: "equals" },
]

const LABELS: Partial<Record<Key, string>> = {
  clear: "Clear",
  neg: "Negate",
  pct: "Percent",
  div: "Divide",
  mul: "Multiply",
  sub: "Subtract",
  add: "Add",
  eq: "Calculate",
  ".": "Decimal point",
}

export function Keypad({ onPress }: { onPress: (key: Key) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {KEYS.map(({ key, label, tone, wide }) => (
        <Button
          key={key}
          variant="ghost"
          aria-label={LABELS[key] ?? label}
          onClick={() => onPress(key)}
          className={cn(
            "h-13 rounded-[11px] text-[20px] font-medium tabular-nums",
            "shadow-[0_2px_0_0_var(--color-case-shadow),inset_0_1px_0_0_rgb(255_255_255/0.07)]",
            "transition-[transform,box-shadow,background-color] duration-75",
            "focus-visible:ring-[var(--color-equals)]/70",
            "active:translate-y-[2px] active:shadow-[inset_0_1px_2px_0_var(--color-case-shadow)]",
            tone === "equals"
              ? "bg-[var(--color-equals)] text-[#2b2205] hover:bg-[var(--color-equals)] hover:brightness-105"
              : tone === "operator"
                ? "bg-[var(--color-key-lit)] text-[var(--color-key-mark)] hover:bg-[#4b473d] hover:text-[var(--color-key-mark)]"
                : tone === "modifier"
                  ? "bg-[var(--color-key-dim)] text-[var(--color-key-mark)]/75 hover:bg-[var(--color-key)] hover:text-[var(--color-key-mark)]"
                  : "bg-[var(--color-key)] text-[var(--color-key-mark)] hover:bg-[var(--color-key-lit)] hover:text-[var(--color-key-mark)]",
            wide && "col-span-2",
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
