import { useEffect, useRef, useState } from "react"
import { useStreamingText } from "@/hooks/use-streaming-text"

export interface Script {
  id: string
  text: string
  latencyMs: number
}

interface Props {
  expression: string
  value: string
  /** The essay currently working its way across the display, if any. */
  script: Script | null
  onSettled: () => void
}

export function Display({ expression, value, script, onSettled }: Props) {
  return (
    <div className="mb-4 flex h-[212px] flex-col rounded-[10px] bg-[var(--color-lcd)] px-4 py-3 shadow-[inset_0_2px_6px_0_rgb(0_0_0/0.35)]">
      <div
        className="h-5 shrink-0 truncate text-right text-[13px] tracking-wide text-[var(--color-lcd-ink)]/55 tabular-nums"
        aria-hidden
      >
        {expression || " "}
      </div>
      {script ? (
        <Crawl key={script.id} script={script} onSettled={onSettled} />
      ) : (
        <output
          aria-live="polite"
          className="flex flex-1 items-center justify-end truncate text-[56px] leading-none font-medium text-[var(--color-lcd-ink)] tabular-nums"
        >
          {value}
        </output>
      )}
    </div>
  )
}

/**
 * Types the script across the display, holds the finished essay for a beat,
 * then hands the display back so the answer can appear.
 */
function Crawl({ script, onSettled }: { script: Script; onSettled: () => void }) {
  const [warming, setWarming] = useState(true)
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setWarming(false), script.latencyMs)
    return () => window.clearTimeout(timer)
  }, [script.latencyMs])

  const stream = useStreamingText(script.text, { enabled: !warming })

  // Keep the newest line in view as the text outgrows the display.
  useEffect(() => {
    const node = viewport.current
    if (node) node.scrollTop = node.scrollHeight
  }, [stream.visible])

  useEffect(() => {
    if (warming || !stream.done) return
    const timer = window.setTimeout(onSettled, 900)
    return () => window.clearTimeout(timer)
  }, [warming, stream.done, onSettled])

  return (
    <div
      ref={viewport}
      aria-live="polite"
      className="mt-1.5 flex-1 overflow-hidden text-[12.5px] leading-[1.55] whitespace-pre-wrap text-[var(--color-lcd-ink)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_20px)] [mask-image:linear-gradient(to_bottom,transparent_0,#000_20px)]"
    >
      {stream.visible}
      <span
        aria-hidden
        className="ml-px inline-block h-[1em] w-[6px] translate-y-[0.15em] bg-[var(--color-lcd-ink)] animate-[lcd-caret_1s_step-end_infinite]"
      />
    </div>
  )
}
