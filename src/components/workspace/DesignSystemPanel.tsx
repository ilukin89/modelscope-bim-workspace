import { useEffect, useRef, useState } from "react"
import {
  Bot,
  Box,
  BoxSelect,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDot,
  EyeOff,
  FileStack,
  Hand,
  Layers3,
  LoaderCircle,
  MapPin,
  MessageSquarePlus,
  Orbit,
  Ruler,
  ScanLine,
  TriangleAlert,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { ViewportTool } from "@/features/viewport/types"
import { cn } from "@/lib/utils"

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

type DrawingTriageType = "Clearance" | "Annotation" | "Alignment"
type DrawingTriageDecision = "needs_review" | "issue_created"

const drawingTriageTypeVisuals: Record<
  DrawingTriageType,
  {
    lightAccent: string
    darkAccent: string
    ink: string
  }
> = {
  Clearance: {
    lightAccent: "oklch(0.82 0.1 74.86)",
    darkAccent: "oklch(0.65 0.1 74.1)",
    ink: "oklch(0.18 0.05 72)",
  },
  Annotation: {
    lightAccent: "oklch(0.67 0.07 205)",
    darkAccent: "oklch(0.64 0.07 205)",
    ink: "oklch(0.16 0.035 205)",
  },
  Alignment: {
    lightAccent: "oklch(0.69 0.11 270.41)",
    darkAccent: "oklch(0.69 0.11 270)",
    ink: "oklch(0.18 0.045 270)",
  },
}

function getDrawingTriageAccent(type: DrawingTriageType) {
  const visual = drawingTriageTypeVisuals[type]
  return `light-dark(${visual.lightAccent}, ${visual.darkAccent})`
}

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

      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 max-[680px]:px-4 max-[460px]:py-5">
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

          <div className="relative z-10 max-w-3xl px-6 py-7 max-[460px]:px-4 max-[460px]:py-5">
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
                  onClick={() =>
                    showActionFeedback("Issue created in prototype")
                  }
                >
                  Create issue
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    showActionFeedback("Prototype action cancelled")
                  }
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
                <Button
                  variant="outline"
                  disabled
                  className="disabled:opacity-60"
                >
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
                <div className="relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-foreground/20 bg-card p-1 shadow-lg dark:border-foreground/25 max-[560px]:flex max-[560px]:flex-wrap max-[560px]:overflow-visible">
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
              eyebrow="Navigation"
              title="Tabs and panel links"
              description="Workspace tabs, explorer links, and drawing sheet links share compact selected and unselected states."
            >
              <div className="grid gap-3">
                <WorkspaceTabsSpecimen />
                <div className="grid grid-cols-[repeat(auto-fit,minmax(248px,1fr))] gap-3">
                  <ModelExplorerLinkSpecimen />
                  <DrawingContextLinkSpecimen />
                </div>
              </div>
            </SystemSection>

            <SystemSection
              index="05"
              eyebrow="Model tree"
              title="Object states"
              description="One row vocabulary is shared across model trees, search results, and selection sets."
            >
              <div className="divide-y divide-foreground/15 overflow-hidden border border-foreground/20 bg-card shadow-sm dark:divide-foreground/20 dark:border-foreground/25">
                <ObjectState
                  label="Default object"
                  detail="Wall · Basic 200 mm"
                />
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
              index="06"
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

            <SystemSection
              index="07"
              eyebrow="Drawing triage"
              title="Review candidate cards"
              description="Candidate observations use type color for category, compact decision state, and quiet human review actions."
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(292px,292px))] gap-3">
                <DrawingTriageCardSpecimen
                  marker={1}
                  type="Clearance"
                  decision="needs_review"
                  title="Door swing near circulation path"
                  summary="The meeting-room door arc appears close to the main corridor clearance zone."
                  location="Grid C4 · Meeting 02"
                />
                <DrawingTriageCardSpecimen
                  marker={2}
                  type="Annotation"
                  decision="issue_created"
                  title="Riser annotation may be incomplete"
                  summary="A service riser is drawn without a matching keynote on this sheet excerpt."
                  location="Grid D2 · Core"
                />
                <DrawingTriageCardSpecimen
                  marker={3}
                  type="Alignment"
                  decision="needs_review"
                  title="Partition alignment differs at grid line"
                  summary="The north partition appears offset from the adjacent structural grid reference."
                  location="Grid B1 · Open office"
                  followUp
                />
              </div>
            </SystemSection>
          </div>

          <div className="space-y-12">
            <SystemSection
              index="08"
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
              index="09"
              eyebrow="Drawing triage"
              title="Candidate type palette"
              description="Type accents identify the candidate category. Decision and follow-up states reuse the same type color with different emphasis."
            >
              <div className="grid gap-2">
                {(
                  [
                    "Clearance",
                    "Annotation",
                    "Alignment",
                  ] as DrawingTriageType[]
                ).map((type) => (
                  <DrawingTriageTypeSpecimen key={type} type={type} />
                ))}
              </div>
            </SystemSection>

            <SystemSection
              index="10"
              eyebrow="Status language"
              title="Badges"
              description="Compact labels communicate model and workflow state without competing with the viewport."
            >
              <div className="flex flex-wrap gap-2 border-y border-foreground/20 bg-card px-3 py-4 shadow-sm dark:border-foreground/25">
                <Badge>Selected</Badge>
                <Badge
                  variant="secondary"
                  className="border border-foreground/10"
                >
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
              index="11"
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
                    <p className="text-[11px] font-semibold">
                      Supply Duct 400 × 250
                    </p>
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
                    onClick={() =>
                      showActionFeedback("Object inspected in prototype")
                    }
                  >
                    Inspect
                  </Button>
                  <Button
                    size="compact"
                    variant="outline"
                    onClick={() =>
                      showActionFeedback("Object isolated in prototype")
                    }
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

