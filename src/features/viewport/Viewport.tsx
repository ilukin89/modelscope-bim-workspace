import { useEffect, useRef, useState } from "react"
import {
  Box,
  BoxSelect,
  ChevronRight,
  CircleAlert,
  EyeOff,
  Hand,
  Layers3,
  MessageSquarePlus,
  Orbit,
  PanelLeftOpen,
  PanelRightOpen,
  Ruler,
  ScanLine,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ViewportToolbar } from "@/features/viewport/ViewportToolbar"
import type { ViewportTool } from "@/features/viewport/types"
import { usePrototypeViewerAdapterLifecycle } from "@/features/viewport/viewer-adapter/usePrototypeViewerAdapterLifecycle"
import type {
  FloorName,
  FloorState,
  HighlightKind,
  LayerId,
  ReviewIssue,
} from "@/types"
import { cn } from "@/lib/utils"

interface ViewportProps {
  activeTool: ViewportTool
  floors: FloorState[]
  issueCount: number
  issues: ReviewIssue[]
  onOpenAiReview: () => void
  onExpandExplorer: () => void
  onExpandInspector: () => void
  onOpenExplorer: () => void
  onOpenInspector: () => void
  onIssueSelect: (issue: ReviewIssue) => void
  onToolChange: (tool: ViewportTool) => void
  selectedFloor: FloorName
  selectedIssue: ReviewIssue
  showExplorerExpand: boolean
  showInspectorExpand: boolean
  visibleLayerIds: LayerId[]
}

