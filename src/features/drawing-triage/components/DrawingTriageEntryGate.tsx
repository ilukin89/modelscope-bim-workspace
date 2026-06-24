import {
  Bot,
  Check,
  Circle,
  FileStack,
  FileText,
  LoaderCircle,
  ScanSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DrawingSource, TriageStage } from "../types"

type DrawingTriageEntryGateProps = {
  stage: Exclude<TriageStage, "review">
  drawingSource: DrawingSource | null
  onUseSampleDrawing: (source: DrawingSource) => void
  onSelectMockFile: (source: DrawingSource) => void
  onRunTriage: () => void
  onChangeDrawing: () => void
}

export function DrawingTriageEntryGate({
  stage,
  drawingSource,
  onUseSampleDrawing,
  onSelectMockFile,
  onRunTriage,
  onChangeDrawing,
}: DrawingTriageEntryGateProps) {
  const drawingSummary =
    "A-102 Level 02 floor plan · Rev P03 · 1:100 · Architecture"
  const scanningSteps = [
    "Detecting visual cues",
    "Checking drawing context",
    "Preparing review candidates",
  ]

  return (
    <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:overflow-x-hidden"
    >
      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:border-t max-[900px]:bg-panel-subtle/35 min-[901px]:order-1 min-[901px]:border-r">
        <div className="border-border p-4 max-[900px]:p-3 min-[901px]:border-b">
          <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileStack className="size-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                Drawing context
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold max-[900px]:mt-2">
              {drawingSource ? "Level 02 floor plan" : "No artifact loaded"}
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {drawingSource
                ? "A-102 · Rev P03 · 1:100 · Architecture"
                : "Waiting for a local demo drawing selection."}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-4 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px] max-[900px]:space-y-3 max-[900px]:p-3 max-[900px]:pt-0">
          <section aria-labelledby="intake-heading">
            <h3
              id="intake-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Intake
            </h3>
            <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-2 text-[11px]">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium">{drawingSource ?? "Not selected"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {stage === "empty" && "Waiting"}
                {stage === "selected" && "Ready to scan"}
                {stage === "scanning" && "Scanning"}
              </dd>
              <dt className="text-muted-foreground">Processing</dt>
              <dd>Mock/local only</dd>
            </dl>
          </section>

          <div className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Frontend demo only. No upload, storage, parsing, backend service, or
            AI API is active.
          </div>
        </div>
      </aside>

      <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-canvas max-[900px]:min-h-[360px] max-[560px]:min-h-[300px] min-[901px]:order-2">
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
              Local drawing intake
            </p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
          <section
            aria-live={stage === "scanning" ? "polite" : undefined}
            className="w-full max-w-[520px] border border-border bg-panel p-5 shadow-sm"
          >
            {stage === "empty" && (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md border border-border bg-panel-subtle text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">
                      No drawing selected
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      Select a sample drawing or mock upload a drawing to run AI
                      triage.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onUseSampleDrawing("Sample drawing")}
                  >
                    Use sample drawing
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectMockFile("Mock file")}
                  >
                    Select mock file
                  </Button>
                </div>
                <p className="mt-4 text-[10px] font-medium text-muted-foreground">
                  Frontend demo only · no real upload or storage yet
                </p>
              </>
            )}

            {stage === "selected" && (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-md border border-border bg-accent text-accent-foreground">
                    <Check className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">
                      Drawing selected
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {drawingSummary}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Source: {drawingSource}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={onRunTriage}>
                    Run AI triage
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onChangeDrawing}
                  >
                    Change drawing
                  </Button>
                </div>
              </>
            )}

            {stage === "scanning" && (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-md border border-border bg-panel-subtle text-primary">
                    <LoaderCircle className="size-4 animate-spin" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">
                      AI triage in progress
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {drawingSummary}
                    </p>
                  </div>
                </div>
                <ol className="mt-5 space-y-2">
                  {scanningSteps.map((step) => (
                    <li
                      key={step}
                      className="flex items-center gap-2 text-[12px] font-medium text-foreground"
                    >
                      <Circle className="size-2.5 fill-primary text-primary" />
                      {step}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </div>
      </section>

      <aside className="scrollbar-thin order-2 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:border-t min-[901px]:order-3 min-[901px]:border-l">
        <div className="border-b border-border p-4">
          <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="size-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                AI triage
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold">
              {stage === "empty" && "Waiting for drawing input"}
              {stage === "selected" && "Ready to run local triage"}
              {stage === "scanning" && "Preparing review candidates"}
            </h2>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Candidate markers and issue controls appear only after the mock
              scan completes.
            </p>
          </div>
        </div>
        <div className="mx-3 mt-3 border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground max-[900px]:mx-auto max-[900px]:w-[calc(100%-1.5rem)] max-[900px]:max-w-[696px]">
          No review candidates, created issues, or follow-up filters are shown
          before review.
        </div>
      </aside>
    </main>
  )
}
