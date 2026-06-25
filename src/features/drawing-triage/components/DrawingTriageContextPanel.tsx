import { Check, FileStack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DrawingTriageSheetSummary } from "./DrawingTriageEmptyState"
import type { DrawingSheetId } from "../types"

type DrawingTriageContextPanelProps = {
  activeDrawingFileName: string
  activeDrawingSource: string
  activeSheet: DrawingTriageSheetSummary
  activeSheetId: DrawingSheetId
  completedSampleSheetId: DrawingSheetId
  drawingSheets: DrawingTriageSheetSummary[]
  contextId: string
  remainingReviewCount: number
  onRequestChangeDrawing: () => void
  onRequestRemoveDrawing: () => void
  onSelectSheet: (sheetId: DrawingSheetId) => void
}

export function DrawingTriageContextPanel({
  activeDrawingFileName,
  activeDrawingSource,
  activeSheet,
  activeSheetId,
  completedSampleSheetId,
  contextId,
  drawingSheets,
  remainingReviewCount,
  onRequestChangeDrawing,
  onRequestRemoveDrawing,
  onSelectSheet,
}: DrawingTriageContextPanelProps) {
  return (
    <>
      <div className="border-border p-4 max-[900px]:p-3 min-[901px]:border-b">
        <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileStack className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Drawing context
            </span>
          </div>
          <h2 className="mt-4 text-sm font-semibold max-[900px]:mt-2">
            {activeSheet.code} {activeSheet.name}
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground max-[900px]:hidden">
            {activeSheet.id === completedSampleSheetId
              ? "Rev P03 · 1:100 · Architecture"
              : "Drawing set sheet · Not scanned"}
          </p>
          <p className="mt-1 hidden text-[10px] font-medium text-muted-foreground max-[900px]:block">
            {activeSheet.code} ·{" "}
            {activeSheet.id === completedSampleSheetId
              ? "Rev P03"
              : "Not scanned"}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-snug text-muted-foreground">
              <span>
                Source:{" "}
                <span className="font-semibold text-foreground">
                  {activeDrawingSource}
                </span>
              </span>
              <span>
                File:{" "}
                <span className="font-semibold text-foreground">
                  {activeSheet.id === completedSampleSheetId
                    ? activeDrawingFileName
                    : "No triage session"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="compact"
                className="h-7 rounded-md px-2 text-[10px]"
                onClick={onRequestChangeDrawing}
              >
                Change drawing
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="compact"
                className="h-7 rounded-md px-1.5 text-[10px] text-destructive/75 shadow-none hover:bg-destructive/10 hover:text-destructive"
                onClick={onRequestRemoveDrawing}
              >
                Remove drawing
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px] max-[900px]:space-y-3 max-[900px]:p-3 max-[900px]:pt-0">
        <section aria-labelledby={`${contextId}-artifact-heading`}>
          <h3
            id={`${contextId}-artifact-heading`}
            className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Artifact
          </h3>
          <dl className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] gap-x-2 gap-y-2 text-[11px]">
            <dt className="text-muted-foreground">File</dt>
            <dd className="truncate font-medium">
              {activeSheet.id === completedSampleSheetId
                ? activeDrawingFileName
                : "No linked triage output"}
            </dd>
            <dt className="text-muted-foreground">Sheet</dt>
            <dd>
              {activeSheet.code} {activeSheet.name}
            </dd>
            <dt className="text-muted-foreground">Revision</dt>
            <dd>
              {activeSheet.id === completedSampleSheetId
                ? "Rev P03 · 14 May 2026"
                : "Not scanned in prototype"}
            </dd>
            <dt className="text-muted-foreground">Scale</dt>
            <dd>1:100 at A1</dd>
            <dt className="text-muted-foreground">Discipline</dt>
            <dd>Architecture</dd>
            <dt className="text-muted-foreground">Source</dt>
            <dd>{activeDrawingSource}</dd>
          </dl>
        </section>

        <section aria-labelledby={`${contextId}-sheets-heading`}>
          <div className="flex items-center justify-between">
            <h3
              id={`${contextId}-sheets-heading`}
              className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Sheets
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {drawingSheets.findIndex((sheet) => sheet.id === activeSheetId) +
                1}{" "}
              of {drawingSheets.length}
            </span>
          </div>
          <div className="mt-2 space-y-1 max-[900px]:grid max-[900px]:grid-cols-3 max-[900px]:gap-1 max-[900px]:space-y-0">
            {drawingSheets.map((sheet) => {
              const selected = sheet.id === activeSheetId
              const completed = sheet.status === "completed"
              const statusLabel = completed
                ? remainingReviewCount === 0
                  ? "Review decisions complete"
                  : `${remainingReviewCount} awaiting decision`
                : "Not scanned"

              return (
                <button
                  key={sheet.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 rounded-sm px-2.5 py-2 text-left text-[11px] outline-none ring-ring transition-colors focus-visible:ring-2 max-[900px]:px-2 max-[900px]:py-1.5",
                    selected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-panel-subtle hover:text-foreground",
                  )}
                  onClick={() => onSelectSheet(sheet.id)}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : completed
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {sheet.marker}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      <span className="max-[900px]:hidden">{sheet.name}</span>
                      <span className="hidden max-[900px]:inline">
                        {sheet.shortName}
                      </span>
                    </span>
                    <span className="block truncate text-[9px] opacity-75 max-[900px]:hidden">
                      {statusLabel}
                    </span>
                  </span>
                  {selected && (
                    <Check className="size-3.5 shrink-0 max-[900px]:hidden" />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <div className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground max-[900px]:hidden">
          Sample artifact and metadata. No file upload, storage, or document
          processing is active.
        </div>
      </div>
    </>
  )
}
