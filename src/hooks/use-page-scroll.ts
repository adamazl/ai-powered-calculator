import { useCallback, useRef } from "react"

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** How far the reader may drift before we stop steering them. */
const DRIFT_ALLOWANCE = 120

const maxScroll = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

/**
 * Moves the window between the calculator and the transcript.
 *
 * Only does anything when the panes are stacked. Side by side on a wide screen
 * the page does not scroll at all, so every call is a no-op — which is the
 * behaviour we want there.
 */
export function usePageScroll() {
  const landed = useRef<number | null>(null)

  const scrollTo = useCallback((top: number) => {
    if (maxScroll() === 0) return null
    // The browser clamps to the end of the page, so clamp here too: otherwise
    // we would remember a position the reader never actually reached.
    const target = Math.min(Math.max(0, top), maxScroll())
    window.scrollTo({
      top: target,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
    return target
  }, [])

  /** Bring an element to the top of the screen, remembering where we left off. */
  const steerTo = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      landed.current = scrollTo(node.getBoundingClientRect().top + window.scrollY)
    },
    [scrollTo],
  )

  /** Return to the top, unless the reader has scrolled off somewhere themselves. */
  const steerHome = useCallback(() => {
    const left = landed.current
    landed.current = null
    if (left === null) return
    if (Math.abs(window.scrollY - left) > DRIFT_ALLOWANCE) return
    scrollTo(0)
  }, [scrollTo])

  return { steerTo, steerHome }
}
