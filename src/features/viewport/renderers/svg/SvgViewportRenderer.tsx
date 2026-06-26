import type { ViewportRendererProps } from "@/features/viewport/renderers/types"
import type { HighlightKind } from "@/types"

export function SvgViewportRenderer({
  activeTool,
  aiReviewFindingCount,
  aiReviewFindingSpatialCounts,
  aiReviewVisualsActive,
  floors,
  modelFocusActive,
  modelFocusRequest,
  previewActive,
  selectedFloor,
  selectedIssue,
  selectedAiFindingActive,
  visibleLayerIds,
}: ViewportRendererProps) {
  const architectureVisible = visibleLayerIds.includes("architecture")
  const mechanicalVisible = visibleLayerIds.includes("mechanical")
  const structureVisible = visibleLayerIds.includes("structure")
  const electricalVisible = visibleLayerIds.includes("electrical")
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )
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
  const selectedIssueHighlight = selectedIssue.highlight

  return (
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
      <defs>
        <linearGradient
          id="viewport-roof-surface"
          x1="245"
          y1="105"
          x2="570"
          y2="190"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel) 76%, transparent)"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel-subtle) 58%, transparent)"
          />
        </linearGradient>
        <linearGradient
          id="viewport-left-surface"
          x1="235"
          y1="155"
          x2="390"
          y2="505"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel) 62%, transparent)"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel-subtle) 36%, transparent)"
          />
        </linearGradient>
        <linearGradient
          id="viewport-right-surface"
          x1="405"
          y1="205"
          x2="590"
          y2="470"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel-subtle) 52%, transparent)"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel) 28%, transparent)"
          />
        </linearGradient>
        <linearGradient
          id="viewport-core-surface"
          x1="330"
          y1="150"
          x2="485"
          y2="445"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel-subtle) 88%, var(--foreground))"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel) 72%, var(--canvas))"
          />
        </linearGradient>
        <linearGradient
          id="viewport-base-surface"
          x1="205"
          y1="410"
          x2="625"
          y2="510"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel-subtle) 68%, var(--canvas))"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel) 42%, var(--canvas))"
          />
        </linearGradient>
        <linearGradient
          id="viewport-slab-edge"
          x1="235"
          y1="0"
          x2="598"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--panel-subtle) 82%, var(--canvas))"
          />
          <stop
            offset="0.48"
            stopColor="color-mix(in oklab, var(--panel) 76%, var(--canvas))"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--panel) 58%, var(--canvas))"
          />
        </linearGradient>
        <linearGradient
          id="viewport-duct-top"
          x1="305"
          y1="300"
          x2="535"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--ai) 64%, var(--panel))"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--ai) 42%, var(--panel))"
          />
        </linearGradient>
        <linearGradient
          id="viewport-duct-side"
          x1="349"
          y1="330"
          x2="535"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="color-mix(in oklab, var(--ai) 42%, var(--panel))"
          />
          <stop
            offset="1"
            stopColor="color-mix(in oklab, var(--ai) 27%, var(--canvas))"
          />
        </linearGradient>
        <filter
          id="viewport-ground-shadow"
          x="-20%"
          y="-40%"
          width="140%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter
          id="viewport-object-shadow"
          x="-20%"
          y="-30%"
          width="150%"
          height="170%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="6"
            floodColor="oklch(0.12 0.012 220)"
            floodOpacity="0.22"
          />
        </filter>
      </defs>

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
            activeTool === "Pan" ? "translate(14px, -8px)" : "translate(0, 0)",
        }}
      >
        <path d="M65 522 367 602 695 490 391 420Z" />
        <path d="M105 541 405 452M170 558 470 468M237 575 535 483M304 593 600 499" />
        <path d="M126 506 428 585M191 484 493 566M258 463 559 546M324 442 625 525" />
      </g>

      <path
        d="M211 478 382 563 631 486 455 403Z"
        fill="oklch(0.12 0.012 220)"
        opacity="0.24"
        filter="url(#viewport-ground-shadow)"
        pointerEvents="none"
      />

      <g stroke="var(--border)" strokeWidth="2" strokeLinejoin="round">
        <g
          data-viewport-layer="architecture"
          data-visible={architectureVisible}
          opacity={architectureVisible ? 1 : 0.08}
          className="transition-opacity duration-200"
        >
          <g filter="url(#viewport-object-shadow)">
            <path
              d="M192 438 380 536 638 458 449 365Z"
              fill="url(#viewport-base-surface)"
              stroke="color-mix(in oklab, var(--border) 72%, var(--foreground))"
              strokeWidth="1.5"
            />
            <path
              d="M192 438 380 536 638 458v12L380 549 192 451Z"
              fill="color-mix(in oklab, var(--panel) 44%, var(--canvas))"
              stroke="color-mix(in oklab, var(--border) 72%, var(--foreground))"
              strokeWidth="1.5"
            />
          </g>

          <g opacity="0.72">
            {[0, 1, 2, 3, 4, 5].map((floor) => {
              const frontY = 220 + floor * 47
              const leftY = 142 + floor * 49
              const rightY = 157 + floor * 50
              const backY = 84 + floor * 49
              return (
                <path
                  key={floor}
                  d={`M235 ${leftY} 444 ${backY} 598 ${rightY} 390 ${frontY}Z`}
                  fill="color-mix(in oklab, var(--panel-subtle) 52%, transparent)"
                  stroke="color-mix(in oklab, var(--border) 72%, var(--foreground))"
                  strokeWidth="1"
                />
              )
            })}
          </g>

          <g
            fill="url(#viewport-core-surface)"
            stroke="color-mix(in oklab, var(--border) 66%, var(--foreground))"
            strokeWidth="1.4"
            opacity="0.9"
          >
            <path d="M326 158 424 130 488 161 390 191Z" />
            <path d="M326 158 390 191 390 447 326 413Z" />
            <path d="M390 191 488 161 488 416 390 447Z" />
            <path
              d="M350 151 350 119 397 106 431 122 431 158Z"
              fill="color-mix(in oklab, var(--panel-subtle) 78%, var(--canvas))"
            />
            <path
              d="M410 136 410 105 454 93 481 106 481 164Z"
              fill="color-mix(in oklab, var(--panel) 72%, var(--canvas))"
            />
          </g>

          <g filter="url(#viewport-object-shadow)">
            <path
              d="M235 142 444 84 598 157 390 220Z"
              fill="url(#viewport-roof-surface)"
            />
            <path
              d="M235 142 390 220 390 520 235 438Z"
              fill="url(#viewport-left-surface)"
            />
            <path
              d="M390 220 598 157 598 458 390 520Z"
              fill="url(#viewport-right-surface)"
            />
          </g>

          <g
            fill="none"
            stroke="color-mix(in oklab, var(--border) 58%, var(--foreground))"
            strokeWidth="1.25"
            opacity="0.82"
          >
            <path d="M235 142v-12L444 72l154 73v12" />
            <path d="M235 130 390 208 598 145" />
            <path d="M272 132v-18l54-15 40 19v18" />
            <path d="M493 112v-17l42 20v18" />
            <path d="M306 122 390 164l76-23" />
          </g>

          <g
            fill="none"
            stroke="color-mix(in oklab, var(--border) 76%, var(--foreground))"
            strokeWidth="1.25"
            opacity="0.62"
          >
            <path d="M274 162v297M314 182v298M352 201v298" />
            <path d="M432 207v301M474 195v300M516 182v300M558 169v300" />
          </g>

          <g
            fill="none"
            stroke="color-mix(in oklab, var(--foreground) 24%, transparent)"
            strokeWidth="0.8"
            opacity="0.58"
          >
            <path d="M255 152v296M294 172v297M333 191v298M371 210v298" />
            <path d="M411 214v300M453 201v300M495 189v299M537 176v300M578 164v298" />
          </g>

          {[0, 1, 2, 3, 4, 5].map((floor) => {
            const y = 220 + floor * 47
            const leftY = 142 + floor * 49
            const rightY = 157 + floor * 50
            return (
              <g key={floor}>
                <path
                  d={`M235 ${leftY} 390 ${y} 598 ${rightY} 598 ${
                    rightY + 6
                  } 390 ${y + 6} 235 ${leftY + 6}Z`}
                  fill="url(#viewport-slab-edge)"
                  stroke="color-mix(in oklab, var(--border) 84%, var(--foreground))"
                  strokeWidth="1.4"
                />
                <path
                  d={`M235 ${leftY} 390 ${y} 598 ${rightY}`}
                  fill="none"
                  stroke="color-mix(in oklab, var(--border) 72%, var(--foreground))"
                  strokeWidth="1.4"
                />
                <path
                  d={`M390 ${y} 390 ${y + 47}`}
                  fill="none"
                  opacity="0.45"
                />
              </g>
            )
          })}

          <g
            fill="color-mix(in oklab, var(--canvas) 76%, transparent)"
            strokeWidth="1.5"
          >
            <path d="M257 241 373 299 373 332 257 273Z" />
            <path d="M257 337 373 396 373 427 257 369Z" />
            <path d="M411 276 575 227 575 261 411 309Z" />
            <path d="M411 370 575 322 575 355 411 403Z" />
            <g
              fill="none"
              stroke="color-mix(in oklab, var(--border) 68%, var(--foreground))"
              strokeWidth="1"
              opacity="0.72"
            >
              <path d="M296 260v33M335 280v33M450 264v34M492 252v34M534 239v34" />
              <path d="M296 357v32M335 377v31M450 358v34M492 346v33M534 333v34" />
            </g>
          </g>

          <g
            fill="color-mix(in oklab, var(--panel-subtle) 56%, transparent)"
            stroke="color-mix(in oklab, var(--border) 64%, var(--foreground))"
            strokeWidth="1"
            opacity="0.82"
          >
            <path d="M253 404 286 421v39l-33-18Z" />
            <path d="M298 427 333 445v39l-35-18Z" />
            <path d="M421 434 455 424v50l-34 10Z" />
            <path d="M469 420 503 410v50l-34 10Z" />
            <path d="M517 405 552 395v50l-35 10Z" />
          </g>
        </g>

        <g
          data-viewport-layer="structure"
          data-visible={structureVisible}
          opacity={structureVisible ? 0.58 : 0}
          fill="none"
          className="transition-opacity duration-200"
        >
          <g
            stroke="color-mix(in oklab, var(--muted-foreground) 76%, var(--canvas))"
            strokeWidth="6"
            strokeLinecap="square"
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
            stroke="color-mix(in oklab, var(--muted-foreground) 64%, var(--panel))"
            strokeWidth="2"
            strokeLinecap="square"
            opacity="0.9"
          >
            <path d="M273 164v294M346 200v296M458 198v288M546 171v289" />
            <path d="M244 341 392 417 591 359" />
            {[0, 1, 2, 3].map((column) => (
              <path
                key={column}
                d={`M${430 + column * 43} ${206 - column * 13}v299`}
              />
            ))}
          </g>
        </g>

        <g
          data-viewport-layer="mechanical"
          data-visible={mechanicalVisible}
          opacity={
            mechanicalVisible
              ? aiReviewVisualsActive && selectedIssueHighlight === "duct"
                ? 1
                : 0.55
              : 0
          }
          className="transition-opacity duration-200"
        >
          <g filter="url(#viewport-object-shadow)">
            <path
              d="M305 319 492 268 535 287 349 341Z"
              fill="url(#viewport-duct-top)"
              stroke="var(--ai)"
              strokeWidth="3"
            />
            <path
              d="M349 341 535 287v21L349 362Z"
              fill="url(#viewport-duct-side)"
              stroke="var(--ai)"
              strokeWidth="3"
            />
            <path
              d="M305 319 349 341v21l-44-21Z"
              fill="color-mix(in oklab, var(--ai) 35%, var(--canvas))"
              stroke="var(--ai)"
              strokeWidth="3"
            />
          </g>
          <g
            fill="none"
            stroke="color-mix(in oklab, var(--ai) 55%, var(--foreground))"
            strokeWidth="1.2"
            opacity="0.72"
          >
            <path d="M350 307 394 329M443 281 487 303" />
            <path d="M394 329v21M487 303v21" />
            <path d="M311 317 492 270 528 286" />
          </g>
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

        {aiReviewVisualsActive && aiReviewFindingCount > 0 && (
          <AiFindingClusterMarkers
            counts={aiReviewFindingSpatialCounts}
            selectedKind={
              selectedAiFindingActive ? selectedIssueHighlight : null
            }
          />
        )}

        {selectedObjectVisible &&
          aiReviewVisualsActive &&
          selectedAiFindingActive && (
          <SelectedObjectHighlight kind={selectedIssueHighlight} />
        )}

        {selectedObjectVisible &&
          aiReviewVisualsActive &&
          selectedAiFindingActive &&
          previewActive && <PreviewChangeOverlay kind={selectedIssueHighlight} />}

        {selectedObjectVisible && modelFocusActive && (
          <ModelFocusOverlay
            key={modelFocusRequest?.nonce ?? "model-focus"}
            kind={selectedIssueHighlight}
          />
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
          stroke={activeTool === "Orbit" ? "var(--primary)" : "var(--border)"}
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
  )
}

