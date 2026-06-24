import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import {
  AlertTriangle,
  Bookmark,
  Bot,
  Check,
  FileStack,
  MapPin,
  ScanSearch,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  candidates,
  cloneInitialReviewStates,
  formatIssueId,
  getPriorityLabel,
  getTypeAccent,
  typeVisuals,
} from "./data/drawingTriageData"
import { DrawingTriageEntryGate } from "./components/DrawingTriageEntryGate"
import type {
  Candidate,
  CandidateId,
  CandidateReviewState,
  CreatedIssueSummary,
  DrawingSource,
  PendingPanelFocus,
  ReviewCandidateFilter,
  ReviewDecision,
  RightPanelView,
  TriageSessionSnapshot,
  TriageStage,
} from "./types"

const triageSessionStorageKey = "modelscope:drawing-triage-session"

function isCandidateId(value: unknown): value is CandidateId {
  return (
    value === "door-clearance" ||
    value === "riser-note" ||
    value === "grid-offset"
  )
}

function isDrawingSource(value: unknown): value is DrawingSource {
  return value === "Sample drawing" || value === "Mock file"
}

function isTriageStage(value: unknown): value is TriageStage {
  return (
    value === "empty" ||
    value === "selected" ||
    value === "scanning" ||
    value === "review"
  )
}

function isRightPanelView(value: unknown): value is RightPanelView {
  return value === "review_candidates" || value === "created_issues"
}

function isReviewCandidateFilter(
  value: unknown,
): value is ReviewCandidateFilter {
  return value === "all" || value === "follow_up"
}

function isReviewDecision(value: unknown): value is ReviewDecision {
  return value === "unreviewed" || value === "issue_created"
}

function readTriageSessionSnapshot(): TriageSessionSnapshot | null {
  try {
    const rawSnapshot = window.sessionStorage.getItem(triageSessionStorageKey)
    if (!rawSnapshot) return null

    const parsed = JSON.parse(rawSnapshot) as Partial<TriageSessionSnapshot>
    const triageStage = isTriageStage(parsed.triageStage)
      ? parsed.triageStage
      : "empty"
    const drawingSource = isDrawingSource(parsed.drawingSource)
      ? parsed.drawingSource
      : null
    const reviewStates = cloneInitialReviewStates()

    for (const candidate of candidates) {
      const candidateState = parsed.reviewStates?.[candidate.id]
      if (
        candidateState &&
        isReviewDecision(candidateState.decision) &&
        typeof candidateState.isFollowUp === "boolean"
      ) {
        reviewStates[candidate.id] = {
          decision: candidateState.decision,
          isFollowUp: candidateState.isFollowUp,
        }
      }
    }

    const createdIssues = Array.isArray(parsed.createdIssues)
      ? parsed.createdIssues.filter(
          (issue): issue is CreatedIssueSummary =>
            typeof issue.issueId === "string" && isCandidateId(issue.candidateId),
        )
      : []
    const nextIssueSequence =
      typeof parsed.nextIssueSequence === "number" &&
      parsed.nextIssueSequence > 0
        ? parsed.nextIssueSequence
        : createdIssues.length + 1

    return {
      triageStage: triageStage === "scanning" ? "selected" : triageStage,
      drawingSource,
      selectedCandidateId: isCandidateId(parsed.selectedCandidateId)
        ? parsed.selectedCandidateId
        : "door-clearance",
      reviewStates,
      activeRightPanelView: isRightPanelView(parsed.activeRightPanelView)
        ? parsed.activeRightPanelView
        : "review_candidates",
      reviewCandidateFilter: isReviewCandidateFilter(
        parsed.reviewCandidateFilter,
      )
        ? parsed.reviewCandidateFilter
        : "all",
      createdIssues,
      nextIssueSequence,
    }
  } catch {
    return null
  }
}

function writeTriageSessionSnapshot(snapshot: TriageSessionSnapshot) {
  window.sessionStorage.setItem(
    triageSessionStorageKey,
    JSON.stringify(snapshot),
  )
}

function Marker({
  candidate,
  reviewState,
  selected,
  x,
  y,
  onSelect,
}: {
  candidate: Candidate
  reviewState: CandidateReviewState
  selected: boolean
  x: number
  y: number
  onSelect: (id: CandidateId) => void
}) {
  const accent = getTypeAccent(candidate)
  const stroke = typeVisuals[candidate.type].darkAccent
  const emphasis = reviewState.decision === "issue_created"
  const isFollowUp =
    reviewState.decision === "unreviewed" && reviewState.isFollowUp
  const isIssueCreated = reviewState.decision === "issue_created"

  return (
    <g
      role="button"
      aria-label={`Review candidate ${candidate.marker}: ${candidate.title}`}
      aria-pressed={selected}
      className="cursor-pointer outline-none"
      onClick={() => onSelect(candidate.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(candidate.id)
        }
      }}
      tabIndex={0}
    >
      <circle
        cx={x}
        cy={y}
        r={selected ? 25 : 20}
        fill={`color-mix(in oklab, ${accent} ${
          selected ? "24%" : emphasis ? "19%" : "12%"
        }, transparent)`}
        stroke={stroke}
        strokeWidth={selected ? 3 : emphasis ? 2.5 : 2}
      />
      <circle
        cx={x}
        cy={y}
        r={12}
        fill={`color-mix(in oklab, ${accent} ${
          emphasis ? "34%" : "28%"
        }, oklch(0.965 0.012 90))`}
        stroke={stroke}
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 4}
        fill="oklch(0.25 0.018 220)"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
      >
        {candidate.marker}
      </text>
      {isFollowUp && (
        <g
          aria-label="Marked for follow-up"
          transform={`translate(${x + 10} ${y - 25})`}
        >
          <rect
            x="0"
            y="0"
            width="15"
            height="15"
            rx="3"
            fill={`color-mix(in oklab, ${stroke} 40%, oklch(0.965 0.012 90))`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M4.5 3.5h6v8l-3-2.1-3 2.1z"
            fill={stroke}
            stroke="none"
          />
        </g>
      )}
      {isIssueCreated && (
        <g
          aria-label="Issue created"
          transform={`translate(${x + 10} ${y - 26})`}
        >
          <rect
            x="0"
            y="0"
            width="18"
            height="18"
            rx="4"
            fill={`color-mix(in oklab, ${stroke} 48%, oklch(0.965 0.012 90))`}
            stroke={stroke}
            strokeWidth="2"
          />
          <text
            x="9"
            y="13.4"
            fill={stroke}
            fontSize="12.5"
            fontWeight="800"
            textAnchor="middle"
          >
            !
          </text>
        </g>
      )}
    </g>
  )
}

