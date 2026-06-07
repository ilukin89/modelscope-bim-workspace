import { useEffect, useRef, useState } from "react"
import {
  Bot,
  BoxSelect,
  Check,
  CircleAlert,
  EyeOff,
  Hand,
  LoaderCircle,
  MessageSquarePlus,
  Orbit,
  Ruler,
  ScanLine,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ViewportTool } from "@/types"

const tokens = [
  {
    name: "Canvas",
    variable: "--canvas",
    className: "bg-canvas",
    purpose: "3D workspace field",
  },
  {
    name: "Panel",
    variable: "--panel",
    className: "bg-panel",
    purpose: "Inspector and explorer surfaces",
  },
  {
    name: "Selected",
    variable: "--selected",
    className: "bg-selected",
    purpose: "Active model selection",
  },
  {
    name: "Warning",
    variable: "--warning",
    className: "bg-warning",
    purpose: "Coordination review needed",
  },
  {
    name: "Critical",
    variable: "--destructive",
    className: "bg-destructive",
    purpose: "Hard clash or blocked path",
  },
  {
    name: "AI Suggestion",
    variable: "--ai",
    className: "bg-ai",
    purpose: "Machine-assisted finding",
  },
]

const viewportTools = [
  { label: "Orbit", icon: Orbit },
  { label: "Pan", icon: Hand },
  { label: "Section", icon: BoxSelect },
  { label: "Measure", icon: Ruler },
  { label: "Comment", icon: MessageSquarePlus },
] satisfies Array<{ label: ViewportTool; icon: typeof Orbit }>