const clusterMarkerPositions: Record<
  HighlightKind,
  { x: number; y: number; label: string }
> = {
  duct: { x: 545, y: 288, label: "coordination zone" },
  door: { x: 504, y: 392, label: "clearance zone" },
  damper: { x: 338, y: 313, label: "fire safety zone" },
}

function AiFindingClusterMarkers({
  counts,
  selectedKind,
}: {
  counts: Record<HighlightKind, number>
  selectedKind: HighlightKind | null
}) {
  return (
    <g data-testid="viewport-ai-finding-clusters" pointerEvents="none">
      {(Object.keys(clusterMarkerPositions) as HighlightKind[]).map((kind) => {
        const count = counts[kind]
        if (count < 1) {
          return null
        }

        const position = clusterMarkerPositions[kind]
        const selected = selectedKind === kind
        const contextual = Boolean(selectedKind) && !selected

        return (
          <g
            key={kind}
            transform={`translate(${position.x} ${position.y})`}
            opacity={contextual ? 0.42 : 1}
            data-cluster-kind={kind}
            data-selected-cluster={selected}
          >
            <circle
              r={selected ? 15 : 12}
              fill={
                selected
                  ? "var(--destructive)"
                  : "color-mix(in oklab, var(--ai) 72%, var(--panel))"
              }
              stroke="var(--canvas)"
              strokeWidth="3"
            />
            <text
              x="0"
              y="3.5"
              textAnchor="middle"
              fill={
                selected ? "var(--destructive-foreground)" : "var(--foreground)"
              }
              fontSize={selected ? "10" : "9"}
              fontWeight="800"
              stroke="none"
            >
              {count}
            </text>
            {!selectedKind && (
              <ClusterLabel
                count={count}
                selected={false}
                x={16}
                y={-12}
              />
            )}
            {selected && (
              <ClusterLabel
                count={count}
                selected
                x={18}
                y={-13}
              />
            )}
          </g>
        )
      })}
    </g>
  )
}

