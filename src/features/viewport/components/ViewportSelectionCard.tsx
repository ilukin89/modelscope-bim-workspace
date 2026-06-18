import { Box, EyeOff, ScanLine } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ReviewIssue } from "@/types"
import { cn } from "@/lib/utils"

interface ViewportSelectionCardProps {
  aiReviewVisualsActive: boolean
  previewActive: boolean
  selectedDisciplineLabel: string
  selectedIssue: ReviewIssue
  selectedObjectVisible: boolean
}

export function ViewportSelectionCard({
  aiReviewVisualsActive,
  previewActive,
  selectedDisciplineLabel,
  selectedIssue,
  selectedObjectVisible,
}: ViewportSelectionCardProps) {
  return (
    <Card
      className={cn(
        "absolute bottom-3 left-3 z-20 max-w-[260px] rounded-md bg-panel shadow-lg",
        !selectedObjectVisible && "border-border opacity-75",
        selectedObjectVisible &&
          aiReviewVisualsActive &&
          selectedIssue.severity === "critical" &&
          "border-destructive/35",
        selectedObjectVisible &&
          aiReviewVisualsActive &&
          selectedIssue.severity === "warning" &&
          "border-warning/35",
        selectedObjectVisible &&
          aiReviewVisualsActive &&
          selectedIssue.severity === "info" &&
          "border-primary/35",
      )}
      data-selected-object-visible={selectedObjectVisible}
    >
      <CardContent className="flex items-center gap-2 p-2.5">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-sm",
            !selectedObjectVisible && "bg-muted text-muted-foreground",
            selectedObjectVisible &&
              !aiReviewVisualsActive &&
              "bg-muted text-muted-foreground",
            selectedIssue.severity === "critical" &&
              selectedObjectVisible &&
              aiReviewVisualsActive &&
              "bg-destructive/12 text-destructive",
            selectedIssue.severity === "warning" &&
              selectedObjectVisible &&
              aiReviewVisualsActive &&
              "bg-warning/12 text-warning-foreground",
            selectedIssue.severity === "info" &&
              selectedObjectVisible &&
              aiReviewVisualsActive &&
              "bg-primary/12 text-primary",
          )}
        >
          {selectedObjectVisible && aiReviewVisualsActive ? (
            <ScanLine className="size-3.5" />
          ) : selectedObjectVisible ? (
            <Box className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </span>
        <div className="min-w-0" data-testid="viewport-selection">
          <p className="truncate text-[11px] font-semibold">
            {selectedIssue.object}
          </p>
          <p className="truncate text-[9px] text-muted-foreground">
            {!selectedObjectVisible
              ? `Selected object hidden by ${selectedDisciplineLabel} visibility`
              : aiReviewVisualsActive
                ? `${previewActive ? "Preview" : selectedIssue.code} · ${
                    selectedIssue.location
                  }`
                : `${selectedIssue.details.category} · ${selectedIssue.details.level}`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
