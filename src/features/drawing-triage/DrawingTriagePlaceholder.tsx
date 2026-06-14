import { Bot, FileStack, ScanSearch } from "lucide-react"

export function DrawingTriagePlaceholder() {
  return (
    <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto"
    >
      <aside className="order-2 min-h-[180px] border-r border-border bg-panel p-4 min-[901px]:order-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileStack className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
            Drawing context
          </span>
        </div>
        <h2 className="mt-5 text-sm font-semibold">No drawing selected</h2>
        <p className="mt-2 max-w-[32ch] text-[11px] leading-relaxed text-muted-foreground">
          Uploaded sheets, page identity, and artifact metadata will appear in
          this region in a future phase.
        </p>
        <p className="mt-5 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          Upload, storage, and real file handling are not implemented.
        </p>
      </aside>

      <section className="order-1 flex min-h-[360px] min-w-0 items-center justify-center bg-canvas p-6 min-[901px]:order-2">
        <div className="w-full max-w-xl border border-dashed border-border bg-panel/70 px-6 py-10 text-center">
          <ScanSearch className="mx-auto size-7 text-primary" />
          <h1
            id="drawing-triage-heading"
            className="mt-4 text-base font-semibold tracking-tight"
          >
            Drawing Triage
          </h1>
          <p className="mx-auto mt-2 max-w-[58ch] text-[11px] leading-relaxed text-muted-foreground">
            This bounded workspace proves the mode change only. A 2D drawing
            preview, evidence regions, and drawing interactions are not
            implemented yet.
          </p>
          <p className="mx-auto mt-4 max-w-[58ch] text-[10px] leading-relaxed text-muted-foreground">
            There is no upload, storage, backend behavior, or AI candidate
            generation in this phase.
          </p>
        </div>
      </section>

      <aside className="order-3 min-h-[180px] border-l border-border bg-panel p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
            Candidate review
          </span>
        </div>
        <h2 className="mt-5 text-sm font-semibold">No candidates available</h2>
        <p className="mt-2 max-w-[34ch] text-[11px] leading-relaxed text-muted-foreground">
          Provisional AI findings, evidence, confidence, and human review
          decisions will appear here in a future phase.
        </p>
        <p className="mt-5 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          No AI calls, inference, or decision actions are active.
        </p>
      </aside>
    </main>
  )
}