function ClusterLabel({
  count,
  selected,
  x,
  y,
}: {
  count: number
  selected: boolean
  x: number
  y: number
}) {
  const label = count === 1 ? "1 finding" : `${count} findings`

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={selected ? 78 : 72}
        height="24"
        rx="4"
        fill="var(--panel)"
        stroke={selected ? "var(--destructive)" : "var(--ai)"}
        strokeWidth="1.5"
      />
      <text
        x={selected ? 39 : 36}
        y="15"
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize="9"
        fontWeight="700"
        stroke="none"
      >
        {label}
      </text>
    </g>
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

function PreviewChangeOverlay({ kind }: { kind: HighlightKind }) {
  if (kind === "door") {
    return (
      <g data-testid="viewport-preview-change" data-preview-kind="door">
        <path
          d="M441 457a62 62 0 0 1 59-65"
          fill="none"
          stroke="var(--success)"
          strokeWidth="3"
          strokeDasharray="8 5"
        />
        <path
          d="M505 389 498 404 489 391"
          fill="none"
          stroke="var(--success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <PreviewLabel x={388} y={344} title="Preview" detail="Reverse swing" />
      </g>
    )
  }

  if (kind === "damper") {
    return (
      <g data-testid="viewport-preview-change" data-preview-kind="damper">
        <rect
          x="342"
          y="303"
          width="92"
          height="78"
          rx="6"
          fill="color-mix(in oklab, var(--success) 12%, transparent)"
          stroke="var(--success)"
          strokeWidth="2.5"
          strokeDasharray="7 5"
        />
        <path
          d="M430 320 486 292"
          fill="none"
          stroke="var(--success)"
          strokeWidth="2"
        />
        <PreviewLabel x={486} y={260} title="Preview" detail="Assign FD-300" />
      </g>
    )
  }

  return (
    <g data-testid="viewport-preview-change" data-preview-kind="duct">
      <path
        d="M297 347 485 296 532 317 344 371Z"
        fill="color-mix(in oklab, var(--success) 18%, transparent)"
        stroke="var(--success)"
        strokeWidth="3"
        strokeDasharray="8 5"
      />
      <path
        d="M420 338v42"
        stroke="var(--success)"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <PreviewLabel x={458} y={374} title="Preview" detail="Shift route" />
    </g>
  )
}

function ModelFocusOverlay({ kind }: { kind: HighlightKind }) {
  const frame =
    kind === "door"
      ? { x: 430, y: 354, width: 78, height: 120, labelX: 508, labelY: 348 }
      : kind === "damper"
        ? { x: 334, y: 296, width: 108, height: 92, labelX: 442, labelY: 292 }
        : { x: 286, y: 260, width: 268, height: 120, labelX: 530, labelY: 350 }

  return (
    <g
      data-testid="viewport-model-focus"
      data-focus-kind={kind}
      className="animate-pulse motion-reduce:animate-none"
    >
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        rx="8"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeDasharray="9 5"
      />
      <g transform={`translate(${frame.labelX} ${frame.labelY})`}>
        <rect
          width="70"
          height="24"
          rx="4"
          fill="var(--panel)"
          stroke="var(--primary)"
          strokeWidth="1.5"
        />
        <text
          x="35"
          y="15"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="9"
          fontWeight="700"
        >
          Focused
        </text>
      </g>
    </g>
  )
}

function PreviewLabel({
  x,
  y,
  title,
  detail,
}: {
  x: number
  y: number
  title: string
  detail: string
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width="92"
        height="38"
        rx="4"
        fill="var(--panel)"
        stroke="var(--success)"
        strokeWidth="1.5"
      />
      <text x="8" y="15" fill="var(--success)" fontSize="9" fontWeight="700">
        {title}
      </text>
      <text x="8" y="29" fill="var(--foreground)" fontSize="9">
        {detail}
      </text>
    </g>
  )
}
