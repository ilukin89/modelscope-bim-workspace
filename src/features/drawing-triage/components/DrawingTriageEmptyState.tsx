import { Bot, Check, FileStack, ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DrawingSheetId, DrawingTriageSheetSummary } from "../types"

type DrawingTriageProjectEmptyStateProps = {
  projectName: string
  onOpenResidentialTowerSample: () => void
}

type DrawingTriageSheetEmptyStateProps = {
  activeDrawingSource: string
  activeSheet: DrawingTriageSheetSummary
  activeSheetId: DrawingSheetId
  drawingSheets: DrawingTriageSheetSummary[]
  remainingReviewCount: number
  onOpenLevel02Sample: () => void
  onSelectSheet: (sheetId: DrawingSheetId) => void
}

function DrawingTriageHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="flex min-h-12 items-center gap-3 border-b border-border bg-panel/90 px-4 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 shrink-0 text-primary" />
          <h1
            id="drawing-triage-heading"
            className="truncate text-sm font-semibold tracking-tight"
          >
            Drawing Triage
          </h1>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </header>
  )
}

function DrawingTriageWorkflowNote({ heading }: { heading: string }) {
  const steps = [
    "Link drawing package",
    "Select sheet",
    "Run drawing triage",
    "Review candidate observations",
  ]

  return (
    <div className="mt-5 border border-border bg-panel-subtle/45 p-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {heading}
      </h3>
      <ol className="mt-3 grid gap-2 text-[11px] leading-snug text-muted-foreground sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-panel text-[10px] font-semibold text-foreground">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DrawingTriageInactiveCandidatePanel({ message }: { message: string }) {
  return (
    <aside className="scrollbar-thin order-2 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:border-t min-[901px]:order-3 min-[901px]:border-l">
      <div className="border-b border-border p-4">
        <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Candidate review
            </span>
          </div>
          <h2 className="mt-4 text-sm font-semibold">No candidate queue</h2>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
      <div className="mx-3 mt-3 border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground max-[900px]:mx-auto max-[900px]:w-[calc(100%-1.5rem)] max-[900px]:max-w-[696px]">
        Review candidates and created issues appear only in the completed
        Residential Tower A Level 02 sample.
      </div>
    </aside>
  )
}

function DrawingTriageNoDrawingPackagePanel({
  projectName,
}: {
  projectName: string
}) {
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
            No drawing package linked
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            This prototype includes Drawing Triage data for Residential Tower A
            only.
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4 text-[11px] leading-relaxed text-muted-foreground max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px] max-[900px]:p-3 max-[900px]:pt-0">
        <p>
          {projectName} is available in the project switcher, but it has no
          local drawing package in this demo.
        </p>
      </div>
    </>
  )
}

function DrawingTriageStaticSheetPanel({
  activeDrawingSource,
  activeSheet,
  activeSheetId,
  drawingSheets,
  remainingReviewCount,
  onSelectSheet,
}: DrawingTriageSheetEmptyStateProps) {
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
            Drawing set sheet · Not scanned
          </p>
          <p className="mt-1 hidden text-[10px] font-medium text-muted-foreground max-[900px]:block">
            {activeSheet.code} · Not scanned
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-snug text-muted-foreground">
            <span>
              Source:{" "}
              <span className="font-semibold text-foreground">
                {activeDrawingSource}
              </span>
            </span>
            <span>
              File:{" "}
              <span className="font-semibold text-foreground">
                No triage session
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px] max-[900px]:space-y-3 max-[900px]:p-3 max-[900px]:pt-0">
        <section aria-labelledby="empty-sheet-artifact-heading">
          <h3
            id="empty-sheet-artifact-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Artifact
          </h3>
          <dl className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] gap-x-2 gap-y-2 text-[11px]">
            <dt className="text-muted-foreground">File</dt>
            <dd className="truncate font-medium">No linked triage output</dd>
            <dt className="text-muted-foreground">Sheet</dt>
            <dd>
              {activeSheet.code} {activeSheet.name}
            </dd>
            <dt className="text-muted-foreground">Revision</dt>
            <dd>Not scanned in prototype</dd>
            <dt className="text-muted-foreground">Scale</dt>
            <dd>1:100 at A1</dd>
            <dt className="text-muted-foreground">Discipline</dt>
            <dd>Architecture</dd>
            <dt className="text-muted-foreground">Source</dt>
            <dd>{activeDrawingSource}</dd>
          </dl>
        </section>

        <section aria-labelledby="empty-sheet-sheets-heading">
          <div className="flex items-center justify-between">
            <h3
              id="empty-sheet-sheets-heading"
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

