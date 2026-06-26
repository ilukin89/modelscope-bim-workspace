import { Canvas } from "@react-three/fiber"
import { ContactShadows, Edges, OrbitControls } from "@react-three/drei"
import type { ViewportRendererProps } from "@/features/viewport/renderers/types"
import type { HighlightKind, LayerId } from "@/types"

type LayerVisualConfig = {
  color: string
  focusColor: string
  position: [number, number, number]
  scale: [number, number, number]
}

type MarkerData = {
  highlight: HighlightKind
  position: [number, number, number]
}

const layerVisuals: Record<LayerId, LayerVisualConfig> = {
  architecture: {
    color: "#d8dee8",
    focusColor: "#f8fafc",
    position: [0, 0.28, 0],
    scale: [4.6, 0.34, 2.7],
  },
  structure: {
    color: "#8b9bb0",
    focusColor: "#cbd5e1",
    position: [-0.18, 1.08, -0.12],
    scale: [3.2, 1.7, 1.9],
  },
  mechanical: {
    color: "#3fb8c6",
    focusColor: "#67e8f9",
    position: [0.5, 2.05, 0.14],
    scale: [2.85, 0.3, 0.42],
  },
  electrical: {
    color: "#f1b84b",
    focusColor: "#fde68a",
    position: [-0.88, 1.82, 0.88],
    scale: [0.26, 1.65, 0.26],
  },
}

const highlightColors: Record<HighlightKind, string> = {
  damper: "#f97316",
  door: "#22c55e",
  duct: "#06b6d4",
}

function getSelectedFloorIndex(
  floors: ViewportRendererProps["floors"],
  selectedFloor: ViewportRendererProps["selectedFloor"],
) {
  return Math.max(
    floors.findIndex((floor) => floor.label === selectedFloor),
    0,
  )
}

function createAiMarkers(
  counts: ViewportRendererProps["aiReviewFindingSpatialCounts"],
  floorOffset: number,
) {
  const markerSlots: MarkerData[] = [
    {
      highlight: "duct",
      position: [1.65, 1.92 + floorOffset, 0.5],
    },
    {
      highlight: "door",
      position: [-1.72, 1.18 + floorOffset, -0.86],
    },
    {
      highlight: "damper",
      position: [0.35, 2.34 + floorOffset, -0.1],
    },
  ]

  return markerSlots.filter((marker) => counts[marker.highlight] > 0)
}

function FloorStack({
  floors,
  selectedFloorIndex,
}: Pick<ViewportRendererProps, "floors"> & {
  selectedFloorIndex: number
}) {
  return (
    <group>
      {floors.map((floor, index) => {
        const active = index === selectedFloorIndex
        const y = index * 0.36

        return (
          <mesh
            key={floor.label}
            position={[0, y, 0]}
            scale={[5.2, 0.08, 3.2]}
          >
            <boxGeometry />
            <meshStandardMaterial
              color={active ? "#f8fafc" : "#64748b"}
              opacity={active ? 0.52 : 0.18}
              transparent
            />
            {active && <Edges color="#f8fafc" />}
          </mesh>
        )
      })}
    </group>
  )
}

function LayerBlock({
  config,
  dimmed,
  focused,
  layerId,
}: {
  config: LayerVisualConfig
  dimmed: boolean
  focused: boolean
  layerId: LayerId
}) {
  return (
    <mesh
      position={config.position}
      scale={config.scale}
      userData={{ layerId }}
    >
      <boxGeometry />
      <meshStandardMaterial
        color={focused ? config.focusColor : config.color}
        opacity={dimmed ? 0.12 : 0.78}
        roughness={0.62}
        transparent
      />
      <Edges color={focused ? "#ffffff" : "#475569"} />
    </mesh>
  )
}

function ToolCue({ activeTool }: Pick<ViewportRendererProps, "activeTool">) {
  if (activeTool === "Section") {
    return (
      <mesh position={[0.45, 1.65, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.04, 3.2, 3.7]} />
        <meshStandardMaterial color="#38bdf8" opacity={0.24} transparent />
      </mesh>
    )
  }

  if (activeTool === "Measure") {
    return (
      <group position={[0, 2.75, 1.34]}>
        <mesh rotation={[0, 0, 0.62]} scale={[2.1, 0.035, 0.035]}>
          <boxGeometry />
          <meshStandardMaterial color="#f8fafc" emissive="#64748b" />
        </mesh>
        <mesh position={[-0.85, -0.6, 0]} scale={0.1}>
          <sphereGeometry />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0.85, 0.6, 0]} scale={0.1}>
          <sphereGeometry />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
    )
  }

  if (activeTool === "Comment") {
    return (
      <mesh position={[-1.95, 2.6, -0.9]} scale={[0.16, 0.16, 0.16]}>
        <sphereGeometry args={[1, 18, 18]} />
        <meshStandardMaterial color="#f43f5e" emissive="#7f1d1d" />
      </mesh>
    )
  }

  return null
}

