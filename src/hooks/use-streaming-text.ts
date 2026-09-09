import { useEffect, useState } from "react"

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

interface Options {
  enabled: boolean
  charsPerTick?: number
  tickMs?: number
}

export interface Stream {
  visible: string
  progress: number
  done: boolean
}

/**
 * Reveals `text` a few characters at a time, the way a token stream arrives.
 * Restarts whenever the text changes and stops immediately when disabled.
 */
export function useStreamingText(
  text: string,
  { enabled, charsPerTick = 4, tickMs = 16 }: Options,
): Stream {
  const initialReveal = () => (prefersReducedMotion() ? text.length : 0)
  const [revealed, setRevealed] = useState(initialReveal)
  const [streaming, setStreaming] = useState(text)

  // Rewind during render rather than in an effect, so a new answer never
  // paints a frame of the previous one.
  if (streaming !== text) {
    setStreaming(text)
    setRevealed(initialReveal())
  }

  useEffect(() => {
    if (!enabled || revealed >= text.length) return
    const timer = window.setTimeout(
      () => setRevealed((n) => Math.min(text.length, n + charsPerTick)),
      tickMs,
    )
    return () => window.clearTimeout(timer)
  }, [enabled, revealed, text, charsPerTick, tickMs])

  return {
    visible: text.slice(0, revealed),
    progress: text.length === 0 ? 1 : revealed / text.length,
    done: revealed >= text.length,
  }
}
