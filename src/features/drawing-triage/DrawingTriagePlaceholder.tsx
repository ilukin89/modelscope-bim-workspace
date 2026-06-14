import { useState } from "react"
import {
  AlertTriangle,
  Bot,
  Check,
  FileStack,
  Layers3,
  MapPin,
  ScanSearch,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CandidateId = "door-clearance" | "riser-note" | "grid-offset"

type Candidate = {
  id: CandidateId
  marker: number
  title: string
  status: "Needs review" | "Follow-up" | "Candidate"
  summary: string
  confidence: string
  risk: string
  region: string
}

const candidates: Candidate[] = [
  {
    id: "door-clearance",
    marker: 1,
    title: "Door swing near circulation path",
    status: "Needs review",
    summary:
      "The meeting-room door arc appears close to the main corridor clearance zone.",
    confidence: "82% visual match",
    risk: "Medium review priority",
    region: "Grid C4 · Meeting 02",
  },
  {
    id: "riser-note",
    marker: 2,
    title: "Riser annotation may be incomplete",
    status: "Follow-up",
    summary:
      "A service riser is drawn without a matching keynote on this sheet excerpt.",
    confidence: "68% visual match",
    risk: "Low review priority",
    region: "Grid D2 · Core",
  },
  {
    id: "grid-offset",
    marker: 3,
    title: "Partition alignment differs at grid line",
    status: "Candidate",
    summary:
      "The north partition appears offset from the adjacent structural grid reference.",
    confidence: "74% visual match",
    risk: "Medium review priority",
    region: "Grid B1 · Open office",
  },
]

const statusStyles: Record<Candidate["status"], string> = {
  "Needs review": "bg-warning/15 text-warning-foreground",
  "Follow-up": "bg-primary/12 text-primary",
  Candidate: "bg-ai/15 text-ai-foreground",
}

function Marker({
  candidate,
  selected,
  x,
  y,
  onSelect,
}: {
  candidate: Candidate
  selected: boolean
  x: number
  y: number
  onSelect: (id: CandidateId) => void
}) {
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
        fill={
          selected
            ? "color-mix(in oklab, var(--selected) 22%, transparent)"
            : "color-mix(in oklab, var(--warning) 14%, transparent)"
        }
        stroke={selected ? "var(--selected)" : "var(--warning)"}
        strokeWidth={selected ? 3 : 2}
      />
      <circle
        cx={x}
        cy={y}
        r={12}
        fill={selected ? "var(--selected)" : "var(--warning)"}
      />
      <text
        x={x}
        y={y + 4}
        fill="var(--primary-foreground)"
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
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0]

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
                    3 review candidates
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
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-panel/90 px-4 py-2">
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
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
            <Layers3 className="size-3.5" />
            <span className="max-[520px]:hidden">Candidate overlay</span>
            <span className="rounded-sm bg-ai/15 px-1.5 py-0.5 font-medium text-ai-foreground">
              On
            </span>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 border border-border bg-panel px-2.5 py-1.5 text-[10px] shadow-sm">
            <MapPin className="size-3.5 text-primary" />
            <span className="max-w-[42vw] truncate">
              Candidate {selectedCandidate.marker}: {selectedCandidate.region}
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
                <line x1="92" y1="54" x2="92" y2="540" />
                <line x1="300" y1="54" x2="300" y2="540" />
                <line x1="510" y1="54" x2="510" y2="540" />
                <line x1="718" y1="54" x2="718" y2="540" />
                <line x1="55" y1="110" x2="795" y2="110" />
                <line x1="55" y1="300" x2="795" y2="300" />
                <line x1="55" y1="490" x2="795" y2="490" />
              </g>

              <g
                fill="oklch(0.32 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                <text x="92" y="42">A</text>
                <text x="300" y="42">B</text>
                <text x="510" y="42">C</text>
                <text x="718" y="42">D</text>
                <text x="38" y="114">1</text>
                <text x="38" y="304">2</text>
                <text x="38" y="494">3</text>
              </g>

              <g
                fill="none"
                stroke="oklch(0.28 0.015 220)"
                strokeLinecap="square"
              >
                <rect x="70" y="75" width="670" height="430" strokeWidth="9" />
                <path
                  d="M70 215h185m52 0h208m48 0h177M70 380h140m55 0h120m50 0h305"
                  strokeWidth="6"
                />
                <path
                  d="M255 75v140m0 165v125M515 75v140m0 165v125M650 75v140M385 215v165"
                  strokeWidth="6"
                />
                <rect x="535" y="235" width="92" height="112" strokeWidth="5" />
                <rect x="90" y="235" width="86" height="112" strokeWidth="4" />
                <path d="M210 380v-52a52 52 0 0 1 52 52" strokeWidth="2" />
                <path d="M515 165h-46a46 46 0 0 0 46 46" strokeWidth="2" />
                <path d="M650 165h44a44 44 0 0 1-44 44" strokeWidth="2" />
                <path d="M385 270h-42a42 42 0 0 0 42 42" strokeWidth="2" />
                <path d="M515 430h-42a42 42 0 0 1 42-42" strokeWidth="2" />
              </g>

              <g
                fill="none"
                stroke="oklch(0.56 0.03 220)"
                strokeWidth="2"
              >
                <rect x="108" y="255" width="50" height="72" />
                <path d="M118 268h30m-30 12h30m-30 12h30m-30 12h30" />
                <rect x="550" y="250" width="62" height="82" />
                <path d="M560 264h42m-42 13h42m-42 13h42m-42 13h42" />
                <rect x="285" y="255" width="62" height="30" rx="2" />
                <circle cx="298" cy="270" r="4" />
                <circle cx="334" cy="270" r="4" />
                <rect x="285" y="315" width="62" height="30" rx="2" />
                <circle cx="298" cy="330" r="4" />
                <circle cx="334" cy="330" r="4" />
                <path d="M675 245h42m-42 16h42m-42 16h42m-42 16h42m-42 16h42m-42 16h42" />
                <path d="M105 120h105m-105 25h105m-105 25h105" />
                <path d="M285 120h185m-185 25h185m-185 25h185" />
              </g>

              <g
                fill="oklch(0.38 0.018 220)"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="9"
                textAnchor="middle"
              >
                <text x="160" y="197">OPEN OFFICE</text>
                <text x="385" y="197">OPEN OFFICE</text>
                <text x="585" y="197">MEETING 02</text>
                <text x="695" y="197">MEETING 03</text>
                <text x="132" y="365">STAIR 02</text>
                <text x="316" y="365">TEA POINT</text>
                <text x="450" y="365">CORRIDOR</text>
                <text x="580" y="365">SERVICE RISER</text>
                <text x="695" y="365">CORE</text>
                <text x="165" y="470">OPEN OFFICE</text>
                <text x="450" y="470">PROJECT ROOM</text>
                <text x="630" y="470">FOCUS ROOMS</text>
              </g>

              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "door-clearance" ? 1 : 0.38}
              >
                <rect
                  x="474"
                  y="146"
                  width="84"
                  height="86"
                  fill="color-mix(in oklab, var(--warning) 12%, transparent)"
                  stroke="var(--warning)"
                  strokeDasharray="5 4"
                />
              </g>
              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "riser-note" ? 1 : 0.38}
              >
                <rect
                  x="525"
                  y="225"
                  width="112"
                  height="132"
                  fill="color-mix(in oklab, var(--ai) 12%, transparent)"
                  stroke="var(--ai)"
                  strokeDasharray="5 4"
                />
              </g>
              <g
                fill="none"
                strokeWidth="2"
                opacity={selectedCandidateId === "grid-offset" ? 1 : 0.38}
              >
                <rect
                  x="245"
                  y="64"
                  width="78"
                  height="165"
                  fill="color-mix(in oklab, var(--selected) 10%, transparent)"
                  stroke="var(--selected)"
                  strokeDasharray="5 4"
                />
              </g>

              <Marker
                candidate={candidates[0]}
                selected={selectedCandidateId === "door-clearance"}
                x={530}
                y={158}
                onSelect={setSelectedCandidateId}
              />
              <Marker
                candidate={candidates[1]}
                selected={selectedCandidateId === "riser-note"}
                x={620}
                y={240}
                onSelect={setSelectedCandidateId}
              />
              <Marker
                candidate={candidates[2]}
                selected={selectedCandidateId === "grid-offset"}
                x={300}
                y={92}
                onSelect={setSelectedCandidateId}
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
              <h2 className="text-sm font-semibold">3 observations to review</h2>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Mock visual cues for human assessment, not confirmed defects.
              </p>
            </div>
            <span className="rounded-sm bg-ai/15 px-1.5 py-0.5 text-[9px] font-semibold text-ai-foreground">
              AI aid
            </span>
          </div>
        </div>

        <div className="space-y-2 p-3">
          {candidates.map((candidate) => {
            const selected = candidate.id === selectedCandidateId

            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={cn(
                  "w-full rounded-sm border bg-card p-3 text-left outline-none transition-[border-color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-selected bg-accent/55"
                    : "border-border hover:border-muted-foreground/45 hover:bg-panel-subtle/60",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                      selected
                        ? "bg-selected text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {candidate.marker}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[9px] font-semibold",
                          statusStyles[candidate.status],
                        )}
                      >
                        {candidate.status}
                      </span>
                    </span>
                    <span className="mt-2 block text-[11px] font-semibold leading-snug">
                      {candidate.title}
                    </span>
                    <span className="mt-1.5 block text-[10px] leading-relaxed text-muted-foreground">
                      {candidate.summary}
                    </span>
                    <span className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1 border-t border-border pt-2 text-[9px] text-muted-foreground">
                      <span>{candidate.confidence}</span>
                      <span aria-hidden="true">·</span>
                      <span>{candidate.risk}</span>
                    </span>
                    <span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-foreground">
                      <MapPin className="size-3 text-primary" />
                      {candidate.region}
                    </span>
                  </span>
                </div>
              </button>
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
