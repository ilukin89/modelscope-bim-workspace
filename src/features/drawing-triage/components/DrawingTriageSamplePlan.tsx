import { DrawingTriageMarker } from "./DrawingTriageMarker"
import { getTypeAccent } from "../data/drawingTriageData"
import type { Candidate, CandidateId, CandidateReviewState } from "../types"

const candidateMarkerPositions: Record<
  CandidateId,
  {
    x: number
    y: number
    region: { x: number; y: number; width: number; height: number }
  }
> = {
  "door-clearance": {
    x: 505,
    y: 286,
    region: { x: 455, y: 238, width: 62, height: 62 },
  },
  "riser-note": {
    x: 640,
    y: 448,
    region: { x: 586, y: 428, width: 62, height: 70 },
  },
  "grid-offset": {
    x: 310,
    y: 96,
    region: { x: 286, y: 82, width: 42, height: 100 },
  },
  "furniture-access": {
    x: 405,
    y: 395,
    region: { x: 367, y: 360, width: 70, height: 70 },
  },
  "room-label": {
    x: 228,
    y: 472,
    region: { x: 198, y: 444, width: 54, height: 52 },
  },
  "service-door": {
    x: 675,
    y: 276,
    region: { x: 638, y: 236, width: 66, height: 62 },
  },
  "revision-note": {
    x: 576,
    y: 110,
    region: { x: 545, y: 86, width: 62, height: 48 },
  },
  "door-furniture-conflict": {
    x: 465,
    y: 472,
    region: { x: 438, y: 438, width: 54, height: 54 },
  },
  "corridor-boundary": {
    x: 535,
    y: 322,
    region: { x: 500, y: 286, width: 70, height: 54 },
  },
}

type DrawingTriageSamplePlanProps = {
  candidates: Candidate[]
  reviewStates: Record<CandidateId, CandidateReviewState>
  selectedCandidateId: CandidateId
  onSelectCandidate: (candidateId: CandidateId) => void
}

export function DrawingTriageSamplePlan({
  candidates,
  reviewStates,
  selectedCandidateId,
  onSelectCandidate,
}: DrawingTriageSamplePlanProps) {
  return (
    <div className="relative w-full max-w-[900px] border border-border bg-[oklch(0.965_0.012_90)] shadow-[0_12px_32px_color-mix(in_oklab,var(--foreground)_12%,transparent)]">
      <svg
        viewBox="0 0 900 620"
        role="img"
        aria-labelledby="plan-title plan-description"
        className="block h-auto w-full"
      >
        <title id="plan-title">Sample Level 02 architectural plan</title>
        <desc id="plan-description">
          A mock office floor plan with nine numbered candidate observation
          markers. The selected marker matches the selected review card.
        </desc>
        <rect
          x="0"
          y="0"
          width="900"
          height="620"
          fill="oklch(0.965 0.012 90)"
        />

        <g stroke="oklch(0.72 0.018 220)" strokeDasharray="6 6" strokeWidth="1">
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
          <text x="110" y="42">
            A
          </text>
          <text x="300" y="42">
            B
          </text>
          <text x="490" y="42">
            C
          </text>
          <text x="680" y="42">
            D
          </text>
          <text x="38" y="114">
            1
          </text>
          <text x="38" y="294">
            2
          </text>
          <text x="38" y="484">
            3
          </text>
        </g>

        <g fill="none" stroke="oklch(0.28 0.015 220)" strokeLinecap="square">
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

        <g fill="none" stroke="oklch(0.56 0.03 220)" strokeWidth="2">
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
          <text x="245" y="230">
            OPEN OFFICE NORTH
          </text>
          <text x="500" y="205">
            MEETING 02
          </text>
          <text x="660" y="205">
            MEETING 03
          </text>
          <text x="405" y="292">
            MAIN CORRIDOR
          </text>
          <text x="215" y="488">
            OPEN OFFICE SOUTH
          </text>
          <text x="395" y="472">
            FOCUS 01
          </text>
          <text x="465" y="472">
            FOCUS 02
          </text>
          <text x="543" y="448">
            STAIR 02
          </text>
          <text x="617" y="412">
            LIFT
          </text>
          <text x="617" y="498">
            RISER
          </text>
          <text x="695" y="488">
            TEA POINT
          </text>
        </g>

        {candidates.map((candidate) => {
          const position = candidateMarkerPositions[candidate.id]
          const typeAccent = getTypeAccent(candidate)

          return (
            <g
              key={`${candidate.id}-evidence`}
              fill="none"
              strokeWidth="2"
              opacity={selectedCandidateId === candidate.id ? 1 : 0.38}
            >
              <rect
                x={position.region.x}
                y={position.region.y}
                width={position.region.width}
                height={position.region.height}
                fill={`color-mix(in oklab, ${typeAccent} 12%, transparent)`}
                stroke={typeAccent}
                strokeDasharray="5 4"
              />
            </g>
          )
        })}

        {candidates.map((candidate) => {
          const position = candidateMarkerPositions[candidate.id]

          return (
            <DrawingTriageMarker
              key={candidate.id}
              candidate={candidate}
              reviewState={reviewStates[candidate.id]}
              selected={selectedCandidateId === candidate.id}
              x={position.x}
              y={position.y}
              onSelect={onSelectCandidate}
            />
          )
        })}

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
          0<tspan dx="74">5 m</tspan>
        </text>
      </svg>
    </div>
  )
}