export function DesignSystemPanel() {
  const [activeExampleTool, setActiveExampleTool] =
    useState<ViewportTool>("Orbit")
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const actionFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  useEffect(
    () => () => {
      if (actionFeedbackTimeout.current) {
        clearTimeout(actionFeedbackTimeout.current)
      }
    },
    [],
  )

  const showActionFeedback = (message: string) => {
    setActionFeedback(message)
    if (actionFeedbackTimeout.current) {
      clearTimeout(actionFeedbackTimeout.current)
    }
    actionFeedbackTimeout.current = setTimeout(
      () => setActionFeedback(null),
      2000,
    )
  }

  return (
    <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-card text-foreground">
      {actionFeedback && (
        <div
          className="fixed bottom-8 right-8 z-50 rounded-md border border-border bg-panel px-3 py-2 text-[11px] font-medium shadow-lg"
          role="status"
          aria-live="polite"
          data-testid="design-system-action-feedback"
        >
          {actionFeedback}
        </div>
      )}

      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 max-[680px]:px-4">
        <header className="relative overflow-hidden border-y border-foreground/20 bg-card shadow-sm dark:border-foreground/25">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] border-l border-foreground/20 bg-canvas dark:border-foreground/25 lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(var(--canvas-grid)_1px,transparent_1px),linear-gradient(90deg,var(--canvas-grid)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative size-32">
                <div className="absolute left-1/2 top-2 h-24 w-px bg-primary/60" />
                <div className="absolute left-4 top-1/2 h-px w-24 bg-primary/60" />
                <div className="absolute inset-5 rotate-45 border border-primary/45" />
                <div className="absolute inset-9 rotate-45 bg-primary/10" />
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-3xl px-6 py-7">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <ScanLine className="size-3.5" />
              Product UI foundations · v0.1
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ModelScope design system
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-foreground/75">
              A practical reference for model review controls, semantic states,
              and viewport-first coordination workflows.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/65">
              {["Viewport-first", "shadcn/ui", "WCAG AA", "Code-first"].map(
                (item, index) => (
                  <span key={item} className="flex items-center gap-3">
                    {index > 0 && (
                      <span className="size-1 rounded-full bg-foreground/25" />
                    )}
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-x-10 gap-y-12 max-[900px]:grid-cols-1">
          <div className="space-y-12">
            <SystemSection
              index="01"
              eyebrow="Workflow"
              title="Actions"
              description="Committed coordination actions use stronger emphasis. Supporting operations remain quiet and compact."
            >
              <div className="flex flex-wrap items-center gap-2 border-y border-foreground/20 bg-card px-3 py-4 shadow-sm dark:border-foreground/25">
                <Button
                  onClick={() =>
                    showActionFeedback("Changes applied in prototype")
                  }
                >
                  Apply changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => showActionFeedback("Issue created in prototype")}
                >
                  Create issue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showActionFeedback("Prototype action cancelled")}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => showActionFeedback("Prototype details opened")}
                >
                  View details
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="border-border bg-muted text-muted-foreground shadow-none disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-muted"
                >
                  Unavailable
                </Button>
                <Button variant="outline" disabled className="disabled:opacity-60">
                  <LoaderCircle className="animate-spin" />
                  Syncing
                </Button>
              </div>
            </SystemSection>

            <SystemSection
              index="02"
              eyebrow="Coordination"
              title="Issue severity"
              description="Severity combines icon, label, and semantic color so model risk never depends on color alone."
            >
              <div className="grid grid-cols-3 gap-px overflow-hidden border border-foreground/20 bg-foreground/20 shadow-sm dark:border-foreground/25 dark:bg-foreground/25 max-[560px]:grid-cols-1">
                <SeverityState
                  icon={CircleAlert}
                  label="Critical"
                  detail="Hard clash or blocked path"
                  code="P0"
                  className="text-destructive"
                />
                <SeverityState
                  icon={TriangleAlert}
                  label="Warning"
                  detail="Review before coordination"
                  code="P1"
                  className="text-warning"
                />
                <SeverityState
                  icon={Check}
                  label="Resolved"
                  detail="Accepted or corrected"
                  code="OK"
                  className="text-success"
                />
              </div>
            </SystemSection>

            <SystemSection
              index="03"
              eyebrow="Viewport"
              title="Navigation tools"
              description="The active tool owns the strongest state while model geometry remains the primary visual signal."
            >
              <div className="relative overflow-hidden border border-foreground/20 bg-canvas p-5 shadow-sm dark:border-foreground/25">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--canvas-grid)_1px,transparent_1px),linear-gradient(90deg,var(--canvas-grid)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-foreground/20 bg-card p-1 shadow-lg dark:border-foreground/25">
                  {viewportTools.map(({ label, icon: Icon }) => {
                    const active = activeExampleTool === label
                    return (
                      <button
                        type="button"
                        key={label}
                        aria-pressed={active}
                        onClick={() => setActiveExampleTool(label)}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-sm px-3 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/70 hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    )
                  })}
                </div>
                <div className="relative mt-5 flex items-center gap-2 text-[10px] font-medium text-foreground/70">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Active mode
                  <span className="font-mono text-foreground">
                    {activeExampleTool}
                  </span>
                </div>
              </div>
            </SystemSection>

            <SystemSection
              index="04"
              eyebrow="Model tree"
              title="Object states"
              description="One row vocabulary is shared across model trees, search results, and selection sets."
            >
              <div className="divide-y divide-foreground/15 overflow-hidden border border-foreground/20 bg-card shadow-sm dark:divide-foreground/20 dark:border-foreground/25">
                <ObjectState label="Default object" detail="Wall · Basic 200 mm" />
                <ObjectState
                  label="Selected object"
                  detail="Supply Duct · 400 × 250"
                  selected
                />
                <ObjectState
                  label="Hidden object"
                  detail="Cable Tray · CT-120"
                  hidden
                />
                <ObjectState
                  label="Object with issue"
                  detail="Beam · B-08-042"
                  issue
                />
              </div>
            </SystemSection>

            <SystemSection
              index="05"
              eyebrow="Assisted review"
              title="AI Review component"
              description="A dedicated findings entry point remains distinct from navigation tools and exposes its state without chatbot styling."
            >
              <div className="grid grid-cols-3 gap-px border border-foreground/20 bg-foreground/20 shadow-sm dark:border-foreground/25 dark:bg-foreground/25 max-[760px]:grid-cols-1">
                <AiReviewSpecimen state="default" />
                <AiReviewSpecimen state="focus" />
                <AiReviewSpecimen state="active" />
              </div>
            </SystemSection>
          </div>

          <div className="space-y-12">
            <SystemSection
              index="06"
              eyebrow="Foundations"
              title="Semantic tokens"
              description="Theme-aware roles connect the viewport, panels, selections, issue states, and AI assistance."
            >
              <div className="grid grid-cols-2 gap-2 max-[460px]:grid-cols-1">
                {tokens.map((token) => (
                  <Card
                    key={token.name}
                    className="overflow-hidden rounded-md border-foreground/20 bg-card shadow-sm dark:border-foreground/25"
                  >
                    <div
                      className={cn(
                        "h-12 border-b border-foreground/20 dark:border-foreground/25",
                        token.className,
                      )}
                    >
                      <div className="h-full bg-[linear-gradient(135deg,transparent_48%,color-mix(in_oklab,var(--foreground)_12%,transparent)_49%,color-mix(in_oklab,var(--foreground)_12%,transparent)_51%,transparent_52%)]" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold">
                          {token.name}
                        </span>
                        <code className="text-[10px] font-medium text-foreground/60">
                          {token.variable}
                        </code>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-foreground/70">
                        {token.purpose}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </SystemSection>

            <SystemSection
              index="07"
              eyebrow="Status language"
              title="Badges"
              description="Compact labels communicate model and workflow state without competing with the viewport."
            >
              <div className="flex flex-wrap gap-2 border-y border-foreground/20 bg-card px-3 py-4 shadow-sm dark:border-foreground/25">
                <Badge>Selected</Badge>
                <Badge variant="secondary" className="border border-foreground/10">
                  In review
                </Badge>
                <Badge variant="success" className="border-success/45">
                  Synced
                </Badge>
                <Badge variant="warning" className="border-warning/45">
                  Warning
                </Badge>
                <Badge variant="destructive" className="border-destructive/45">
                  Critical
                </Badge>
                <Badge variant="ai" className="border-ai/45">
                  <Bot className="size-3" />
                  AI suggestion
                </Badge>
                <Badge variant="outline" className="text-foreground/70">
                  Draft
                </Badge>
              </div>
            </SystemSection>

            <SystemSection
              index="08"
              eyebrow="Inspector"
              title="Panel anatomy"
              description="Compact regions separate identity, issue state, properties, and actions without nested decoration."
            >
              <Card className="overflow-hidden rounded-md border-foreground/20 bg-card shadow-sm dark:border-foreground/25">
                <CardHeader className="flex-row items-center space-y-0 border-b border-foreground/20 px-3 py-3 dark:border-foreground/25">
                  <div className="flex size-8 items-center justify-center rounded-sm bg-accent font-mono text-[10px] font-bold text-accent-foreground">
                    MEP
                  </div>
                  <div className="ml-2">
                    <p className="text-[11px] font-semibold">Supply Duct 400 × 250</p>
                    <p className="font-mono text-[10px] text-foreground/65">
                      8D4F-21A7
                    </p>
                  </div>
                  <Badge variant="warning" className="ml-auto">
                    1 issue
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <PropertyRow label="Category" value="Mechanical Duct" />
                  <PropertyRow label="Level" value="Level 08" />
                  <PropertyRow label="System" value="Supply Air" />
                </CardContent>
                <CardFooter className="gap-2 border-t border-foreground/20 p-3 dark:border-foreground/25">
                  <Button
                    size="compact"
                    onClick={() => showActionFeedback("Object inspected in prototype")}
                  >
                    Inspect
                  </Button>
                  <Button
                    size="compact"
                    variant="outline"
                    onClick={() => showActionFeedback("Object isolated in prototype")}
                  >
                    Isolate
                  </Button>
                </CardFooter>
              </Card>
            </SystemSection>
          </div>
        </div>
      </div>
    </main>
  )
}

function SystemSection({
  index,
  eyebrow,
  title,
  description,
  children,
}: {
  index: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-t border-foreground/20 pt-4 dark:border-foreground/25">
        <span className="font-mono text-[10px] font-bold text-primary">
          {index}
        </span>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-sm font-semibold">{title}</h2>
          <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-foreground/72">
            {description}
          </p>
        </div>
      </div>
      <div className="ml-[48px] max-[560px]:ml-0">{children}</div>
    </section>
  )
}

function SeverityState({
  icon: Icon,
  label,
  detail,
  code,
  className,
}: {
  icon: typeof CircleAlert
  label: string
  detail: string
  code: string
  className: string
}) {
  return (
    <Card className="rounded-none border-0 bg-card p-3 shadow-none">
      <div className="flex items-start justify-between">
        <Icon className={cn("size-4", className)} />
        <span className="font-mono text-[10px] font-semibold text-foreground/60">
          {code}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold">{label}</p>
      <p className="mt-1 text-[10px] text-foreground/70">{detail}</p>
    </Card>
  )
}

function AiReviewSpecimen({
  state,
}: {
  state: "default" | "focus" | "active"
}) {
  return (
    <div className="bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/65">
          {state === "focus" ? "Hover / focus" : state === "active" ? "Opened" : "Default"}
        </span>
        {state === "active" && (
          <span className="size-1.5 rounded-full bg-ai shadow-[0_0_0_3px_color-mix(in_oklab,var(--ai)_18%,transparent)]" />
        )}
      </div>
      <Button
        variant="outline"
        className={cn(
          "h-auto w-full justify-start gap-2.5 border-ai/50 bg-card px-3 py-2 text-left shadow-md",
          state === "focus" &&
            "border-ai/60 bg-ai/8 ring-2 ring-ai ring-offset-2 ring-offset-canvas",
          state === "active" && "border-ai/60 bg-ai/12",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-ai/25 bg-ai/12 text-ai-foreground">
          <Bot className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold leading-tight">
            AI Review
          </span>
          <span className="mt-1 block font-mono text-[10px] leading-none text-ai-foreground">
            3 findings
          </span>
        </span>
      </Button>
      {state === "active" && (
        <div className="mt-2 border-t border-ai/40 pt-2 text-[10px] font-medium text-foreground/70">
          Findings panel open
        </div>
      )}
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-foreground/15 px-3 py-2 text-[10px] last:border-b-0 dark:border-foreground/20">
      <span className="text-foreground/65">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function ObjectState({
  label,
  detail,
  selected,
  hidden,
  issue,
}: {
  label: string
  detail: string
  selected?: boolean
  hidden?: boolean
  issue?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        selected && "bg-accent",
        hidden && "opacity-70",
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full bg-muted-foreground",
          selected && "bg-selected",
          issue && "bg-destructive",
        )}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-medium">{label}</p>
        <p className="truncate text-[10px] text-foreground/65">{detail}</p>
      </div>
      {hidden && <EyeOff className="ml-auto size-3.5 text-foreground/60" />}
      {issue && (
        <Badge variant="destructive" className="ml-auto">
          Issue
        </Badge>
      )}
      {selected && (
        <Badge variant="default" className="ml-auto">
          Selected
        </Badge>
      )}
    </div>
  )
}
