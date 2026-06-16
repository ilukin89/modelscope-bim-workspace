import { useRef, useState, type CSSProperties } from "react"
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
import { cn } from "@/lib/utils"

type CandidateId = "door-clearance" | "riser-note" | "grid-offset"
type ReviewDecision = "unreviewed" | "issue_created"
type CandidateReviewState = {
  decision: ReviewDecision
  isFollowUp: boolean
}

type Candidate = {
  id: CandidateId
  marker: number
  type: CandidateType
  title: string
  summary: string
  confidence: string
  risk: string
  region: string
}

type CandidateType = "Clearance" | "Annotation" | "Alignment"

const typeVisuals: Record<
  CandidateType,
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

const initialReviewStates: Record<CandidateId, CandidateReviewState> = {
  "door-clearance": { decision: "unreviewed", isFollowUp: false },
  "riser-note": { decision: "unreviewed", isFollowUp: false },
  "grid-offset": { decision: "unreviewed", isFollowUp: false },
}

const candidates: Candidate[] = [
  {
    id: "door-clearance",
    marker: 1,
    type: "Clearance",
    title: "Door swing near circulation path",
    summary:
      "The meeting-room door arc appears close to the main corridor clearance zone.",
    confidence: "82% visual match",
    risk: "Medium review priority",
    region: "Grid C4 · Meeting 02",
  },
  {
    id: "riser-note",
    marker: 2,
    type: "Annotation",
    title: "Riser annotation may be incomplete",
    summary:
      "A service riser is drawn without a matching keynote on this sheet excerpt.",
    confidence: "68% visual match",
    risk: "Low review priority",
    region: "Grid D2 · Core",
  },
  {
    id: "grid-offset",
    marker: 3,
    type: "Alignment",
    title: "Partition alignment differs at grid line",
    summary:
      "The north partition appears offset from the adjacent structural grid reference.",
    confidence: "74% visual match",
    risk: "Medium review priority",
    region: "Grid B1 · Open office",
  },
]

function getTypeAccent(candidate: Candidate) {
  const typeVisual = typeVisuals[candidate.type]
  return `light-dark(${typeVisual.lightAccent}, ${typeVisual.darkAccent})`
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
  const emphasis = reviewState.decision === "issue_created"

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
        stroke={accent}
        strokeWidth={selected ? 3 : emphasis ? 2.5 : 2}
      />
      <circle
        cx={x}
        cy={y}
        r={12}
        fill={`color-mix(in oklab, ${accent} ${
          emphasis ? "34%" : "28%"
        }, oklch(0.965 0.012 90))`}
        stroke={accent}
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
    </g>
  )
}