export function Viewport({
  activeTool,
  floors,
  issueCount,
  issues,
  onOpenAiReview,
  onExpandExplorer,
  onExpandInspector,
  onOpenExplorer,
  onOpenInspector,
  onIssueSelect,
  onToolChange,
  selectedFloor,
  selectedIssue,
  showExplorerExpand,
  showInspectorExpand,
  visibleLayerIds,
}: ViewportProps) {
  const [aiFindingsOpen, setAiFindingsOpen] = useState(false)
  const [viewportFeedback, setViewportFeedback] = useState<{
    message: string
    type: "frame" | "ai"
  } | null>(null)
  const viewportFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const viewportHostRef = usePrototypeViewerAdapterLifecycle()
  const architectureVisible = visibleLayerIds.includes("architecture")
  const mechanicalVisible = visibleLayerIds.includes("mechanical")
  const structureVisible = visibleLayerIds.includes("structure")
  const electricalVisible = visibleLayerIds.includes("electrical")
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )
  const severityCounts = {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
  }
  const severitySummary = [
    {
      count: severityCounts.critical,
      label: "critical",
      className: "text-destructive",
    },
    {
      count: severityCounts.warning,
      label: severityCounts.warning === 1 ? "warning" : "warnings",
      className: "text-warning-foreground",
    },
    {
      count: severityCounts.info,
      label: "info",
      className: "text-primary",
    },
  ].filter((item) => item.count > 0)
  const selectedDisciplineLabel =
    selectedIssue.discipline.charAt(0).toUpperCase() +
    selectedIssue.discipline.slice(1)
  const selectedFloorIndex = Math.max(
    floors.findIndex((floor) => floor.label === selectedFloor),
    0,
  )
  const floorMarkerY =
    floors.length > 1
      ? 195 + (selectedFloorIndex / (floors.length - 1)) * 220
      : 305
  const sectionActive = activeTool === "Section"
  const toolMode = {
    Orbit: { label: "Orbit mode", icon: Orbit },
    Pan: { label: "Pan mode", icon: Hand },
    Section: { label: "Section plane active", icon: BoxSelect },
    Measure: { label: "Measure mode", icon: Ruler },
    Comment: { label: "Comment mode", icon: MessageSquarePlus },
  }[activeTool]
  const ToolModeIcon = toolMode.icon

  useEffect(
    () => () => {
      if (viewportFeedbackTimeout.current) {
        clearTimeout(viewportFeedbackTimeout.current)
      }
    },
    [],
  )

  const showViewportFeedback = (
    message: string,
    type: "frame" | "ai",
  ) => {
    setViewportFeedback({ message, type })
    if (viewportFeedbackTimeout.current) {
      clearTimeout(viewportFeedbackTimeout.current)
    }
    viewportFeedbackTimeout.current = setTimeout(
      () => setViewportFeedback(null),
      4000,
    )
  }



  const openAiReview = () => {
    showViewportFeedback(
      `AI Review opened · ${issueCount} findings`,
      "ai",
    )
  }

  const selectAiFinding = (issue: ReviewIssue) => {
    onIssueSelect(issue)
    onOpenAiReview()
    setAiFindingsOpen(false)
  }

  return (
    <section className="viewport-grid relative min-h-0 min-w-0 overflow-hidden">
      <div className="contents max-[1160px]:absolute max-[1160px]:left-1/2 max-[1160px]:top-3 max-[1160px]:z-20 max-[1160px]:flex max-[1160px]:w-max max-[1160px]:max-w-[calc(100%-24px)] max-[1160px]:-translate-x-1/2 max-[1160px]:flex-col max-[1160px]:items-stretch max-[1160px]:gap-2 max-[760px]:w-[min(288px,calc(100%-24px))]">
        <ViewportToolbar activeTool={activeTool} onToolChange={onToolChange} />

        <div
          className={cn(
            "absolute right-3 top-3 z-20 max-[1160px]:static max-[1160px]:w-0 max-[1160px]:min-w-full",
            showInspectorExpand && "min-[1161px]:right-14",
          )}
        >
          <Popover open={aiFindingsOpen} onOpenChange={setAiFindingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                onClick={openAiReview}
                aria-label="Open AI review findings"
                aria-expanded={aiFindingsOpen}
                className={cn(
                  "group h-auto min-h-[76px] w-[220px] justify-start gap-2 rounded-lg border border-ai/70 bg-[color-mix(in_oklab,var(--ai)_34%,var(--panel)_66%)] px-3 py-2 text-left shadow-[0_16px_42px_color-mix(in_oklab,var(--background)_72%,transparent)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-ai hover:bg-[color-mix(in_oklab,var(--ai)_42%,var(--panel)_58%)] hover:shadow-[0_18px_46px_color-mix(in_oklab,var(--background)_66%,transparent)] focus-visible:ring-ai max-[1160px]:w-full",
                  aiFindingsOpen &&
                    "border-ai bg-[color-mix(in_oklab,var(--ai)_48%,var(--panel)_52%)] ring-2 ring-ai/35",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                    AI Review
                  </span>
                  <span className="mt-1.5 block text-[11px] font-semibold leading-none text-ai-foreground">
                    {issueCount} coordination findings
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">
                    {severitySummary.map((item, index) => (
                      <span key={item.label} className="flex items-center gap-2">
                        {index > 0 && (
                          <span className="size-1 rounded-full bg-muted-foreground/70" />
                        )}
                        <span className={item.className}>
                          {item.count} {item.label}
                        </span>
                      </span>
                    ))}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "ml-auto size-5 shrink-0 text-foreground/75 transition-transform duration-200",
                    aiFindingsOpen && "rotate-90 text-ai-foreground",
                  )}
                  aria-hidden="true"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              collisionPadding={12}
              className="w-[min(360px,calc(100vw-24px))] border-ai/30 bg-panel p-0 shadow-xl"
            >
              <div className="border-b border-border px-3 py-2.5">
                <div>
                  <p className="text-[11px] font-semibold">AI findings</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {issueCount} coordination items in this project
                  </p>
                </div>
              </div>
              <div className="space-y-1 p-1.5">
                {issues.map((issue) => (
                  <AiFindingButton
                    key={issue.id}
                    issue={issue}
                    selected={selectedIssue.id === issue.id}
                    onSelect={() => selectAiFinding(issue)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div
          className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-md border border-border bg-panel/95 px-2.5 py-1.5 text-[10px] font-medium text-foreground shadow-md max-[1160px]:static max-[1160px]:self-center max-[1160px]:translate-x-0"
          role="status"
          data-testid="viewport-tool-feedback"
          data-active-tool={activeTool}
        >
          <span className="flex items-center gap-1.5">
            <ToolModeIcon className="size-3.5 text-primary" />
            {toolMode.label}
          </span>
        </div>

        {viewportFeedback && (
          <div
            className="absolute right-3 top-[108px] z-30 rounded-md border border-primary/30 bg-panel px-2.5 py-1.5 text-[10px] font-medium text-foreground shadow-md max-[1160px]:static max-[1160px]:self-center"
            role="status"
            aria-live="polite"
            data-testid={`${viewportFeedback.type}-viewport-feedback`}
          >
            {viewportFeedback.message}
          </div>
        )}
      </div>

      {showExplorerExpand && (
        <div className="absolute left-3 top-3 z-20 max-[940px]:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-panel"
                aria-label="Expand Model Explorer"
                aria-controls="desktop-model-explorer"
                aria-expanded="false"
                onClick={onExpandExplorer}
              >
                <PanelLeftOpen />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Expand Model Explorer
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="absolute left-3 top-3 z-20 min-[941px]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-panel"
              aria-label="Open Model Explorer"
              aria-expanded="false"
              onClick={onOpenExplorer}
            >
              <PanelLeftOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Open Model Explorer
          </TooltipContent>
        </Tooltip>
      </div>

      {showInspectorExpand && (
        <div className="absolute right-3 top-3 z-20 max-[680px]:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-panel"
                aria-label="Expand Object Inspector"
                aria-controls="object-inspector"
                aria-expanded="false"
                onClick={onExpandInspector}
              >
                <PanelRightOpen />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Expand Object Inspector
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="absolute right-3 top-3 z-20 min-[681px]:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-panel"
              aria-label="Open Object Inspector"
              aria-expanded="false"
              onClick={onOpenInspector}
            >
              <PanelRightOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Open Object Inspector
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className={cn(
          "absolute top-3 z-10 max-[1160px]:hidden",
          showExplorerExpand ? "left-14" : "left-3",
        )}
      >
        <Badge
          variant="outline"
          className="bg-panel/95 normal-case tracking-normal"
          data-testid="viewport-context"
        >
          <Layers3 className="size-3" />
          Coordination · {selectedFloor}
        </Badge>
      </div>

      <div
        ref={viewportHostRef}
        className="absolute inset-0 z-[1] flex items-center justify-center p-10 max-[680px]:p-4"
      >
        <svg
          viewBox="0 0 760 620"
          className="h-[82%] max-h-[680px] w-[82%] max-w-[820px] drop-shadow-2xl"
          role="img"
          aria-label={
            selectedObjectVisible
              ? `Simplified 3D building model with ${selectedIssue.object} selected`
              : `Simplified 3D building model; ${selectedIssue.object} is hidden by ${selectedDisciplineLabel} visibility`
          }
          data-selected-object-visible={selectedObjectVisible}
        >
          <g
            opacity={activeTool === "Pan" ? 0.36 : 0.22}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="1"
            data-tool-effect="pan-grid"
            data-active={activeTool === "Pan"}
            className="transition-all duration-300"
            style={{
              transform:
                activeTool === "Pan"
                  ? "translate(14px, -8px)"
                  : "translate(0, 0)",
            }}
          >
            <path d="M65 522 367 602 695 490 391 420Z" />
            <path d="M105 541 405 452M170 558 470 468M237 575 535 483M304 593 600 499" />
            <path d="M126 506 428 585M191 484 493 566M258 463 559 546M324 442 625 525" />
          </g>

          <g stroke="var(--border)" strokeWidth="2" strokeLinejoin="round">
            <g
              data-viewport-layer="architecture"
              data-visible={architectureVisible}
              opacity={architectureVisible ? 1 : 0.08}
              className="transition-opacity duration-200"
            >
              <path
                d="M235 142 444 84 598 157 390 220Z"
                fill="var(--panel-subtle)"
              />
              <path
                d="M235 142 390 220 390 520 235 438Z"
                fill="color-mix(in oklab, var(--panel) 78%, var(--canvas))"
              />
              <path
                d="M390 220 598 157 598 458 390 520Z"
                fill="var(--panel)"
              />

              {[0, 1, 2, 3, 4, 5].map((floor) => {
                const y = 220 + floor * 47
                return (
                  <g key={floor}>
                    <path
                      d={`M235 ${142 + floor * 49} 390 ${y} 598 ${157 + floor * 50}`}
                      fill="none"
                    />
                    <path
                      d={`M390 ${y} 390 ${y + 47}`}
                      fill="none"
                      opacity="0.45"
                    />
                  </g>
                )
              })}

              <g fill="var(--canvas)" strokeWidth="1.5">
                <path d="M257 241 373 299 373 332 257 273Z" />
                <path d="M257 337 373 396 373 427 257 369Z" />
                <path d="M411 276 575 227 575 261 411 309Z" />
                <path d="M411 370 575 322 575 355 411 403Z" />
              </g>
            </g>

            <g
              data-viewport-layer="structure"
              data-visible={structureVisible}
              opacity={structureVisible ? 0.58 : 0}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="4"
              className="transition-opacity duration-200"
            >
              <path d="M275 165v294M348 201v296M460 199v288M548 172v289" />
              <path d="M244 344 392 420 591 362" />
              {[0, 1, 2, 3].map((column) => (
                <path
                  key={column}
                  d={`M${432 + column * 43} ${207 - column * 13}v299`}
                />
              ))}
            </g>

            <g
              data-viewport-layer="mechanical"
              data-visible={mechanicalVisible}
              opacity={
                mechanicalVisible
                  ? selectedIssue.highlight === "duct"
                    ? 1
                    : 0.55
                  : 0
              }
              className="transition-opacity duration-200"
            >
                <path
                  d="M305 319 492 268 535 287 349 341Z"
                  fill="color-mix(in oklab, var(--ai) 58%, var(--panel))"
                  stroke="var(--ai)"
                  strokeWidth="3"
                />
                <path
                  d="M349 341 535 287v21L349 362Z"
                  fill="color-mix(in oklab, var(--ai) 38%, var(--panel))"
                  stroke="var(--ai)"
                  strokeWidth="3"
                />
                <path
                  d="M305 319 349 341v21l-44-21Z"
                  fill="color-mix(in oklab, var(--ai) 45%, var(--panel))"
                  stroke="var(--ai)"
                  strokeWidth="3"
                />
            </g>

            <g
              data-viewport-layer="electrical"
              data-visible={electricalVisible}
              opacity={electricalVisible ? 0.85 : 0}
              fill="none"
              stroke="var(--warning)"
              strokeWidth="2"
              className="transition-opacity duration-200"
            >
              <path d="M287 435 392 489 548 442" />
              <path d="M305 425v31M527 413v36" />
              <circle cx="305" cy="425" r="4" fill="var(--warning)" />
              <circle cx="527" cy="413" r="4" fill="var(--warning)" />
            </g>

            {selectedObjectVisible && (
              <SelectedObjectHighlight kind={selectedIssue.highlight} />
            )}
          </g>

          <g
            data-testid="viewport-floor-indicator"
            data-floor={selectedFloor}
            data-floor-index={selectedFloorIndex}
            data-marker-y={Math.round(floorMarkerY)}
            className="pointer-events-none transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${floorMarkerY}px)` }}
          >
            <path
              d="M215 -43 390 44 620 -26 445 -112Z"
              fill={`color-mix(in oklab, var(--primary) ${
                sectionActive ? "38%" : "18%"
              }, transparent)`}
              stroke="var(--primary)"
              strokeWidth={sectionActive ? 4 : 2}
              strokeLinejoin="round"
              strokeDasharray={sectionActive ? "10 4" : "7 5"}
              data-section-active={sectionActive}
            />
            <path
              d="M215 -43 390 44 620 -26"
              fill="none"
              stroke="var(--primary)"
              strokeWidth={sectionActive ? 5 : 3}
            />
            <circle
              cx="620"
              cy="-26"
              r="4"
              fill="var(--primary)"
              stroke="var(--canvas)"
              strokeWidth="2"
            />
            <g transform="translate(628 -40)">
              <rect
                width="92"
                height="25"
                rx="4"
                fill="var(--panel)"
                stroke="var(--primary)"
              />
              <text
                x="8"
                y="16"
                fill="var(--foreground)"
                fontSize="10"
                fontWeight="600"
              >
                {selectedFloor}
              </text>
            </g>
          </g>

          {activeTool === "Measure" && selectedObjectVisible && (
            <g
              data-testid="viewport-measurement"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
            >
              <path d="M300 307 540 283" strokeDasharray="7 5" />
              <path d="m298 298 3 18M539 274l2 18" />
              <circle cx="300" cy="307" r="3" fill="var(--primary)" />
              <circle cx="540" cy="283" r="3" fill="var(--primary)" />
              <g transform="translate(387 274)">
                <rect
                  width="68"
                  height="25"
                  rx="4"
                  fill="var(--panel)"
                  stroke="var(--primary)"
                />
                <text
                  x="34"
                  y="16"
                  textAnchor="middle"
                  fill="var(--foreground)"
                  stroke="none"
                  fontSize="11"
                  fontWeight="600"
                >
                  4.20 m
                </text>
              </g>
            </g>
          )}

          {activeTool === "Comment" && selectedObjectVisible && (
            <g data-testid="viewport-comment-marker" transform="translate(530 245)">
              <path
                d="M0 0c0-16 12-27 28-27s28 11 28 27-28 43-28 43S0 16 0 0Z"
                fill="var(--warning)"
                stroke="var(--canvas)"
                strokeWidth="3"
              />
              <circle cx="28" cy="0" r="8" fill="var(--panel)" />
              <path
                d="M24-2h8M24 3h5"
                stroke="var(--warning)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          <g
            transform="translate(602 490)"
            data-tool-effect="orientation-gizmo"
            data-orbit-active={activeTool === "Orbit"}
          >
            <circle
              r={activeTool === "Orbit" ? 35 : 31}
              fill="var(--panel)"
              stroke={
                activeTool === "Orbit" ? "var(--primary)" : "var(--border)"
              }
              strokeWidth={activeTool === "Orbit" ? 3 : 1}
              className="transition-all duration-200"
            />
            {activeTool === "Orbit" && (
              <path
                d="M-40 0a40 18 0 0 0 80 0"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
            )}
            <path d="M0 0v-22" stroke="var(--destructive)" strokeWidth="2.5" />
            <path d="M0 0 20 10" stroke="var(--success)" strokeWidth="2.5" />
            <path d="M0 0-16 13" stroke="var(--primary)" strokeWidth="2.5" />
            <text x="-4" y="-13" fill="var(--foreground)" fontSize="8">
              Z
            </text>
          </g>
        </svg>
      </div>

      <Card
        className={cn(
          "absolute bottom-3 left-3 z-20 max-w-[260px] rounded-md bg-panel shadow-lg",
          !selectedObjectVisible && "border-border opacity-75",
          selectedObjectVisible &&
            selectedIssue.severity === "critical" &&
            "border-destructive/35",
          selectedObjectVisible &&
            selectedIssue.severity === "warning" &&
            "border-warning/35",
          selectedObjectVisible &&
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
              selectedIssue.severity === "critical" &&
                selectedObjectVisible &&
                "bg-destructive/12 text-destructive",
              selectedIssue.severity === "warning" &&
                selectedObjectVisible &&
                "bg-warning/12 text-warning-foreground",
              selectedIssue.severity === "info" &&
                selectedObjectVisible &&
                "bg-primary/12 text-primary",
            )}
          >
            {selectedObjectVisible ? (
              <ScanLine className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
          </span>
          <div className="min-w-0" data-testid="viewport-selection">
            <p className="truncate text-[11px] font-semibold">
              {selectedIssue.object}
            </p>
            <p className="truncate text-[9px] text-muted-foreground">
              {selectedObjectVisible
                ? `${selectedIssue.code} · ${selectedIssue.location}`
                : `Selected object hidden by ${selectedDisciplineLabel} visibility`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-md border border-border bg-panel px-2.5 py-1.5 text-[9px] text-muted-foreground shadow-md">
        <Box className="size-3" />
        <span className="font-mono">Perspective</span>
        <Separator orientation="vertical" className="h-3" />
        <span className="font-mono">42.0°</span>
      </div>
    </section>
  )
}

const findingMeta = {
  duct: {
    label: "Clash detected",
    icon: CircleAlert,
    className: "text-destructive",
  },
  door: {
    label: "Clearance issue",
    icon: TriangleAlert,
    className: "text-warning",
  },
  damper: {
    label: "Missing classification",
    icon: ShieldAlert,
    className: "text-primary",
  },
} satisfies Record<
  HighlightKind,
  { label: string; icon: typeof CircleAlert; className: string }
>

function AiFindingButton({
  issue,
  selected,
  onSelect,
}: {
  issue: ReviewIssue
  selected: boolean
  onSelect: () => void
}) {
  const meta = findingMeta[issue.highlight]
  const Icon = meta.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "grid w-full grid-cols-[24px_minmax(0,1fr)] gap-2 rounded-sm border px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected
          ? "border-ai/35 bg-ai/10"
          : "border-transparent hover:border-border hover:bg-muted",
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-sm bg-background">
        <Icon className={cn("size-3.5", meta.className)} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-[10px] font-semibold">
            {meta.label}
          </span>
          <span className="ml-auto font-mono text-[8px] text-muted-foreground">
            {issue.code}
          </span>
        </span>
        <span className="mt-1 block truncate text-[9px] text-foreground/80">
          {issue.title}
        </span>
        <span className="mt-1 block truncate font-mono text-[8px] text-muted-foreground">
          {issue.details.objectId} · {issue.details.level}
        </span>
      </span>
    </button>
  )
}

function SelectedObjectHighlight({ kind }: { kind: HighlightKind }) {
  if (kind === "door") {
    return (
      <g
        key="door-highlight"
        data-highlight-kind="door"
        fill="color-mix(in oklab, var(--warning) 35%, var(--panel))"
        stroke="var(--warning)"
        strokeWidth="3"
      >
        <path d="M448 383 487 371v76l-39 12Z" />
        <path
          d="M448 459a48 48 0 0 1 39-49"
          fill="none"
          strokeDasharray="5 5"
          strokeWidth="2"
        />
        <circle
          cx="468"
          cy="416"
          r="31"
          fill="none"
          stroke="var(--warning)"
          strokeDasharray="5 5"
          strokeWidth="2"
        />
      </g>
    )
  }

  if (kind === "damper") {
    return (
      <g
        key="damper-highlight"
        data-highlight-kind="damper"
        fill="color-mix(in oklab, var(--primary) 35%, var(--panel))"
        stroke="var(--primary)"
        strokeWidth="3"
      >
        <path d="M360 326 394 317 414 326 379 336Z" />
        <path d="M379 336 414 326v34l-35 10Z" />
        <path d="M360 326 379 336v34l-19-10Z" />
        <path d="m366 333 39 22M405 324l-39 42" fill="none" strokeWidth="2" />
        <circle
          cx="387"
          cy="344"
          r="27"
          fill="none"
          strokeDasharray="5 5"
          strokeWidth="2"
        />
      </g>
    )
  }

  return (
    <g key="duct-highlight" data-highlight-kind="duct">
      <path
        d="M424 287 424 347"
        stroke="var(--destructive)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle
        cx="424"
        cy="314"
        r="24"
        fill="none"
        stroke="var(--destructive)"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
    </g>
  )
}