export function DrawingTriagePlaceholder() {
  const initialSessionRef = useRef<TriageSessionSnapshot | null | undefined>(
    undefined,
  )
  if (initialSessionRef.current === undefined) {
    initialSessionRef.current = readTriageSessionSnapshot()
  }
  const initialSession = initialSessionRef.current
  const [triageStage, setTriageStage] = useState<TriageStage>(
    initialSession?.triageStage ?? "empty",
  )
  const [drawingSource, setDrawingSource] = useState<DrawingSource | null>(
    initialSession?.drawingSource ?? null,
  )
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<CandidateId>(
      initialSession?.selectedCandidateId ?? "door-clearance",
    )
  const [reviewStates, setReviewStates] = useState(
    initialSession?.reviewStates ?? cloneInitialReviewStates(),
  )
  const [activeRightPanelView, setActiveRightPanelView] =
    useState<RightPanelView>(
      initialSession?.activeRightPanelView ?? "review_candidates",
    )
  const [reviewCandidateFilter, setReviewCandidateFilter] =
    useState<ReviewCandidateFilter>(
      initialSession?.reviewCandidateFilter ?? "all",
    )
  const [createdIssues, setCreatedIssues] = useState<CreatedIssueSummary[]>(
    initialSession?.createdIssues ?? [],
  )
  const [pendingPanelFocus, setPendingPanelFocus] =
    useState<PendingPanelFocus | null>(null)
  const [removeDrawingDialogOpen, setRemoveDrawingDialogOpen] = useState(false)
  const [issuePendingRemoval, setIssuePendingRemoval] =
    useState<CandidateId | null>(null)
  const nextIssueSequence = useRef(initialSession?.nextIssueSequence ?? 1)
  const candidateCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const issueCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0]
  const selectedReviewState = reviewStates[selectedCandidate.id]
  const remainingReviewCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].decision === "unreviewed",
  ).length
  const createdIssueSummaries = createdIssues
    .map((issue) => ({
      issue,
      candidate: candidates.find(
        (candidate) => candidate.id === issue.candidateId,
      ),
    }))
    .filter(
      (
        summary,
      ): summary is {
        issue: CreatedIssueSummary
        candidate: Candidate
      } =>
        Boolean(summary.candidate) &&
        reviewStates[summary.issue.candidateId].decision === "issue_created",
    )
  const followUpCandidates = candidates.filter(
    (candidate) =>
      reviewStates[candidate.id].decision === "unreviewed" &&
      reviewStates[candidate.id].isFollowUp,
  )
  const followUpCount = followUpCandidates.length
  const visibleReviewCandidates =
    reviewCandidateFilter === "follow_up" ? followUpCandidates : candidates
  const reviewSummaryTitle =
    remainingReviewCount === 0
      ? "Review decisions complete"
      : `${remainingReviewCount} of ${candidates.length} observations to review`
  const activeDrawingSource = drawingSource ?? "Sample drawing"
  const activeDrawingFileName =
    activeDrawingSource === "Mock file"
      ? "mock-a102-level-02.pdf"
      : "MS_A102_review.pdf"

  function candidateHasCreatedIssue(candidateId: CandidateId) {
    return (
      reviewStates[candidateId].decision === "issue_created" &&
      createdIssues.some((issue) => issue.candidateId === candidateId)
    )
  }

  function scrollPanelItemIntoView(
    refs: RefObject<Partial<Record<CandidateId, HTMLElement | null>>>,
    candidateId: CandidateId,
  ) {
    const element = refs.current[candidateId]
    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
    element?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!pendingPanelFocus || pendingPanelFocus.view !== activeRightPanelView) {
      return
    }

    const refs =
      pendingPanelFocus.view === "created_issues"
        ? issueCardRefs
        : candidateCardRefs

    window.requestAnimationFrame(() => {
      scrollPanelItemIntoView(refs, pendingPanelFocus.candidateId)
      setPendingPanelFocus((current) =>
        current?.candidateId === pendingPanelFocus.candidateId &&
        current.view === pendingPanelFocus.view
          ? null
          : current,
      )
    })
  }, [
    activeRightPanelView,
    createdIssueSummaries.length,
    pendingPanelFocus,
    selectedCandidateId,
  ])

  useEffect(() => {
    if (triageStage !== "scanning") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTriageStage("review")
    }, 850)

    return () => window.clearTimeout(timeoutId)
  }, [triageStage])

  useEffect(() => {
    writeTriageSessionSnapshot({
      triageStage,
      drawingSource,
      selectedCandidateId,
      reviewStates,
      activeRightPanelView,
      reviewCandidateFilter,
      createdIssues,
      nextIssueSequence: nextIssueSequence.current,
    })
  }, [
    activeRightPanelView,
    createdIssues,
    drawingSource,
    reviewCandidateFilter,
    reviewStates,
    selectedCandidateId,
    triageStage,
  ])

  function updateReviewDecision(
    candidateId: CandidateId,
    decision: ReviewDecision,
  ) {
    setSelectedCandidateId(candidateId)
    setReviewStates((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        decision,
        isFollowUp:
          decision === "issue_created" ? false : current[candidateId].isFollowUp,
      },
    }))
  }

  function convertCandidateToIssue(candidateId: CandidateId) {
    const issueId = formatIssueId(nextIssueSequence.current)
    nextIssueSequence.current += 1

    updateReviewDecision(candidateId, "issue_created")
    setCreatedIssues((current) => {
      if (current.some((issue) => issue.candidateId === candidateId)) {
        return current
      }

      return [...current, { issueId, candidateId }]
    })
  }

  function removeCandidateIssue(candidateId: CandidateId) {
    updateReviewDecision(candidateId, "unreviewed")
    setCreatedIssues((current) =>
      current.filter((issue) => issue.candidateId !== candidateId),
    )
    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({ candidateId, view: "review_candidates" })
  }

  function toggleFollowUp(candidateId: CandidateId) {
    setSelectedCandidateId(candidateId)
    setReviewStates((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        isFollowUp: !current[candidateId].isFollowUp,
      },
    }))
  }

  function selectCandidateFromDrawing(candidateId: CandidateId) {
    const targetView =
      activeRightPanelView === "created_issues" &&
      candidateHasCreatedIssue(candidateId)
        ? "created_issues"
        : "review_candidates"

    if (
      targetView === "review_candidates" &&
      reviewCandidateFilter === "follow_up" &&
      !reviewStates[candidateId].isFollowUp
    ) {
      setReviewCandidateFilter("all")
    }

    setSelectedCandidateId(candidateId)
    setActiveRightPanelView(targetView)
    setPendingPanelFocus({ candidateId, view: targetView })
  }

  function showReviewCandidates() {
    if (
      reviewCandidateFilter === "follow_up" &&
      !reviewStates[selectedCandidateId].isFollowUp
    ) {
      setReviewCandidateFilter("all")
    }

    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({
      candidateId: selectedCandidateId,
      view: "review_candidates",
    })
  }

  function showCreatedIssues() {
    const selectedIssueCandidateId = candidateHasCreatedIssue(selectedCandidateId)
      ? selectedCandidateId
      : createdIssueSummaries[0]?.issue.candidateId

    if (selectedIssueCandidateId) {
      setSelectedCandidateId(selectedIssueCandidateId)
      setPendingPanelFocus({
        candidateId: selectedIssueCandidateId,
        view: "created_issues",
      })
    }

    setActiveRightPanelView("created_issues")
  }

  function focusReviewCandidate(candidateId: CandidateId) {
    if (
      reviewCandidateFilter === "follow_up" &&
      !reviewStates[candidateId].isFollowUp
    ) {
      setReviewCandidateFilter("all")
    }
    setActiveRightPanelView("review_candidates")
    setPendingPanelFocus({ candidateId, view: "review_candidates" })
  }

  function viewIssueOnSheet(candidateId: CandidateId) {
    setSelectedCandidateId(candidateId)
    focusReviewCandidate(candidateId)
  }

  function getDecisionLabel(decision: ReviewDecision) {
    if (decision === "issue_created") return "Issue created"
    return "Needs review"
  }

  function resetReviewState() {
    setSelectedCandidateId("door-clearance")
    setReviewStates(cloneInitialReviewStates())
    setActiveRightPanelView("review_candidates")
    setReviewCandidateFilter("all")
    setCreatedIssues([])
    setPendingPanelFocus(null)
    candidateCardRefs.current = {}
    issueCardRefs.current = {}
    nextIssueSequence.current = 1
  }

  function selectDrawingSource(source: DrawingSource) {
    resetReviewState()
    setDrawingSource(source)
    setTriageStage("selected")
  }

  function changeDrawing() {
    resetReviewState()
    setDrawingSource(null)
    setTriageStage("empty")
  }

  function removeDrawing() {
    resetReviewState()
    setDrawingSource(null)
    setTriageStage("empty")
  }

  function runTriage() {
    setTriageStage("scanning")
  }

  function renderDrawingContext(contextId: string) {
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
              A-102 Level 02 floor plan
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground max-[900px]:hidden">
              Rev P03 · 1:100 · Architecture
            </p>
            <p className="mt-1 hidden text-[10px] font-medium text-muted-foreground max-[900px]:block">
              A-102 · Rev P03 · 1:100 · Architecture
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
                    {activeDrawingFileName}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  className="h-7 rounded-md px-2 text-[10px]"
                  onClick={changeDrawing}
                >
                  Change drawing
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-7 rounded-md px-1.5 text-[10px] text-destructive/75 shadow-none hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRemoveDrawingDialogOpen(true)}
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
              <dd className="truncate font-medium">{activeDrawingFileName}</dd>
              <dt className="text-muted-foreground">Sheet</dt>
              <dd>A-102 Level 02 floor plan</dd>
              <dt className="text-muted-foreground">Revision</dt>
              <dd>Rev P03 · 14 May 2026</dd>
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
              <span className="text-[10px] text-muted-foreground">1 of 3</span>
            </div>
            <div className="mt-2 space-y-1 max-[900px]:grid max-[900px]:grid-cols-3 max-[900px]:gap-1 max-[900px]:space-y-0">
              <button
                type="button"
                aria-current="page"
                className="flex w-full min-w-0 items-center gap-2 rounded-sm bg-accent px-2.5 py-2 text-left text-[11px] text-accent-foreground outline-none ring-ring focus-visible:ring-2 max-[900px]:px-2 max-[900px]:py-1.5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-[9px] font-bold text-primary-foreground">
                  02
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    <span className="max-[900px]:hidden">
                      Level 02 floor plan
                    </span>
                    <span className="hidden max-[900px]:inline">Level 02</span>
                  </span>
                  <span className="block text-[9px] opacity-75 max-[900px]:hidden">
                    {remainingReviewCount === 0
                      ? "Review decisions complete"
                      : `${remainingReviewCount} awaiting decision`}
                  </span>
                </span>
                <Check className="size-3.5 max-[900px]:hidden" />
              </button>
              <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 text-[11px] text-muted-foreground max-[900px]:px-2 max-[900px]:py-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-bold">
                  01
                </span>
                <span className="min-w-0 truncate">
                  <span className="max-[900px]:hidden">
                    Level 01 floor plan
                  </span>
                  <span className="hidden max-[900px]:inline">Level 01</span>
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 text-[11px] text-muted-foreground max-[900px]:px-2 max-[900px]:py-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-bold">
                  R
                </span>
                <span className="min-w-0 truncate">Roof plan</span>
              </div>
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

  if (triageStage !== "review") {
    return (
      <DrawingTriageEntryGate
        stage={triageStage}
        drawingSource={drawingSource}
        onUseSampleDrawing={selectDrawingSource}
        onSelectMockFile={selectDrawingSource}
        onRunTriage={runTriage}
        onChangeDrawing={changeDrawing}
      />
    )
  }

  return (
    <>
      <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto max-[900px]:overflow-x-hidden"
    >
      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-border bg-panel max-[900px]:hidden min-[901px]:order-1 min-[901px]:border-r">
        {renderDrawingContext("desktop-context")}
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
              A-102 · Level 02 floor plan · Review overlay
            </p>
          </div>
        </header>

        <Sheet>
          <div className="border-b border-border bg-panel/95 px-3 py-1.5 min-[901px]:hidden">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                <span className="max-[420px]:hidden">
                  A-102 · Rev P03 · {activeDrawingSource}
                </span>
                <span className="hidden max-[420px]:inline">
                  A-102 · P03
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="h-7 rounded-md px-2 text-[10px] shadow-none"
                  >
                    Context
                  </Button>
                </SheetTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-7 rounded-md px-1.5 text-[10px] shadow-none"
                  onClick={changeDrawing}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  className="h-7 rounded-md px-1.5 text-[10px] text-destructive/75 shadow-none hover:bg-destructive/10 hover:text-destructive"
                  onClick={removeDrawing}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <SheetContent
            side="right"
            overlayClassName="bg-background/10"
            className="w-[min(92vw,380px)] max-w-none overflow-hidden border-border bg-panel p-0 max-[560px]:w-full [&>button]:right-3 [&>button]:top-3"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Drawing context</SheetTitle>
              <SheetDescription>
                Active drawing metadata, drawing actions, artifact details, and
                sheet list.
              </SheetDescription>
            </SheetHeader>
            <div className="scrollbar-thin h-full overflow-y-auto pt-7">
              {renderDrawingContext("mobile-context")}
            </div>
          </SheetContent>
        </Sheet>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
          <div className="absolute left-3 top-3 z-10 hidden max-w-[calc(100%-1.5rem)] items-center gap-2 border border-border bg-panel px-2.5 py-1.5 text-[10px] shadow-sm min-[901px]:left-4 min-[901px]:top-4 min-[901px]:flex min-[901px]:max-w-[42vw]">
            <MapPin className="size-3.5 text-primary" />
            <span className="min-w-0 truncate">
              Candidate {selectedCandidate.marker} · Decision:{" "}
              {getDecisionLabel(selectedReviewState.decision)}
              {selectedReviewState.isFollowUp ? " · Follow-up" : ""}:{" "}
              {selectedCandidate.region}
            </span>
          </div>

          <div className="relative w-full max-w-[900px] border border-border bg-[oklch(0.965_0.012_90)] shadow-[0_12px_32px_color-mix(in_oklab,var(--foreground)_12%,transparent)]">
            <svg
              viewBox="0 0 900 620"
              role="img"
              aria-labelledby="plan-title plan-description"
              className="block h-auto w-full"
            >
              <title id="plan-title">Sample Level 02 architectural plan</title>
              <desc id="plan-description">
                A mock office floor plan with three numbered review candidate
                markers. The selected marker matches the selected review card.
              </desc>
              <rect
                x="0"
                y="0"
                width="900"
                height="620"
                fill="oklch(0.965 0.012 90)"
              />

              <g
                stroke="oklch(0.72 0.018 220)"
                strokeDasharray="6 6"
                strokeWidth="1"
              >
                <line x1="110" y1="54" x2="110" y2="540" />
                <line x1="300" y1="54" x2="300" y2="540" />
                <line x1="490" y1="54" x2="490" y2="540" />
                <line x1="680" y1="54" x2="680" y2="540" />
                <line x1="55" y1="110" x2="795" y2="110" />
                <line x1="55" y1="290" x2="795" y2="290" />
                <line x1="55" y1="480" x2="795" y2="480" />
              </g>

              <g
                fill="oklch(0.32 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                <text x="110" y="42">A</text>
                <text x="300" y="42">B</text>
                <text x="490" y="42">C</text>
                <text x="680" y="42">D</text>
                <text x="38" y="114">1</text>
                <text x="38" y="294">2</text>
                <text x="38" y="484">3</text>
              </g>

              <g
                fill="none"
                stroke="oklch(0.28 0.015 220)"
                strokeLinecap="square"
              >
                <rect x="70" y="75" width="670" height="430" strokeWidth="9" />
                <path
                  d="M70 250h180m40 0h176m34 0h150m34 0h56M70 325h170m40 0h100m28 0h42m28 0h62m40 0h100m30 0h30"
                  strokeWidth="5"
                />
                <path
                  d="M420 75v175M580 75v175M360 325v180M430 325v180M500 325v180M650 325v180M500 420h150M585 420v85"
                  strokeWidth="5"
                />
                <path d="M250 250v-40a40 40 0 0 1 40 40" strokeWidth="2" />
                <path d="M500 250v34a34 34 0 0 1-34-34" strokeWidth="2" />
                <path d="M650 250v-34a34 34 0 0 1 34 34" strokeWidth="2" />
                <path d="M240 325v40a40 40 0 0 0 40-40" strokeWidth="2" />
                <path d="M380 325v28a28 28 0 0 0 28-28" strokeWidth="2" />
                <path d="M450 325v28a28 28 0 0 0 28-28" strokeWidth="2" />
                <path d="M540 325v40m40-40v40" strokeWidth="2" />
                <path d="M680 325v30a30 30 0 0 0 30-30" strokeWidth="2" />
              </g>

              <g
                fill="none"
                stroke="oklch(0.56 0.03 220)"
                strokeWidth="2"
              >
                <path d="M308 92v78h96" strokeDasharray="3 3" />
                <path d="M112 116h112m-112 38h112m-112 38h112" />
                <path d="M126 106v20m34-20v20m34-20v20M126 144v20m34-20v20m34-20v20M126 182v20m34-20v20m34-20v20" />
                <path d="M255 116h110m-110 38h110m-110 38h110" />
                <path d="M270 106v20m36-20v20m36-20v20M270 144v20m36-20v20m36-20v20M270 182v20m36-20v20m36-20v20" />
                <rect x="454" y="130" width="92" height="42" rx="2" />
                <circle cx="466" cy="124" r="4" />
                <circle cx="500" cy="124" r="4" />
                <circle cx="534" cy="124" r="4" />
                <circle cx="466" cy="178" r="4" />
                <circle cx="500" cy="178" r="4" />
                <circle cx="534" cy="178" r="4" />
                <rect x="614" y="130" width="92" height="42" rx="2" />
                <circle cx="626" cy="124" r="4" />
                <circle cx="660" cy="124" r="4" />
                <circle cx="694" cy="124" r="4" />
                <circle cx="626" cy="178" r="4" />
                <circle cx="660" cy="178" r="4" />
                <circle cx="694" cy="178" r="4" />
                <path d="M108 374h205m-205 40h205m-205 40h205" />
                <path d="M124 363v22m38-22v22m38-22v22m38-22v22m38-22v22M124 403v22m38-22v22m38-22v22m38-22v22m38-22v22M124 443v22m38-22v22m38-22v22m38-22v22m38-22v22" />
                <rect x="374" y="370" width="42" height="70" />
                <path d="M382 386h26m-26 14h26" />
                <rect x="444" y="370" width="42" height="70" />
                <path d="M452 386h26m-26 14h26" />
                <rect x="514" y="350" width="58" height="58" />
                <path d="M522 398h42m-42-10h42m-42-10h42m-42-10h42m-42-10h42" />
                <rect x="596" y="350" width="42" height="58" />
                <path d="M596 379h42M617 350v58" />
                <rect x="596" y="438" width="42" height="50" />
                <path d="M603 448h28m-28 10h28m-28 10h28m-28 10h28" />
                <path d="M670 362h50v44h-50M680 374h30m-30 14h30" />
                <circle cx="680" cy="452" r="10" />
                <circle cx="710" cy="452" r="10" />
                <path d="M500 286h150" strokeDasharray="8 5" />
              </g>

              <g
                fill="oklch(0.38 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="9"
                textAnchor="middle"
              >
                <text x="245" y="230">OPEN OFFICE NORTH</text>
                <text x="500" y="205">MEETING 02</text>
                <text x="660" y="205">MEETING 03</text>
                <text x="405" y="292">MAIN CORRIDOR</text>
                <text x="215" y="488">OPEN OFFICE SOUTH</text>
                <text x="395" y="472">FOCUS 01</text>
                <text x="465" y="472">FOCUS 02</text>
                <text x="543" y="448">STAIR 02</text>
                <text x="617" y="412">LIFT</text>
                <text x="617" y="498">RISER</text>
                <text x="695" y="488">TEA POINT</text>
              </g>

              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "door-clearance" ? 1 : 0.38}
              >
                <rect
                  x="455"
                  y="238"
                  width="62"
                  height="62"
                  fill={`color-mix(in oklab, ${getTypeAccent(
                    candidates[0],
                  )} 12%, transparent)`}
                  stroke={getTypeAccent(candidates[0])}
                  strokeDasharray="5 4"
                />
              </g>
              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "riser-note" ? 1 : 0.38}
              >
                <rect
                  x="586"
                  y="428"
                  width="62"
                  height="70"
                  fill={`color-mix(in oklab, ${getTypeAccent(
                    candidates[1],
                  )} 12%, transparent)`}
                  stroke={getTypeAccent(candidates[1])}
                  strokeDasharray="5 4"
                />
              </g>
              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "grid-offset" ? 1 : 0.38}
              >
                <rect
                  x="286"
                  y="82"
                  width="42"
                  height="100"
                  fill={`color-mix(in oklab, ${getTypeAccent(
                    candidates[2],
                  )} 10%, transparent)`}
                  stroke={getTypeAccent(candidates[2])}
                  strokeDasharray="5 4"
                />
              </g>

              <Marker
                candidate={candidates[0]}
                reviewState={reviewStates[candidates[0].id]}
                selected={selectedCandidateId === "door-clearance"}
                x={505}
                y={286}
                onSelect={selectCandidateFromDrawing}
              />
              <Marker
                candidate={candidates[1]}
                reviewState={reviewStates[candidates[1].id]}
                selected={selectedCandidateId === "riser-note"}
                x={640}
                y={448}
                onSelect={selectCandidateFromDrawing}
              />
              <Marker
                candidate={candidates[2]}
                reviewState={reviewStates[candidates[2].id]}
                selected={selectedCandidateId === "grid-offset"}
                x={310}
                y={96}
                onSelect={selectCandidateFromDrawing}
              />

              <g transform="translate(755 75)">
                <rect
                  width="110"
                  height="430"
                  fill="oklch(0.94 0.012 90)"
                  stroke="oklch(0.28 0.015 220)"
                  strokeWidth="2"
                />
                <path
                  d="M0 52h110M0 285h110M0 345h110M55 345v85"
                  stroke="oklch(0.28 0.015 220)"
                  strokeWidth="1"
                />
                <g
                  fill="oklch(0.32 0.018 220)"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  <text x="10" y="20" fontSize="10" fontWeight="700">
                    MODELSCOPE
                  </text>
                  <text x="10" y="36" fontSize="7">
                    COORDINATION REVIEW
                  </text>
                  <text x="10" y="310" fontSize="7">
                    LEVEL 02 FLOOR PLAN
                  </text>
                  <text x="10" y="327" fontSize="7">
                    STATUS: FOR REVIEW
                  </text>
                  <text x="10" y="370" fontSize="7">
                    SHEET
                  </text>
                  <text x="10" y="405" fontSize="18" fontWeight="700">
                    A-102
                  </text>
                  <text x="64" y="370" fontSize="7">
                    REV
                  </text>
                  <text x="72" y="405" fontSize="18" fontWeight="700">
                    P03
                  </text>
                </g>
              </g>
              <text
                x="70"
                y="560"
                fill="oklch(0.4 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="8"
              >
                SAMPLE DRAWING · NOT FOR CONSTRUCTION · MOCK REVIEW OVERLAY
              </text>
              <path
                d="M70 575h170m-85-7v14"
                stroke="oklch(0.35 0.018 220)"
                strokeWidth="2"
              />
              <text
                x="155"
                y="598"
                fill="oklch(0.4 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="8"
                textAnchor="middle"
              >
                0
                <tspan dx="74">5 m</tspan>
              </text>
            </svg>
          </div>
        </div>
      </section>

      <aside className="scrollbar-thin order-2 min-h-[180px] min-w-0 overflow-y-auto border-border bg-panel max-[900px]:w-full max-[900px]:border-t min-[901px]:order-3 min-[901px]:border-l">
        <div className="border-b border-border p-4">
          <div className="max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[720px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="size-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                Candidate review
              </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {reviewSummaryTitle}
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Mock visual cues for human assessment, not confirmed defects.
                </p>
              </div>
              <span className="whitespace-nowrap rounded-sm bg-ai/15 px-2 py-1 text-[10px] font-semibold leading-none text-ai-foreground">
                AI
              </span>
            </div>
            <div
              className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground"
              aria-live="polite"
            >
              <span>{remainingReviewCount} remaining</span>
              <span>{followUpCount} follow-up</span>
              <span>{createdIssueSummaries.length} issues created</span>
            </div>
            <div
              className="mt-3 grid grid-cols-2 rounded-md border border-border bg-panel-subtle/55 p-0.5"
              role="tablist"
              aria-label="Drawing triage right panel view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeRightPanelView === "review_candidates"}
                className={cn(
                  "min-h-8 rounded-[5px] px-2 py-1 text-[10px] font-semibold text-muted-foreground outline-none ring-ring transition-colors focus-visible:ring-2",
                  activeRightPanelView === "review_candidates" &&
                    "bg-card text-foreground shadow-sm",
                )}
                onClick={showReviewCandidates}
              >
                Review candidates
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRightPanelView === "created_issues"}
                className={cn(
                  "flex min-h-8 items-center justify-center gap-1.5 rounded-[5px] px-2 py-1 text-[10px] font-semibold text-muted-foreground outline-none ring-ring transition-colors focus-visible:ring-2",
                  activeRightPanelView === "created_issues" &&
                    "bg-card text-foreground shadow-sm",
                )}
                onClick={showCreatedIssues}
              >
                <span>Created issues </span>
                <span className="rounded-sm border border-border bg-panel px-1.5 py-0.5 text-[9px] leading-none">
                  {createdIssueSummaries.length}
                </span>
              </button>
            </div>
            {activeRightPanelView === "review_candidates" && (
              <div
                className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9px]"
                aria-label="Review candidate filter"
              >
                <span className="font-medium text-muted-foreground">
                  Showing:
                </span>
                <button
                  type="button"
                  aria-pressed={reviewCandidateFilter === "all"}
                  className={cn(
                    "rounded-sm px-1 py-0.5 font-semibold text-muted-foreground outline-none ring-ring transition-colors hover:text-foreground focus-visible:ring-2",
                    reviewCandidateFilter === "all" &&
                      "text-foreground underline decoration-border underline-offset-4",
                  )}
                  onClick={() => setReviewCandidateFilter("all")}
                >
                  All candidates
                </button>
                <span className="text-muted-foreground/45">·</span>
                <button
                  type="button"
                  aria-pressed={reviewCandidateFilter === "follow_up"}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm px-1 py-0.5 font-semibold text-muted-foreground outline-none ring-ring transition-colors hover:text-foreground focus-visible:ring-2",
                    followUpCount === 0 &&
                      reviewCandidateFilter !== "follow_up" &&
                      "text-muted-foreground/55 hover:text-muted-foreground",
                    reviewCandidateFilter === "follow_up" &&
                      "text-foreground underline decoration-border underline-offset-4",
                  )}
                  onClick={() => setReviewCandidateFilter("follow_up")}
                >
                  <Bookmark className="size-3" />
                  Follow-up only {followUpCount}
                </button>
              </div>
            )}
          </div>
        </div>

        {activeRightPanelView === "review_candidates" ? (
          <div className="space-y-2 p-3 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[560px]">
            {visibleReviewCandidates.length === 0 ? (
              <div className="border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground">
                No candidates are marked for follow-up.
              </div>
            ) : (
              visibleReviewCandidates.map((candidate) => {
              const selected = candidate.id === selectedCandidateId
              const { decision, isFollowUp } = reviewStates[candidate.id]
              const decisionLabel = getDecisionLabel(decision)
              const typeVisual = typeVisuals[candidate.type]
              const typeAccent = getTypeAccent(candidate)
              const candidateStyle = {
                borderColor: "var(--border)",
                borderLeftColor: typeAccent,
                borderLeftWidth: "3px",
                background: selected
                  ? `color-mix(in oklab, ${typeAccent} 7%, var(--card))`
                  : "var(--card)",
                boxShadow: selected
                  ? `0 0 0 1px color-mix(in oklab, ${typeAccent} 32%, transparent)`
                  : undefined,
              } as CSSProperties
              const decisionIsIssue = decision === "issue_created"
              const issueActionStyle = {
                borderColor: decisionIsIssue
                  ? `color-mix(in oklab, ${typeAccent} 22%, var(--border))`
                  : typeAccent,
                background: decisionIsIssue ? "var(--card)" : typeAccent,
                color: decisionIsIssue
                  ? `light-dark(var(--foreground), color-mix(in oklab, var(--foreground) 88%, ${typeAccent}))`
                  : typeVisual.ink,
                boxShadow: undefined,
              } as CSSProperties
              const followUpActionStyle = {
                borderColor: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 42%, var(--border))`
                  : `color-mix(in oklab, ${typeAccent} 92%, var(--border))`,
                background: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 5%, var(--card))`
                  : `color-mix(in oklab, ${typeAccent} 24%, var(--card))`,
                color: isFollowUp
                  ? `color-mix(in oklab, ${typeAccent} 64%, var(--foreground))`
                  : `light-dark(color-mix(in oklab, ${typeVisual.lightAccent} 40%, var(--foreground)), color-mix(in oklab, ${typeVisual.darkAccent} 82%, var(--foreground)))`,
                boxShadow: isFollowUp
                  ? `inset 0 0 0 1px color-mix(in oklab, ${typeAccent} 18%, transparent)`
                  : `inset 0 0 0 1px color-mix(in oklab, ${typeAccent} 16%, transparent)`,
              } as CSSProperties
              const followUpDisabled = decisionIsIssue

              return (
                <article
                  key={candidate.id}
                  ref={(node) => {
                    candidateCardRefs.current[candidate.id] = node
                  }}
                  tabIndex={-1}
                  data-review-state={decision}
                  data-follow-up={isFollowUp}
                  className={cn(
                    "relative w-full rounded-sm border bg-card outline-none ring-ring transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-2",
                  )}
                  style={candidateStyle}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className="w-full p-4 text-left outline-none ring-ring transition-colors duration-150 hover:bg-panel-subtle/35 focus-visible:ring-2"
                  >
                    <span className="block">
                      <span className="flex items-start gap-3">
                        <span
                          className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: typeAccent,
                            color: typeVisual.ink,
                          }}
                        >
                          {candidate.marker}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "flex flex-wrap items-center gap-2",
                              isFollowUp && "pr-8",
                            )}
                          >
                            <span
                              className="rounded-[5px] px-2 py-1 text-[10px] font-bold leading-none"
                              style={{
                                background: typeAccent,
                                color: typeVisual.ink,
                              }}
                            >
                              Type: {candidate.type}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[10px] font-semibold leading-none"
                              style={{
                                background: decisionIsIssue
                                  ? typeAccent
                                  : `color-mix(in oklab, ${typeAccent} 13%, var(--card))`,
                                color: decisionIsIssue
                                  ? typeVisual.ink
                                  : `color-mix(in oklab, ${typeAccent} 58%, var(--foreground))`,
                              }}
                            >
                              {decisionIsIssue && (
                                <AlertTriangle className="size-3" />
                              )}
                              {decisionLabel}
                            </span>
                          </span>
                        </span>
                      </span>
                      <span className="mt-4 block text-[13px] font-semibold leading-snug text-foreground">
                        {candidate.title}
                      </span>
                      <span className="mt-2 block text-[11px] leading-relaxed text-muted-foreground">
                        {candidate.summary}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
                        <span>{candidate.confidence}</span>
                        <span aria-hidden="true">·</span>
                        <span>{candidate.risk}</span>
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                        <MapPin
                          className="size-3"
                          style={{ color: typeAccent }}
                        />
                        {candidate.region}
                      </span>
                    </span>
                  </button>

                  {isFollowUp && (
                    <span
                      aria-label="Follow-up flag active"
                      title="Follow-up flag active"
                      className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md border bg-card"
                      style={{
                        borderColor: `color-mix(in oklab, ${typeAccent} 60%, var(--border))`,
                        background: `color-mix(in oklab, ${typeAccent} 9%, var(--card))`,
                        color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                      }}
                    >
                      <Bookmark className="size-4 fill-current" />
                    </span>
                  )}

                  {decisionIsIssue && (
                    <div
                      className="mx-4 flex items-start gap-1.5 border-t border-border/70 py-2.5 text-[9px] font-medium leading-relaxed"
                      style={{
                        color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                      }}
                      role="status"
                    >
                      <AlertTriangle className="mt-px size-3 shrink-0" />
                      <span>
                        Issue created by an explicit human review decision.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2 border-t border-border/60 p-4 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                      style={issueActionStyle}
                      aria-pressed={decisionIsIssue}
                      onClick={() =>
                        decisionIsIssue
                          ? setIssuePendingRemoval(candidate.id)
                          : convertCandidateToIssue(candidate.id)
                      }
                    >
                      {decisionIsIssue ? (
                        <X className="size-4" />
                      ) : (
                        <AlertTriangle className="size-4" />
                      )}
                      {decisionIsIssue ? "Remove issue" : "Convert to issue"}
                    </Button>
                    {!followUpDisabled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                        style={followUpActionStyle}
                        aria-pressed={isFollowUp}
                        onClick={() => toggleFollowUp(candidate.id)}
                      >
                        <Bookmark
                          className={cn("size-4", isFollowUp && "fill-current")}
                        />
                        {isFollowUp
                          ? "Remove from follow-up"
                          : "Keep for follow-up"}
                      </Button>
                    )}
                  </div>
                </article>
              )
              })
            )}
          </div>
        ) : (
          <div className="space-y-2 p-3 max-[900px]:mx-auto max-[900px]:w-full max-[900px]:max-w-[560px]">
            {createdIssueSummaries.length === 0 ? (
              <div className="border border-dashed border-border bg-panel-subtle/45 p-3 text-[10px] leading-relaxed text-muted-foreground">
                Converted candidates will appear here as compact local issue
                summaries.
              </div>
            ) : (
              createdIssueSummaries.map(({ issue, candidate }) => {
                const typeVisual = typeVisuals[candidate.type]
                const typeAccent = getTypeAccent(candidate)
                const selected = candidate.id === selectedCandidateId
                const cardStyle = {
                  borderColor: selected
                    ? `color-mix(in oklab, ${typeAccent} 42%, var(--border))`
                    : "var(--border)",
                  background: selected
                    ? `color-mix(in oklab, ${typeAccent} 6%, var(--card))`
                    : "var(--card)",
                  boxShadow: selected
                    ? `0 0 0 1px color-mix(in oklab, ${typeAccent} 22%, transparent)`
                    : undefined,
                } as CSSProperties
                const viewActionStyle = {
                  borderColor: typeAccent,
                  background: typeAccent,
                  color: typeVisual.ink,
                } as CSSProperties
                const removeActionStyle = {
                  borderColor: `color-mix(in oklab, ${typeAccent} 24%, var(--border))`,
                  background: "var(--card)",
                  color: `light-dark(var(--foreground), color-mix(in oklab, var(--foreground) 88%, ${typeAccent}))`,
                } as CSSProperties

                return (
                  <article
                    key={issue.issueId}
                    ref={(node) => {
                      issueCardRefs.current[issue.candidateId] = node
                    }}
                    tabIndex={-1}
                    className="rounded-sm border p-3 outline-none ring-ring transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-2"
                    style={cardStyle}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-[5px] border border-border bg-panel px-2 py-1 text-[10px] font-bold leading-none text-foreground">
                        {issue.issueId}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-[5px] border px-2 py-1 text-[10px] font-semibold leading-none"
                        style={{
                          borderColor: `color-mix(in oklab, ${typeAccent} 34%, var(--border))`,
                          background: `color-mix(in oklab, ${typeAccent} 10%, var(--card))`,
                          color: `color-mix(in oklab, ${typeAccent} 68%, var(--foreground))`,
                        }}
                      >
                        <AlertTriangle className="size-3" />
                        Issue created
                      </span>
                    </div>
                    <h3 className="mt-3 text-[13px] font-semibold leading-snug text-foreground">
                      {candidate.title}
                    </h3>
                    <div className="mt-2 space-y-1 text-[10px] leading-snug text-muted-foreground">
                      <p>
                        Type:{" "}
                        <span className="font-semibold text-foreground">
                          {candidate.type}
                        </span>
                      </p>
                      <p>
                        Priority:{" "}
                        <span className="font-semibold text-foreground">
                          {getPriorityLabel(candidate)}
                        </span>
                      </p>
                      <p>
                        Source:{" "}
                        <span className="font-semibold text-foreground">
                          Candidate {candidate.marker}
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="h-8 w-full justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                        style={viewActionStyle}
                        onClick={() => viewIssueOnSheet(issue.candidateId)}
                      >
                        <MapPin className="size-3.5" />
                        View on sheet
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="h-8 w-full justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                        style={removeActionStyle}
                        onClick={() => setIssuePendingRemoval(issue.candidateId)}
                      >
                        <X className="size-3.5" />
                        Remove issue
                      </Button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}

        <div className="mx-3 mb-3 flex gap-2 border border-border bg-panel-subtle/55 p-3 text-[10px] leading-relaxed text-muted-foreground max-[900px]:mx-auto max-[900px]:w-[calc(100%-1.5rem)] max-[900px]:max-w-[696px]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <p>
            Confidence and priority are review-support metadata. Verify against
            the full drawing set and project requirements before acting.
          </p>
        </div>
      </aside>

      </main>
      <AlertDialog
      open={removeDrawingDialogOpen}
      onOpenChange={setRemoveDrawingDialogOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove drawing?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the current drawing and clear its local triage results, created issues and follow-up state. This cannot be undone in this prototype.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={removeDrawing}
          >
            Remove drawing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
      open={issuePendingRemoval !== null}
      onOpenChange={(open) => {
        if (!open) setIssuePendingRemoval(null)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove issue?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the created issue from the local review list. The original AI candidate will remain available on the sheet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (issuePendingRemoval) {
                removeCandidateIssue(issuePendingRemoval)
              }
            }}
          >
            Remove issue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