export function DrawingTriagePlaceholder() {
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<CandidateId>("door-clearance")
  const [reviewStates, setReviewStates] = useState(initialReviewStates)
  const candidateCardRefs = useRef<
    Partial<Record<CandidateId, HTMLElement | null>>
  >({})
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0]
  const selectedReviewState = reviewStates[selectedCandidate.id]
  const remainingReviewCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].decision === "unreviewed",
  ).length
  const issueCreatedCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].decision === "issue_created",
  ).length
  const followUpCount = candidates.filter(
    (candidate) => reviewStates[candidate.id].isFollowUp,
  ).length

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
      },
    }))
  }

  function toggleIssue(candidateId: CandidateId) {
    const nextDecision =
      reviewStates[candidateId].decision === "issue_created"
        ? "unreviewed"
        : "issue_created"

    updateReviewDecision(candidateId, nextDecision)
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
    setSelectedCandidateId(candidateId)
    window.requestAnimationFrame(() => {
      candidateCardRefs.current[candidateId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    })
  }

  function getDecisionLabel(decision: ReviewDecision) {
    if (decision === "issue_created") return "Issue created"
    return "Needs review"
  }

  return (
    <main
      id="workspace-content"
      aria-labelledby="drawing-triage-heading"
      className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_316px] overflow-hidden max-[1160px]:grid-cols-[220px_minmax(0,1fr)_280px] max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto"
    >
      <aside className="scrollbar-thin order-2 min-h-[180px] overflow-y-auto border-r border-border bg-panel min-[901px]:order-1">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileStack className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Drawing context
            </span>
          </div>
          <h2 className="mt-4 text-sm font-semibold">Level 02 floor plan</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            A-102 · Coordination issue set
          </p>
        </div>

        <div className="space-y-5 p-4">
          <section aria-labelledby="artifact-heading">
            <h3
              id="artifact-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              Artifact
            </h3>
            <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-2 text-[11px]">
              <dt className="text-muted-foreground">File</dt>
              <dd className="truncate font-medium">MS_A102_review.pdf</dd>
              <dt className="text-muted-foreground">Revision</dt>
              <dd>Rev P03 · 14 May 2026</dd>
              <dt className="text-muted-foreground">Scale</dt>
              <dd>1:100 at A1</dd>
              <dt className="text-muted-foreground">Discipline</dt>
              <dd>Architecture</dd>
            </dl>
          </section>

          <section aria-labelledby="sheets-heading">
            <div className="flex items-center justify-between">
              <h3
                id="sheets-heading"
                className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Sheets
              </h3>
              <span className="text-[10px] text-muted-foreground">1 of 3</span>
            </div>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                aria-current="page"
                className="flex w-full items-center gap-2 rounded-sm bg-accent px-2.5 py-2 text-left text-[11px] text-accent-foreground outline-none ring-ring focus-visible:ring-2"
              >
                <span className="flex size-5 items-center justify-center rounded-sm bg-primary text-[9px] font-bold text-primary-foreground">
                  02
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    Level 02 floor plan
                  </span>
                  <span className="block text-[9px] opacity-75">
                    {remainingReviewCount === 0
                      ? "Review decisions complete"
                      : `${remainingReviewCount} awaiting decision`}
                  </span>
                </span>
                <Check className="size-3.5" />
              </button>
              <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] text-muted-foreground">
                <span className="flex size-5 items-center justify-center rounded-sm bg-muted text-[9px] font-bold">
                  01
                </span>
                Level 01 floor plan
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] text-muted-foreground">
                <span className="flex size-5 items-center justify-center rounded-sm bg-muted text-[9px] font-bold">
                  R
                </span>
                Roof plan
              </div>
            </div>
          </section>

          <div className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Sample artifact and metadata. No file upload, storage, or document
            processing is active.
          </div>
        </div>
      </aside>

      <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-canvas min-[901px]:order-2">
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

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 border border-border bg-panel px-2.5 py-1.5 text-[10px] shadow-sm">
            <MapPin className="size-3.5 text-primary" />
            <span className="max-w-[42vw] truncate">
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

      <aside className="scrollbar-thin order-3 min-h-[180px] overflow-y-auto border-l border-border bg-panel">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
              Candidate review
            </span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {remainingReviewCount === 0
                  ? "Review decisions complete"
                  : `${remainingReviewCount} of ${candidates.length} observations to review`}
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
            <span>{issueCreatedCount} issues created</span>
            <span>{followUpCount} follow-up</span>
          </div>
        </div>

        <div className="space-y-2 p-3">
          {candidates.map((candidate) => {
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
                ? `color-mix(in oklab, ${typeAccent} 54%, var(--border))`
                : typeAccent,
              background: decisionIsIssue
                ? `color-mix(in oklab, ${typeAccent} 8%, var(--card))`
                : typeAccent,
              color: decisionIsIssue
                ? `color-mix(in oklab, ${typeAccent} 66%, var(--foreground))`
                : typeVisual.ink,
              boxShadow: undefined,
            } as CSSProperties
            const followUpActionStyle = {
              borderColor: isFollowUp
                ? `color-mix(in oklab, ${typeAccent} 36%, var(--border))`
                : `color-mix(in oklab, ${typeAccent} 58%, var(--border))`,
              background: isFollowUp
                ? "var(--card)"
                : `color-mix(in oklab, ${typeAccent} 12%, var(--card))`,
              color: isFollowUp
                ? `color-mix(in oklab, ${typeAccent} 56%, var(--foreground))`
                : `color-mix(in oklab, ${typeAccent} 62%, var(--foreground))`,
              boxShadow: undefined,
            } as CSSProperties

            return (
              <article
                key={candidate.id}
                ref={(node) => {
                  candidateCardRefs.current[candidate.id] = node
                }}
                data-review-state={decision}
                data-follow-up={isFollowUp}
                className={cn(
                  "relative w-full rounded-sm border bg-card transition-[border-color,background-color,box-shadow] duration-150",
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
                      <MapPin className="size-3" style={{ color: typeAccent }} />
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

                <div
                  className="grid gap-2 border-t border-border/60 p-4 pt-3"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(132px, 1fr))",
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="h-9 w-full justify-center gap-2 rounded-md border px-3 text-[11px] font-semibold tracking-normal shadow-none transition-[filter,background-color,border-color] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:hover:brightness-110"
                    style={issueActionStyle}
                    aria-pressed={decisionIsIssue}
                    onClick={() => toggleIssue(candidate.id)}
                  >
                    {decisionIsIssue ? (
                      <X className="size-4" />
                    ) : (
                      <AlertTriangle className="size-4" />
                    )}
                    {decisionIsIssue ? "Remove issue" : "Convert to issue"}
                  </Button>
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
                </div>
              </article>
            )
          })}
        </div>

        <div className="mx-3 mb-3 flex gap-2 border border-border bg-panel-subtle/55 p-3 text-[10px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <p>
            Confidence and priority are review-support metadata. Verify against
            the full drawing set and project requirements before acting.
          </p>
        </div>
      </aside>
    </main>
  )
}
