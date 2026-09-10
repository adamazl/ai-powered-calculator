interface Props {
  tokens: number
  cost: number
}

export function UsageBar({ tokens, cost }: Props) {
  return (
    <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border bg-card/40 px-6 py-3 lg:px-8 text-[11px] text-muted-foreground">
      <span className="tabular-nums">
        {tokens.toLocaleString()} tokens
      </span>
      <span className="tabular-nums">${cost.toFixed(6)}</span>
      <span className="ml-auto">Billed to your team at the standard rate.</span>
    </footer>
  )
}
