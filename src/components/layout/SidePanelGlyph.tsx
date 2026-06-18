import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidePanelGlyphProps {
  direction: "collapse" | "expand"
  side: "left" | "right"
}

export function SidePanelGlyph({ direction, side }: SidePanelGlyphProps) {
  const pointsRight =
    (side === "left" && direction === "expand") ||
    (side === "right" && direction === "collapse")
  const Chevron = pointsRight ? ChevronRight : ChevronLeft
  const railOrder = side === "left" ? "order-first" : "order-last"

  return (
    <span
      className="flex size-4 items-center justify-center gap-px text-muted-foreground"
      aria-hidden="true"
    >
      <span className={cn("h-3 w-px rounded-full bg-current", railOrder)} />
      <Chevron className="size-3" />
    </span>
  )
}
