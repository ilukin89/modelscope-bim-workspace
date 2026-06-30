import { getTypeAccent, typeVisuals } from "../data/drawingTriageData"
import type { Candidate, CandidateId, CandidateReviewState } from "../types"

type DrawingTriageMarkerProps = {
  candidate: Candidate
  reviewState: CandidateReviewState
  selected: boolean
  x: number
  y: number
  onSelect: (id: CandidateId) => void
}

export function DrawingTriageMarker({
  candidate,
  reviewState,
  selected,
  x,
  y,
  onSelect,
}: DrawingTriageMarkerProps) {
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
          <path d="M4.5 3.5h6v8l-3-2.1-3 2.1z" fill={stroke} stroke="none" />
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