function WorkspaceTabsSpecimen() {
  const modes = ["Model Review", "Drawing Triage"]

  return (
    <Card className="overflow-hidden rounded-md border-foreground/20 bg-card shadow-sm dark:border-foreground/25">
      <CardHeader className="border-b border-foreground/15 p-3 dark:border-foreground/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold">Workspace tabs</p>
            <p className="mt-1 text-[10px] text-foreground/65">
              Desktop tablist and compact mobile selector states.
            </p>
          </div>
          <Badge variant="outline" className="text-foreground/70">
            Desktop / mobile
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-3">
        <div>
          <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/55">
            Desktop
          </p>
          <div
            className="flex h-12 items-center border border-border bg-panel px-2"
            role="tablist"
            aria-label="Workspace mode example"
          >
            {modes.map((mode, index) => {
              const active = index === 0

              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "relative flex h-full items-center px-3 text-[11px] font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    active
                      ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {mode}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/55">
            Mobile
          </p>
          <div className="grid max-w-[220px] gap-1.5 border border-border bg-panel p-2">
            <button
              type="button"
              aria-label="Workspace mode: Model Review"
              className="flex h-8 min-w-0 items-center gap-1.5 px-2 text-[11px] font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">Model Review</span>
              <ChevronDown className="ml-auto size-3 shrink-0" />
            </button>
            <div className="border-t border-border pt-1">
              {modes.map((mode, index) => (
                <div
                  key={mode}
                  aria-current={index === 0 ? "page" : undefined}
                  className="flex h-8 items-center gap-2 rounded-sm px-2 text-xs text-foreground hover:bg-muted"
                >
                  {mode}
                  {index === 0 && <Check className="ml-auto size-3.5" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ModelExplorerLinkSpecimen() {
  return (
    <Card className="overflow-hidden rounded-md border-foreground/20 bg-panel shadow-sm dark:border-foreground/25">
      <CardHeader className="border-b border-border p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Model Explorer
          </span>
          <Badge variant="outline" className="text-[9px]">
            Links
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-muted-foreground">
          <Box className="size-3.5" />
          <span className="truncate">Federated Model</span>
          <span className="ml-auto font-mono text-[10px]">3.270</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        <div>
          <ExplorerSpecimenHeading icon={Layers3} title="Floors" count="5" />
          <div className="mt-2 space-y-0.5">
            <ModelExplorerFloorLink label="Level 08" count="516" selected />
            <ModelExplorerFloorLink label="Level 07" count="498" />
          </div>
        </div>
        <div>
          <ExplorerSpecimenHeading
            icon={CircleDot}
            title="Open Issues"
            count="3"
          />
          <div className="mt-2 space-y-1">
            <ModelExplorerIssueLink
              code="ISS-824"
              label="Beam intersects supply duct"
              severity="critical"
              selected
            />
            <ModelExplorerIssueLink
              code="ISS-831"
              label="Door clearance below 900 mm"
              severity="warning"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DrawingContextLinkSpecimen() {
  return (
    <Card className="overflow-hidden rounded-md border-foreground/20 bg-panel shadow-sm dark:border-foreground/25">
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileStack className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
            Drawing context
          </span>
        </div>
        <p className="mt-4 text-sm font-semibold">Level 02 floor plan</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          A-102 · Coordination issue set
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Sheets
          </h3>
          <span className="text-[10px] text-muted-foreground">1 of 3</span>
        </div>
        <div className="mt-2 space-y-1">
          <DrawingSheetLink
            code="02"
            title="Level 02 floor plan"
            detail="2 awaiting decision"
            selected
          />
          <DrawingSheetLink code="01" title="Level 01 floor plan" />
          <DrawingSheetLink code="R" title="Roof plan" />
        </div>
      </CardContent>
    </Card>
  )
}

function ExplorerSpecimenHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Layers3
  title: string
  count: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{count}</span>
    </div>
  )
}

function ModelExplorerFloorLink({
  label,
  count,
  selected,
}: {
  label: string
  count: string
  selected?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-sm px-2 text-left text-[11px] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-accent text-accent-foreground",
      )}
    >
      <ChevronRight className="size-3 text-muted-foreground" />
      <span className="truncate">{label}</span>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
        {count}
      </span>
    </button>
  )
}

function ModelExplorerIssueLink({
  code,
  label,
  severity,
  selected,
}: {
  code: string
  label: string
  severity: "critical" | "warning"
  selected?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "w-full rounded-sm border p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary/45 bg-accent"
          : "border-transparent hover:border-border hover:bg-muted",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            severity === "critical" ? "bg-destructive" : "bg-warning",
          )}
        />
        <span className="font-mono text-[9px] text-muted-foreground">
          {code}
        </span>
        <Badge
          variant={severity === "critical" ? "destructive" : "warning"}
          className="ml-auto px-1 py-0 text-[8px] uppercase"
        >
          {severity}
        </Badge>
      </div>
      <p className="mt-1 truncate text-[10px] font-medium">{label}</p>
    </button>
  )
}

function DrawingSheetLink({
  code,
  title,
  detail,
  selected,
}: {
  code: string
  title: string
  detail?: string
  selected?: boolean
}) {
  if (selected) {
    return (
      <button
        type="button"
        aria-current="page"
        className="flex w-full items-center gap-2 rounded-sm bg-accent px-2.5 py-2 text-left text-[11px] text-accent-foreground outline-none ring-ring focus-visible:ring-2"
      >
        <span className="flex size-5 items-center justify-center rounded-sm bg-primary text-[9px] font-bold text-primary-foreground">
          {code}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          {detail && (
            <span className="block text-[9px] opacity-75">{detail}</span>
          )}
        </span>
        <Check className="size-3.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] text-muted-foreground">
      <span className="flex size-5 items-center justify-center rounded-sm bg-muted text-[9px] font-bold">
        {code}
      </span>
      {title}
    </div>
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
          {state === "focus"
            ? "Hover / focus"
            : state === "active"
              ? "Opened"
              : "Default"}
        </span>
        {state === "active" && (
          <span className="size-1.5 rounded-full bg-ai shadow-[0_0_0_3px_color-mix(in_oklab,var(--ai)_18%,transparent)]" />
        )}
      </div>
      <Button
        variant="outline"
        aria-label="Open AI review findings"
        aria-expanded={state === "active"}
        className={cn(
          "group h-auto min-h-[76px] w-full justify-start gap-2 rounded-lg border border-ai/70 bg-[color-mix(in_oklab,var(--ai)_34%,var(--panel)_66%)] px-3 py-2 text-left shadow-[0_16px_42px_color-mix(in_oklab,var(--background)_72%,transparent)]",
          state === "focus" &&
            "border-ai bg-[color-mix(in_oklab,var(--ai)_42%,var(--panel)_58%)] ring-2 ring-ai ring-offset-2 ring-offset-canvas",
          state === "active" &&
            "border-ai bg-[color-mix(in_oklab,var(--ai)_48%,var(--panel)_52%)] ring-2 ring-ai/35",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-tight tracking-tight text-foreground">
            AI Review
          </span>
          <span className="mt-1.5 block text-[11px] font-semibold leading-none text-ai-foreground">
            3 coordination findings
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">
            <span className="text-destructive">1 critical</span>
            <span className="size-1 rounded-full bg-muted-foreground/70" />
            <span className="text-warning-foreground">1 warning</span>
            <span className="size-1 rounded-full bg-muted-foreground/70" />
            <span className="text-primary">1 info</span>
          </span>
        </span>
        <ChevronRight
          className={cn(
            "ml-auto size-5 shrink-0 text-foreground/75",
            state === "active" && "rotate-90 text-ai-foreground",
          )}
          aria-hidden="true"
        />
      </Button>
      {state === "active" && (
        <div className="mt-2 border-t border-ai/40 pt-2 text-[10px] font-medium text-foreground/70">
          Findings panel open
        </div>
      )}
    </div>
  )
}

function DrawingTriageCardSpecimen({
  marker,
  type,
  decision,
  title,
  summary,
  location,
  followUp,
}: {
  marker: number
  type: DrawingTriageType
  decision: DrawingTriageDecision
  title: string
  summary: string
  location: string
  followUp?: boolean
}) {
  const visual = drawingTriageTypeVisuals[type]
  const accent = getDrawingTriageAccent(type)
  const issueCreated = decision === "issue_created"

  return (
    <Card
      className="relative overflow-hidden rounded-sm border bg-card shadow-sm"
      style={{
        borderColor: "var(--border)",
        borderLeftColor: accent,
        borderLeftWidth: "3px",
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              background: accent,
              color: visual.ink,
            }}
          >
            {marker}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "flex flex-wrap items-center gap-2",
                followUp && "pr-8",
              )}
            >
              <DrawingTriageTypeChip type={type} />
              <DrawingTriageDecisionChip type={type} decision={decision} />
            </div>
          </div>
        </div>

        {followUp && (
          <span
            aria-label="Follow-up flag active"
            className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md border bg-card"
            style={{
              borderColor: `color-mix(in oklab, ${accent} 60%, var(--border))`,
              background: `color-mix(in oklab, ${accent} 9%, var(--card))`,
              color: `color-mix(in oklab, ${accent} 68%, var(--foreground))`,
            }}
          >
            <Bookmark className="size-4 fill-current" />
          </span>
        )}

        <h3 className="mt-4 text-[13px] font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {summary}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
          <MapPin className="size-3" style={{ color: accent }} />
          {location}
        </div>
      </CardContent>

      {issueCreated && (
        <div
          className="mx-4 flex items-start gap-1.5 border-t border-border/70 py-2.5 text-[9px] font-medium leading-relaxed"
          style={{
            color: `color-mix(in oklab, ${accent} 68%, var(--foreground))`,
          }}
        >
          <TriangleAlert className="mt-px size-3 shrink-0" />
          <span>Issue created by user (username) on DD/MM/YY, hh:mm</span>
        </div>
      )}

      <div
        className="grid gap-2 border-t border-border/60 p-4 pt-3"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none"
          style={{
            borderColor: issueCreated
              ? `color-mix(in oklab, ${accent} 22%, var(--border))`
              : accent,
            background: issueCreated ? "var(--card)" : accent,
            color: issueCreated
              ? `light-dark(var(--foreground), color-mix(in oklab, var(--foreground) 88%, ${accent}))`
              : visual.ink,
            boxShadow: undefined,
          }}
        >
          {issueCreated ? (
            <X className="size-4" />
          ) : (
            <TriangleAlert className="size-4" />
          )}
          {issueCreated ? "Remove issue" : "Convert to issue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none"
          style={{
            borderColor: followUp
              ? `color-mix(in oklab, ${accent} 42%, var(--border))`
              : `color-mix(in oklab, ${accent} 76%, var(--border))`,
            background: followUp
              ? `color-mix(in oklab, ${accent} 5%, var(--card))`
              : `color-mix(in oklab, ${accent} 24%, var(--card))`,
            color: followUp
              ? `color-mix(in oklab, ${accent} 64%, var(--foreground))`
              : `color-mix(in oklab, ${accent} 82%, var(--foreground))`,
            boxShadow: followUp
              ? `inset 0 0 0 1px color-mix(in oklab, ${accent} 18%, transparent)`
              : `inset 0 0 0 1px color-mix(in oklab, ${accent} 16%, transparent)`,
          }}
        >
          <Bookmark className={cn("size-4", followUp && "fill-current")} />
          {followUp ? "Remove from follow-up" : "Keep for follow-up"}
        </Button>
      </div>
    </Card>
  )
}

function DrawingTriageTypeChip({ type }: { type: DrawingTriageType }) {
  const visual = drawingTriageTypeVisuals[type]
  const accent = getDrawingTriageAccent(type)

  return (
    <span
      className="rounded-[5px] px-2 py-1 text-[10px] font-bold leading-none"
      style={{
        background: accent,
        color: visual.ink,
      }}
    >
      Type: {type}
    </span>
  )
}

function DrawingTriageDecisionChip({
  type,
  decision,
}: {
  type: DrawingTriageType
  decision: DrawingTriageDecision
}) {
  const visual = drawingTriageTypeVisuals[type]
  const accent = getDrawingTriageAccent(type)
  const issueCreated = decision === "issue_created"

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-semibold leading-none"
      style={{
        background: issueCreated
          ? accent
          : `color-mix(in oklab, ${accent} 13%, var(--card))`,
        color: issueCreated
          ? visual.ink
          : `color-mix(in oklab, ${accent} 58%, var(--foreground))`,
      }}
    >
      {issueCreated && <TriangleAlert className="size-3" />}
      {issueCreated ? "Issue created" : "Needs review"}
    </span>
  )
}

function DrawingTriageTypeSpecimen({ type }: { type: DrawingTriageType }) {
  const visual = drawingTriageTypeVisuals[type]
  const accent = getDrawingTriageAccent(type)

  return (
    <Card className="overflow-hidden rounded-md border-foreground/20 bg-card shadow-sm dark:border-foreground/25">
      <div
        className="h-12 border-b border-foreground/20 dark:border-foreground/25"
        style={{ background: accent }}
      />
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold">{type}</span>
          <span
            className="rounded-[5px] px-2 py-1 text-[10px] font-bold leading-none"
            style={{
              background: accent,
              color: visual.ink,
            }}
          >
            Type chip
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-foreground/70">
          Used for marker fill, type chip, issue-created fill, and follow-up
          accents. Filled type UI uses dark ink, never white text.
        </p>
      </CardContent>
    </Card>
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