function AiFindingMarkers({
  aiReviewFindingSpatialCounts,
  selectedAiFindingActive,
  selectedFloorOffset,
}: Pick<
  ViewportRendererProps,
  "aiReviewFindingSpatialCounts" | "selectedAiFindingActive"
> & {
  selectedFloorOffset: number
}) {
  const markers = createAiMarkers(
    aiReviewFindingSpatialCounts,
    selectedFloorOffset,
  )

  return (
    <group>
      {markers.map((marker) => (
        <mesh
          key={marker.highlight}
          position={marker.position}
          scale={selectedAiFindingActive ? 0.18 : 0.13}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={highlightColors[marker.highlight]}
            emissive={highlightColors[marker.highlight]}
            emissiveIntensity={selectedAiFindingActive ? 0.55 : 0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

function PreviewGhost({
  selectedFloorOffset,
}: {
  selectedFloorOffset: number
}) {
  return (
    <mesh
      position={[1.18, 2.28 + selectedFloorOffset, -0.58]}
      scale={[1.1, 0.24, 0.62]}
    >
      <boxGeometry />
      <meshStandardMaterial
        color="#a78bfa"
        emissive="#7c3aed"
        opacity={0.34}
        transparent
      />
      <Edges color="#ddd6fe" />
    </mesh>
  )
}

function FocusRing({
  active,
  selectedFloorOffset,
}: {
  active: boolean
  selectedFloorOffset: number
}) {
  if (!active) {
    return null
  }

  return (
    <mesh
      position={[0, 2.05 + selectedFloorOffset, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[2.85, 0.025, 12, 96]} />
      <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" />
    </mesh>
  )
}

function SelectedIssueHighlight({
  selectedFloorOffset,
  selectedIssue,
  visible,
}: Pick<ViewportRendererProps, "selectedIssue"> & {
  selectedFloorOffset: number
  visible: boolean
}) {
  if (!visible) {
    return null
  }

  const config = layerVisuals[selectedIssue.discipline]

  return (
    <mesh
      position={[
        config.position[0],
        config.position[1] + selectedFloorOffset + 0.08,
        config.position[2],
      ]}
      scale={[
        config.scale[0] + 0.14,
        config.scale[1] + 0.14,
        config.scale[2] + 0.14,
      ]}
    >
      <boxGeometry />
      <meshStandardMaterial
        color={highlightColors[selectedIssue.highlight]}
        opacity={0.22}
        transparent
      />
      <Edges color={highlightColors[selectedIssue.highlight]} />
    </mesh>
  )
}

function Scene({
  activeTool,
  aiReviewFindingSpatialCounts,
  aiReviewVisualsActive,
  floors,
  modelFocusActive,
  previewActive,
  selectedAiFindingActive,
  selectedFloor,
  selectedIssue,
  visibleLayerIds,
}: ViewportRendererProps) {
  const selectedFloorIndex = getSelectedFloorIndex(floors, selectedFloor)
  const selectedFloorOffset = selectedFloorIndex * 0.18
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )

  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 5]} intensity={1.4} />
      <directionalLight position={[-3, 4, -3]} intensity={0.45} />

      <group
        position={[0, -1.25, 0]}
        rotation={[0, activeTool === "Pan" ? -0.52 : -0.42, 0]}
        scale={modelFocusActive ? 1.06 : 1}
      >
        <FloorStack floors={floors} selectedFloorIndex={selectedFloorIndex} />

        {(Object.keys(layerVisuals) as LayerId[]).map((layerId) => (
          <LayerBlock
            key={layerId}
            config={{
              ...layerVisuals[layerId],
              position: [
                layerVisuals[layerId].position[0],
                layerVisuals[layerId].position[1] + selectedFloorOffset,
                layerVisuals[layerId].position[2],
              ],
            }}
            dimmed={!visibleLayerIds.includes(layerId)}
            focused={selectedIssue.discipline === layerId}
            layerId={layerId}
          />
        ))}

        <SelectedIssueHighlight
          selectedFloorOffset={selectedFloorOffset}
          selectedIssue={selectedIssue}
          visible={selectedObjectVisible}
        />

        {aiReviewVisualsActive && (
          <AiFindingMarkers
            aiReviewFindingSpatialCounts={aiReviewFindingSpatialCounts}
            selectedAiFindingActive={selectedAiFindingActive}
            selectedFloorOffset={selectedFloorOffset}
          />
        )}

        {previewActive && (
          <PreviewGhost selectedFloorOffset={selectedFloorOffset} />
        )}

        <FocusRing
          active={modelFocusActive}
          selectedFloorOffset={selectedFloorOffset}
        />
        <ToolCue activeTool={activeTool} />
      </group>

      <ContactShadows
        blur={2}
        far={7}
        opacity={0.32}
        position={[0, -1.42, 0]}
        scale={9}
      />
      <OrbitControls
        enableDamping
        enablePan={false}
        maxDistance={8}
        minDistance={4}
      />
    </>
  )
}

export function ThreeViewportRenderer(props: ViewportRendererProps) {
  const {
    aiReviewFindingCount,
    modelFocusRequest,
    selectedIssue,
  } = props
  const focusLabel = modelFocusRequest?.label ?? selectedIssue.object
  const ariaLabel = `Procedural Three.js viewport showing conceptual BIM massing for ${selectedIssue.object}; ${aiReviewFindingCount} AI findings represented when active; focus target ${focusLabel}`

  return (
    <div
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      data-renderer="three"
    >
      <Canvas
        camera={{ fov: 42, position: [4.7, 3.6, 5.4] }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  )
}
