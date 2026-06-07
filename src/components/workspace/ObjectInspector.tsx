import { useEffect, useRef, useState } from "react"
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InspectorTab, ReviewIssue } from "@/types"
import { cn } from "@/lib/utils"

interface ObjectInspectorProps {
  activeTab: InspectorTab
  selectedIssue: ReviewIssue
  selectedObjectVisible: boolean
  issues: ReviewIssue[]
  onIssueSelect: (issue: ReviewIssue) => void
  onTabChange: (tab: InspectorTab) => void
}

const reviewContent = {
  duct: {
    suggestion:
      "Shift this duct 180 mm south and lower it by 60 mm. The proposed route preserves the required beam clearance and avoids the cable tray in Zone C.",
    confidence: 86,
    checks: [
      ["Clash detection", "1 hard clash found", true],
      ["Access clearance", "600 mm maintained", false],
      ["System continuity", "No breaks detected", false],
    ] as const,
  },
  door: {
    suggestion:
      "Reverse the door swing and move the frame 120 mm east. This restores the required 900 mm clear opening without changing the corridor wall.",
    confidence: 79,
    checks: [
      ["Clear opening", "842 mm available", true],
      ["Swing conflict", "Furniture zone detected", true],
      ["Fire compartment", "EI30 requirement maintained", false],
    ] as const,
  },
  damper: {
    suggestion:
      "Assign the FD-300 fire-damper type and link it to the Level 07 smoke extract system before the next coordination issue.",
    confidence: 91,
    checks: [
      ["Classification", "Fire rating is missing", true],
      ["System continuity", "Smoke extract connected", false],
      ["Access clearance", "Inspection zone maintained", false],
    ] as const,
  },
}

export function ObjectInspector({
  activeTab,
  selectedIssue,
  selectedObjectVisible,
  issues,
  onIssueSelect,
  onTabChange,
}: ObjectInspectorProps) {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const actionFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const details = selectedIssue.details
  const properties = [
    ["Category", details.category],
    ["System", details.system],
    ["Type", details.type],
    ["Level", details.level],
    ["Elevation", details.elevation],
    ["Material", details.material],
    ["Fire Rating", details.fireRating],
    ["IFC GUID", details.guid],
  ]
  const geometry = [
    ["Width", details.geometry.width],
    ["Height", details.geometry.height],
    ["Length", details.geometry.length],
    ["Volume", details.geometry.volume],
  ]
  const activeReview = reviewContent[selectedIssue.highlight]
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)

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
    <aside className="relative min-h-0 overflow-hidden border-l border-border bg-panel max-[940px]:hidden">
      <div className="border-b border-border p-3">
        <div className="flex items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <span className="font-mono text-[10px] font-bold">
              {details.shortCode}
            </span>
          </div>
          <div
            className={cn("min-w-0", !selectedObjectVisible && "opacity-55")}
            data-testid="inspector-selection"
          >
            <p className="truncate text-xs font-semibold">
              {selectedIssue.object}
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
              {selectedObjectVisible
                ? `Object · ${details.objectId}`
                : `Hidden by ${selectedDisciplineLabel} layer`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7"
            aria-label="Open object details"
            onClick={() => showActionFeedback("Prototype action only")}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className="absolute right-3 top-[70px] z-20 rounded-md border border-border bg-panel px-2.5 py-1.5 text-[10px] font-medium shadow-md"
          role="status"
          aria-live="polite"
          data-testid="inspector-action-feedback"
        >
          {actionFeedback}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as InspectorTab)}
        className="h-[calc(100%-65px)]"
      >
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="ai">AI Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="scrollbar-thin overflow-y-auto">
          <InspectorHeading title="Identity data" />
          <dl className="px-3 pb-3">
            {properties.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-border/70 py-2 text-[10px]"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd
                  className="min-w-0 truncate text-right font-medium"
                  data-property={label}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <InspectorHeading title="Geometry" />
          <div className="grid grid-cols-2 gap-px border-y border-border bg-border">
            {geometry.map(([label, value]) => (
              <div key={label} className="bg-panel p-3">
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </div>
                <div className="mt-1 font-mono text-xs font-medium">{value}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="scrollbar-thin overflow-y-auto p-2">
          <div className="space-y-1.5">
            {issues.map((issue) => (
              <button
                type="button"
                key={issue.id}
                onClick={() => onIssueSelect(issue)}
                aria-pressed={issue.id === selectedIssue.id}
                className={cn(
                  "w-full rounded-md border p-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  issue.id === selectedIssue.id
                    ? "border-primary/45 bg-accent"
                    : "border-border hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      issue.severity === "critical"
                        ? "destructive"
                        : issue.severity === "warning"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {issue.code}
                  </Badge>
                  <span className="ml-auto text-[9px] text-muted-foreground">
                    {issue.status}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium">{issue.title}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {issue.location}
                </p>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="scrollbar-thin overflow-y-auto p-3">
          <Card className="rounded-md border-ai/30 bg-ai/8 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-ai-foreground">
              <Bot className="size-4" />
              <span className="text-[11px] font-semibold">
                Coordination suggestion
              </span>
              <Sparkles className="ml-auto size-3" />
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-foreground/85">
                {activeReview.suggestion}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">
                  Confidence
                </span>
                <Progress
                  value={activeReview.confidence}
                  aria-label="AI suggestion confidence"
                  className="h-1.5 bg-ai/20"
                />
                <span className="font-mono text-[9px] text-ai-foreground">
                  {activeReview.confidence}%
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="compact"
                  onClick={() =>
                    showActionFeedback("Preview generated for selected object")
                  }
                >
                  Preview change
                </Button>
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() =>
                    showActionFeedback(
                      "AI suggestion dismissed for this prototype",
                    )
                  }
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 space-y-2">
            {activeReview.checks.map(([label, detail, warning]) => (
              <ReviewCheck
                key={label}
                label={label}
                detail={detail}
                warning={warning}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="scrollbar-thin overflow-y-auto p-3">
          <div className="space-y-4">
            {[
              ["Today · 09:42", "Issue linked by Maya Chen"],
              ["Yesterday · 16:18", "Geometry updated from MEP model"],
              ["May 28 · 11:07", "Object created in model revision 18"],
            ].map(([time, event]) => (
              <div key={time} className="flex gap-2.5">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock3 className="size-3" />
                </div>
                <div>
                  <p className="text-[10px] font-medium">{event}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                    {time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function InspectorHeading({ title }: { title: string }) {
  return (
    <div className="flex h-8 items-center gap-1 border-b border-border px-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      <ChevronDown className="size-3" />
      {title}
    </div>
  )
}

function ReviewCheck({
  label,
  detail,
  warning = false,
}: {
  label: string
  detail: string
  warning?: boolean
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      {warning ? (
        <MessageSquare className="size-3.5 text-warning" />
      ) : (
        <CheckCircle2 className="size-3.5 text-success" />
      )}
      <div>
        <p className="text-[10px] font-medium">{label}</p>
        <p className="text-[9px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}