export function DrawingTriageProjectEmptyState({
  projectName,
  onOpenResidentialTowerSample,
}: DrawingTriageProjectEmptyStateProps) {
  return (
    <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:overflow-x-hidden"
    >
      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:border-t max-[900px]:bg-panel-subtle/35 min-[901px]:order-1 min-[901px]:border-r">
        <DrawingTriageNoDrawingPackagePanel projectName={projectName} />
      </aside>

      <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-canvas max-[900px]:min-h-[360px] max-[560px]:min-h-[300px] min-[901px]:order-2">
        <DrawingTriageHeader
          subtitle={`${projectName} · No drawing package linked`}
        />

        <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
          <section className="w-full max-w-[560px] border border-border bg-panel p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-md border border-border bg-panel-subtle text-primary">
                <FileStack className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">
                  Drawing Triage not configured for this project
                </h2>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  This project is available in the prototype switcher, but no
                  drawing package or triage session is linked to it yet. To
                  review the working AI candidate queue, open the Residential
                  Tower A sample.
                </p>
              </div>
            </div>
            <DrawingTriageWorkflowNote heading="Typical setup" />
            <div className="mt-5">
              <Button
                type="button"
                size="sm"
                onClick={onOpenResidentialTowerSample}
              >
                Open Residential Tower A sample
              </Button>
            </div>
          </section>
        </div>
      </section>

      <DrawingTriageInactiveCandidatePanel message="No drawing package or triage session is linked to this project in the prototype." />
    </main>
  )
}

export function DrawingTriageSheetEmptyState({
  activeDrawingSource,
  activeSheet,
  activeSheetId,
  drawingSheets,
  remainingReviewCount,
  onOpenLevel02Sample,
  onSelectSheet,
}: DrawingTriageSheetEmptyStateProps) {
  return (
    <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:overflow-x-hidden"
    >
      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:border-t max-[900px]:bg-panel-subtle/35 min-[901px]:order-1 min-[901px]:border-r">
        <DrawingTriageStaticSheetPanel
          activeDrawingSource={activeDrawingSource}
          activeSheet={activeSheet}
          activeSheetId={activeSheetId}
          drawingSheets={drawingSheets}
          remainingReviewCount={remainingReviewCount}
          onOpenLevel02Sample={onOpenLevel02Sample}
          onSelectSheet={onSelectSheet}
        />
      </aside>

      <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-canvas max-[900px]:min-h-[360px] max-[560px]:min-h-[300px] min-[901px]:order-2">
        <DrawingTriageHeader
          subtitle={`${activeSheet.code} · ${activeSheet.name} · Not scanned`}
        />

        <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
          <section className="w-full max-w-[560px] border border-border bg-panel p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-md border border-border bg-panel-subtle text-primary">
                <ScanSearch className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">
                  No triage session for this sheet yet
                </h2>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  {activeSheet.name} is part of the drawing set, but this
                  prototype includes a completed AI triage session only for
                  Level 02. Open the Level 02 sample to review the AI candidate
                  queue.
                </p>
              </div>
            </div>
            <DrawingTriageWorkflowNote heading="Typical workflow" />
            <div className="mt-5">
              <Button type="button" size="sm" onClick={onOpenLevel02Sample}>
                Open Level 02 sample
              </Button>
            </div>
          </section>
        </div>
      </section>

      <DrawingTriageInactiveCandidatePanel
        message={`${activeSheet.name} has no completed triage session in this prototype.`}
      />
    </main>
  )
}
