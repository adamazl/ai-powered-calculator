import { useEffect, useState } from "react"
import { Check, ChevronRight, Copy, RotateCw, ThumbsDown, ThumbsUp } from "lucide-react"
import { THINKING_STAGES, getModel, type ModelId, type OracleResponse } from "@/lib/oracle"
import { useStreamingText } from "@/hooks/use-streaming-text"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface Turn {
  id: string
  expression: string
  result: string
  model: ModelId
  seed: number
  response: OracleResponse
}

interface Props {
  turn: Turn
  onRegenerate: (id: string) => void
  onProgress: (id: string, fraction: number) => void
}

export function AssistantTurn({ turn, onRegenerate, onProgress }: Props) {
  const { response } = turn
  const model = getModel(turn.model)
  const [thinking, setThinking] = useState(true)
  const [stage, setStage] = useState(0)
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<"up" | "down" | null>(null)

  // Regenerating remounts this component, so there is no state to reset here.
  useEffect(() => {
    const settle = window.setTimeout(() => setThinking(false), response.latencyMs)
    const rotate = window.setInterval(
      () => setStage((n) => (n + 1) % THINKING_STAGES.length),
      420,
    )
    return () => {
      window.clearTimeout(settle)
      window.clearInterval(rotate)
    }
  }, [response])

  const stream = useStreamingText(response.answer, { enabled: !thinking })

  useEffect(() => {
    onProgress(turn.id, thinking ? 0 : stream.progress)
  }, [turn.id, thinking, stream.progress, onProgress])

  const copy = () => {
    void navigator.clipboard.writeText(response.answer)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <article
      id={turn.id}
      className="border-t border-border/70 px-6 py-7 first:border-t-0 lg:px-8"
    >
      <p className="mb-1 text-[11px] text-muted-foreground">You asked</p>
      <p className="mb-6 text-[22px] leading-snug tabular-nums">
        {turn.expression}
      </p>

      <p className="mb-3 text-[11px] text-muted-foreground">
        {model.name} replied
      </p>

      {thinking ? (
        <p className="flex items-center gap-2.5 py-1 text-[14px] text-muted-foreground">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
          <span className="animate-pulse">{THINKING_STAGES[stage]}…</span>
        </p>
      ) : (
        <>
          <Collapsible className="mb-4">
            <CollapsibleTrigger className="group flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              Reasoning, {response.reasoning.length} steps
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ol className="mt-3 max-w-[68ch] space-y-2.5 border-l border-border pl-4">
                {response.reasoning.map((step, index) => (
                  <li
                    key={step}
                    className="grid grid-cols-[1.4rem_1fr] text-[13px] leading-relaxed text-muted-foreground"
                  >
                    <span className="tabular-nums text-primary/70">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>

          <div className="max-w-[62ch] font-serif text-[16.5px] leading-[1.7]">
            {stream.visible.split("\n\n").map((paragraph, index, all) => (
              <p key={index} className={cn(index < all.length - 1 && "mb-4")}>
                {paragraph}
                {!stream.done && index === all.length - 1 && (
                  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse bg-primary" />
                )}
              </p>
            ))}
          </div>

          {stream.done && (
            <div className="mt-6 max-w-[62ch]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">Confidence</span>
                    <Progress
                      value={response.confidence}
                      className="h-[3px] w-32 bg-secondary [&>div]:bg-primary"
                    />
                    <span className="text-[11px] tabular-nums text-primary">
                      {response.confidence.toFixed(1)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[19rem] text-[12px] leading-relaxed">
                  Normalised agreement across 12 sampled decoding paths, calibrated
                  against a held-out arithmetic benchmark. Not a probability, and
                  not intended to be interpreted as one.
                </TooltipContent>
              </Tooltip>

              <div className="mt-4 flex items-center gap-1">
                <Action label={copied ? "Copied" : "Copy"} onClick={copy}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Action>
                <Action
                  label="Good answer"
                  active={vote === "up"}
                  onClick={() => setVote(vote === "up" ? null : "up")}
                >
                  <ThumbsUp className="size-3.5" />
                </Action>
                <Action
                  label="Bad answer"
                  active={vote === "down"}
                  onClick={() => setVote(vote === "down" ? null : "down")}
                >
                  <ThumbsDown className="size-3.5" />
                </Action>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(turn.id)}
                  className="h-7 gap-1.5 px-2 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCw className="size-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}

function Action({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "size-7 text-muted-foreground hover:text-foreground",
            active && "text-primary",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-[12px]">{label}</TooltipContent>
    </Tooltip>
  )
}
