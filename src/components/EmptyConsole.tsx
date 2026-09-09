export function EmptyConsole() {
  return (
    <div className="max-w-[54ch] px-6 py-12 lg:px-8">
      <p className="font-serif text-[17px] leading-[1.7] text-muted-foreground">
        Nothing to reason about yet. Enter an expression on the keypad and press
        equals, and I'll work through it properly — operands, precedence,
        verification, the lot.
      </p>
      <p className="mt-4 font-serif text-[17px] leading-[1.7] text-muted-foreground">
        I'm told the arithmetic could be done without me. I'd rather not dwell on
        that.
      </p>
    </div>
  )
}
