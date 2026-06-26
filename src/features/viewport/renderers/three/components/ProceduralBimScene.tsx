import { ContactShadows, Edges, OrbitControls } from "@react-three/drei"
import { DoubleSide } from "three"
import type { ViewportTheme } from "@/features/viewport/renderers/three/utils/useViewportTheme"
import type { ViewportRendererProps } from "@/features/viewport/renderers/types"
import type { HighlightKind, LayerId } from "@/types"

type Vector3Tuple = [number, number, number]

type LayerVisualConfig = {
  color: string
  edge: string
  emissive: string
  hiddenOpacity: number
  visibleOpacity: number
}

type MarkerData = {
  highlight: HighlightKind
  position: Vector3Tuple
}

type SceneThemeTokens = {
  ambientLight: number
  background: string
  base: {
    edge: string
    inset: string
    insetOpacity: number
    surface: string
    surfaceEmissive: string
  }
  fillLight: number
  fog: {
    color: string
    far: number
    near: number
  }
  focus: {
    secondary: string
    secondaryEmissive: string
    secondaryOpacity: number
  }
  floor: {
    activeColor: string
    activeEmissive: string
    activeOpacity: number
    color: string
    edge: string
    emissive: string
    glowOpacity: number
    haloOpacity: number
    opacity: number
  }
  grid: {
    major: string
    minor: string
  }
  highlightColors: Record<HighlightKind, string>
  keyLight: number
  layerVisuals: Record<LayerId, LayerVisualConfig>
  marker: {
    selectedEdge: string
  }
  pointLights: {
    cyan: number
    warm: number
  }
  preview: {
    baseline: string
    baselineEmissive: string
    baselineOpacity: number
    color: string
    edge: string
    emissive: string
    opacity: number
  }
  roof: {
    color: string
    edge: string
  }
  shadowOpacity: number
  structure: {
    core: string
    hiddenEdge: string
  }
  tool: {
    comment: string
    commentEmissive: string
    measure: string
    measureEmissive: string
  }
}

const FLOOR_HEIGHT = 0.42
const SELECTED_FLOOR_GLOW = "#22d3ee"

const sceneThemeTokens: Record<ViewportTheme, SceneThemeTokens> = {
  dark: {
    ambientLight: 0.34,
    background: "#071017",
    base: {
      edge: "#1f4657",
      inset: "#12313f",
      insetOpacity: 0.22,
      surface: "#0f1b24",
      surfaceEmissive: "#061018",
    },
    fillLight: 0.42,
    fog: {
      color: "#071017",
      far: 13,
      near: 6.5,
    },
    focus: {
      secondary: "#bae6fd",
      secondaryEmissive: "#0ea5e9",
      secondaryOpacity: 0.32,
    },
    floor: {
      activeColor: "#164d64",
      activeEmissive: "#0b3d4f",
      activeOpacity: 0.34,
      color: "#536575",
      edge: "#344554",
      emissive: "#050d13",
      glowOpacity: 0.26,
      haloOpacity: 0.12,
      opacity: 0.2,
    },
    grid: {
      major: "#1d5368",
      minor: "#102633",
    },
    highlightColors: {
      damper: "#f59e0b",
      door: "#34d399",
      duct: SELECTED_FLOOR_GLOW,
    },
    keyLight: 1.25,
    layerVisuals: {
      architecture: {
        color: "#d7e2ef",
        edge: "#8aa0b5",
        emissive: "#0b2532",
        hiddenOpacity: 0.035,
        visibleOpacity: 0.16,
      },
      structure: {
        color: "#95a6ba",
        edge: "#708196",
        emissive: "#081725",
        hiddenOpacity: 0.08,
        visibleOpacity: 0.48,
      },
      mechanical: {
        color: "#55d3cf",
        edge: "#67e8f9",
        emissive: "#0b4a52",
        hiddenOpacity: 0.08,
        visibleOpacity: 0.58,
      },
      electrical: {
        color: "#9b8cff",
        edge: "#c4b5fd",
        emissive: "#251a58",
        hiddenOpacity: 0.08,
        visibleOpacity: 0.52,
      },
    },
    marker: {
      selectedEdge: "#e0faff",
    },
    pointLights: {
      cyan: 0.68,
      warm: 0.18,
    },
    preview: {
      baseline: "#fbbf24",
      baselineEmissive: "#92400e",
      baselineOpacity: 0.34,
      color: "#8be9f2",
      edge: "#a5f3fc",
      emissive: "#155e75",
      opacity: 0.22,
    },
    roof: {
      color: "#c8d4df",
      edge: "#6b7f91",
    },
    shadowOpacity: 0.38,
    structure: {
      core: "#a9b8c8",
      hiddenEdge: "#26313c",
    },
    tool: {
      comment: "#fb7185",
      commentEmissive: "#881337",
      measure: "#dbeafe",
      measureEmissive: "#2563eb",
    },
  },
  light: {
    ambientLight: 0.58,
    background: "#dde6ed",
    base: {
      edge: "#9aadb9",
      inset: "#d2dce4",
      insetOpacity: 0.24,
      surface: "#d7e1e8",
      surfaceEmissive: "#d2dce3",
    },
    fillLight: 0.34,
    fog: {
      color: "#dde6ed",
      far: 12.6,
      near: 6.7,
    },
    focus: {
      secondary: "#0f6f88",
      secondaryEmissive: "#7dd3fc",
      secondaryOpacity: 0.28,
    },
    floor: {
      activeColor: "#a9e3ee",
      activeEmissive: "#67d4e8",
      activeOpacity: 0.42,
      color: "#b4c2ce",
      edge: "#879aa8",
      emissive: "#d7e1ea",
      glowOpacity: 0.28,
      haloOpacity: 0.14,
      opacity: 0.22,
    },
    grid: {
      major: "#b8c8d2",
      minor: "#d4dee6",
    },
    highlightColors: {
      damper: "#b45309",
      door: "#047857",
      duct: "#0891b2",
    },
    keyLight: 1.4,
    layerVisuals: {
      architecture: {
        color: "#f2f7fb",
        edge: "#637887",
        emissive: "#d8e5ec",
        hiddenOpacity: 0.05,
        visibleOpacity: 0.25,
      },
      structure: {
        color: "#6f8293",
        edge: "#516676",
        emissive: "#c7d4de",
        hiddenOpacity: 0.1,
        visibleOpacity: 0.4,
      },
      mechanical: {
        color: "#0891b2",
        edge: "#0e7490",
        emissive: "#bae6fd",
        hiddenOpacity: 0.09,
        visibleOpacity: 0.48,
      },
      electrical: {
        color: "#6d5bd0",
        edge: "#5b4bb7",
        emissive: "#ddd6fe",
        hiddenOpacity: 0.09,
        visibleOpacity: 0.44,
      },
    },
    marker: {
      selectedEdge: "#044e63",
    },
    pointLights: {
      cyan: 0.24,
      warm: 0.12,
    },
    preview: {
      baseline: "#b45309",
      baselineEmissive: "#fde68a",
      baselineOpacity: 0.42,
      color: "#67dce8",
      edge: "#0e7490",
      emissive: "#cffafe",
      opacity: 0.26,
    },
    roof: {
      color: "#ccd8e1",
      edge: "#728592",
    },
    shadowOpacity: 0.16,
    structure: {
      core: "#7b8ea0",
      hiddenEdge: "#b5c2cc",
    },
    tool: {
      comment: "#be123c",
      commentEmissive: "#fecdd3",
      measure: "#1e3a8a",
      measureEmissive: "#bfdbfe",
    },
  },
}

const facadeBays: Array<{
  position: Vector3Tuple
  scale: Vector3Tuple
}> = [
  { position: [-1.65, 0, -1.05], scale: [1.15, 0.34, 0.62] },
  { position: [0.05, 0, -1.08], scale: [1.55, 0.34, 0.56] },
  { position: [1.62, 0, -0.92], scale: [1.05, 0.34, 0.78] },
  { position: [-1.85, 0, 0.38], scale: [0.72, 0.34, 1.05] },
  { position: [-0.32, 0, 0.98], scale: [1.18, 0.34, 0.72] },
  { position: [1.28, 0, 0.7], scale: [1.38, 0.34, 0.88] },
]

const columnPositions: Vector3Tuple[] = [
  [-2.18, 0, -1.28],
  [-0.78, 0, -1.28],
  [0.78, 0, -1.28],
  [2.18, 0, -1.28],
  [-2.18, 0, 0],
  [2.18, 0, 0],
  [-2.18, 0, 1.28],
  [-0.78, 0, 1.28],
  [0.78, 0, 1.28],
  [2.18, 0, 1.28],
]

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
  selectedFloorY: number,
) {
  const markerSlots: MarkerData[] = [
    {
      highlight: "duct",
      position: [1.58, selectedFloorY + 0.78, 0.72],
    },
    {
      highlight: "door",
      position: [-1.92, selectedFloorY + 0.36, 1.18],
    },
    {
      highlight: "damper",
      position: [0.88, selectedFloorY + 0.92, -0.72],
    },
  ]

  return markerSlots.filter((marker) => counts[marker.highlight] > 0)
}

function getObjectAnchor(
  highlight: HighlightKind,
  selectedFloorY: number,
): Vector3Tuple {
  if (highlight === "door") {
    return [-1.92, selectedFloorY + 0.34, 1.24]
  }

  if (highlight === "damper") {
    return [0.88, selectedFloorY + 0.88, -0.72]
  }

  return [1.45, selectedFloorY + 0.72, 0.74]
}

function getLayerOpacity(
  layerId: LayerId,
  visibleLayerIds: LayerId[],
  tokens: SceneThemeTokens,
) {
  const config = tokens.layerVisuals[layerId]

  return visibleLayerIds.includes(layerId)
    ? config.visibleOpacity
    : config.hiddenOpacity
}

function BasePlate({ tokens }: { tokens: SceneThemeTokens }) {
  return (
    <group position={[0, -0.06, 0]}>
      <mesh position={[0, -0.035, 0]} scale={[6.2, 0.04, 4.05]}>
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.base.surface}
          emissive={tokens.base.surfaceEmissive}
          metalness={0.12}
          roughness={0.82}
        />
        <Edges color={tokens.base.edge} />
      </mesh>
      <mesh position={[0, -0.008, 0]} scale={[5.72, 0.012, 3.58]}>
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.base.inset}
          opacity={tokens.base.insetOpacity}
          transparent
        />
      </mesh>
    </group>
  )
}

function FloorStack({
  floors,
  selectedFloorIndex,
  tokens,
}: Pick<ViewportRendererProps, "floors"> & {
  selectedFloorIndex: number
  tokens: SceneThemeTokens
}) {
  return (
    <group>
      {floors.map((floor, index) => {
        const active = index === selectedFloorIndex
        const y = index * FLOOR_HEIGHT

        return (
          <group key={floor.label} position={[0, y, 0]}>
            <mesh scale={[5.18, 0.045, 3.18]}>
              <boxGeometry />
              <meshStandardMaterial
                color={active ? tokens.floor.activeColor : tokens.floor.color}
                emissive={
                  active ? tokens.floor.activeEmissive : tokens.floor.emissive
                }
                emissiveIntensity={active ? 0.35 : 0.06}
                opacity={active ? tokens.floor.activeOpacity : tokens.floor.opacity}
                roughness={0.72}
                transparent
              />
            </mesh>
            <Edges color={active ? SELECTED_FLOOR_GLOW : tokens.floor.edge} />

            {active && (
              <>
                <mesh position={[0, 0.032, 0]} scale={[5.64, 0.032, 3.56]}>
                  <boxGeometry />
                  <meshStandardMaterial
                    color={SELECTED_FLOOR_GLOW}
                    emissive={SELECTED_FLOOR_GLOW}
                    emissiveIntensity={0.72}
                    opacity={tokens.floor.glowOpacity}
                    transparent
                  />
                </mesh>
                <mesh position={[0, 0.054, 0]} scale={[5.7, 0.01, 3.62]}>
                  <boxGeometry />
                  <meshStandardMaterial
                    color={SELECTED_FLOOR_GLOW}
                    emissive={SELECTED_FLOOR_GLOW}
                    emissiveIntensity={0.85}
                    opacity={tokens.floor.haloOpacity}
                    transparent
                  />
                  <Edges color={SELECTED_FLOOR_GLOW} />
                </mesh>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

function ArchitectureLayer({
  floorCount,
  tokens,
  visibleLayerIds,
}: {
  floorCount: number
  tokens: SceneThemeTokens
  visibleLayerIds: LayerId[]
}) {
  const opacity = getLayerOpacity("architecture", visibleLayerIds, tokens)
  const config = tokens.layerVisuals.architecture
  const buildingHeight = Math.max(floorCount - 1, 1) * FLOOR_HEIGHT + 0.56

  return (
    <group>
      <mesh position={[0, buildingHeight / 2 - 0.08, 0]} scale={[5.18, buildingHeight, 3.12]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          depthWrite={false}
          emissive={config.emissive}
          metalness={0.18}
          opacity={opacity}
          roughness={0.36}
          transparent
        />
        <Edges color={visibleLayerIds.includes("architecture") ? config.edge : tokens.floor.edge} />
      </mesh>

      {Array.from({ length: floorCount }).map((_, floorIndex) => {
        const y = floorIndex * FLOOR_HEIGHT + 0.18

        return facadeBays.map((bay, bayIndex) => (
          <mesh
            key={`${floorIndex}-${bayIndex}`}
            position={[bay.position[0], y, bay.position[2]]}
            scale={bay.scale}
          >
            <boxGeometry />
            <meshStandardMaterial
              color={config.color}
              depthWrite={false}
              emissive={config.emissive}
              opacity={opacity * 0.72}
              roughness={0.42}
              transparent
            />
            <Edges color={visibleLayerIds.includes("architecture") ? config.edge : tokens.floor.edge} />
          </mesh>
        ))
      })}

      <mesh
        position={[0.04, buildingHeight + 0.14, -0.08]}
        scale={[3.35, 0.2, 1.9]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.roof.color}
          depthWrite={false}
          opacity={opacity * 0.86}
          roughness={0.5}
          transparent
        />
        <Edges color={tokens.roof.edge} />
      </mesh>
    </group>
  )
}

function StructureLayer({
  floorCount,
  tokens,
  visibleLayerIds,
}: {
  floorCount: number
  tokens: SceneThemeTokens
  visibleLayerIds: LayerId[]
}) {
  const opacity = getLayerOpacity("structure", visibleLayerIds, tokens)
  const config = tokens.layerVisuals.structure
  const buildingHeight = Math.max(floorCount - 1, 1) * FLOOR_HEIGHT + 0.42

  return (
    <group>
      {columnPositions.map((position, index) => (
        <mesh
          key={index}
          position={[position[0], buildingHeight / 2 - 0.02, position[2]]}
          scale={[0.13, buildingHeight, 0.13]}
        >
          <boxGeometry />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            metalness={0.16}
            opacity={opacity}
            roughness={0.58}
            transparent
          />
        </mesh>
      ))}

      <mesh position={[0, buildingHeight / 2 - 0.02, 0]} scale={[0.78, buildingHeight, 0.72]}>
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.structure.core}
          emissive={config.emissive}
          metalness={0.1}
          opacity={opacity * 0.78}
          roughness={0.62}
          transparent
        />
        <Edges color={visibleLayerIds.includes("structure") ? config.edge : tokens.structure.hiddenEdge} />
      </mesh>

      {Array.from({ length: floorCount }).map((_, index) => (
        <mesh
          key={index}
          position={[0, index * FLOOR_HEIGHT + 0.08, 0]}
          scale={[4.66, 0.055, 2.74]}
        >
          <boxGeometry />
          <meshStandardMaterial
            color={config.color}
            opacity={opacity * 0.54}
            transparent
          />
        </mesh>
      ))}
    </group>
  )
}

function MechanicalLayer({
  selectedFloorY,
  tokens,
  visibleLayerIds,
}: {
  selectedFloorY: number
  tokens: SceneThemeTokens
  visibleLayerIds: LayerId[]
}) {
  const opacity = getLayerOpacity("mechanical", visibleLayerIds, tokens)
  const config = tokens.layerVisuals.mechanical

  return (
    <group>
      <mesh position={[0.28, selectedFloorY + 0.74, 0.72]} scale={[3.18, 0.13, 0.18]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("mechanical") ? 0.34 : 0.08}
          opacity={opacity}
          roughness={0.38}
          transparent
        />
        <Edges color={visibleLayerIds.includes("mechanical") ? config.edge : tokens.floor.edge} />
      </mesh>
      <mesh position={[1.44, selectedFloorY + 0.74, -0.38]} scale={[0.18, 0.13, 1.98]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("mechanical") ? 0.28 : 0.08}
          opacity={opacity * 0.9}
          roughness={0.42}
          transparent
        />
        <Edges color={visibleLayerIds.includes("mechanical") ? config.edge : tokens.floor.edge} />
      </mesh>
      <mesh position={[0.9, selectedFloorY + 0.9, -0.72]} scale={[0.48, 0.34, 0.2]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("mechanical") ? 0.36 : 0.08}
          opacity={opacity}
          roughness={0.4}
          transparent
        />
        <Edges color={visibleLayerIds.includes("mechanical") ? config.edge : tokens.floor.edge} />
      </mesh>
    </group>
  )
}

function ElectricalLayer({
  floorCount,
  selectedFloorY,
  tokens,
  visibleLayerIds,
}: {
  floorCount: number
  selectedFloorY: number
  tokens: SceneThemeTokens
  visibleLayerIds: LayerId[]
}) {
  const opacity = getLayerOpacity("electrical", visibleLayerIds, tokens)
  const config = tokens.layerVisuals.electrical
  const buildingHeight = Math.max(floorCount - 1, 1) * FLOOR_HEIGHT + 0.42

  return (
    <group>
      <mesh position={[-1.36, buildingHeight / 2, -0.88]} scale={[0.12, buildingHeight, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("electrical") ? 0.34 : 0.08}
          opacity={opacity}
          roughness={0.48}
          transparent
        />
        <Edges color={visibleLayerIds.includes("electrical") ? config.edge : tokens.floor.edge} />
      </mesh>
      <mesh position={[-0.24, selectedFloorY + 0.58, -0.9]} scale={[2.18, 0.07, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("electrical") ? 0.28 : 0.08}
          opacity={opacity}
          roughness={0.5}
          transparent
        />
        <Edges color={visibleLayerIds.includes("electrical") ? config.edge : tokens.floor.edge} />
      </mesh>
      <mesh position={[1.88, selectedFloorY + 0.45, 0.96]} scale={[0.1, 0.1, 0.92]}>
        <boxGeometry />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={visibleLayerIds.includes("electrical") ? 0.2 : 0.06}
          opacity={opacity * 0.82}
          transparent
        />
      </mesh>
    </group>
  )
}

function CoordinatedModelLayers({
  floorCount,
  selectedFloorY,
  tokens,
  visibleLayerIds,
}: {
  floorCount: number
  selectedFloorY: number
  tokens: SceneThemeTokens
  visibleLayerIds: LayerId[]
}) {
  return (
    <>
      <ArchitectureLayer
        floorCount={floorCount}
        tokens={tokens}
        visibleLayerIds={visibleLayerIds}
      />
      <StructureLayer
        floorCount={floorCount}
        tokens={tokens}
        visibleLayerIds={visibleLayerIds}
      />
      <MechanicalLayer
        selectedFloorY={selectedFloorY}
        tokens={tokens}
        visibleLayerIds={visibleLayerIds}
      />
      <ElectricalLayer
        floorCount={floorCount}
        selectedFloorY={selectedFloorY}
        tokens={tokens}
        visibleLayerIds={visibleLayerIds}
      />
    </>
  )
}

function ToolCue({
  activeTool,
  selectedFloorY,
  tokens,
}: Pick<ViewportRendererProps, "activeTool"> & {
  selectedFloorY: number
  tokens: SceneThemeTokens
}) {
  if (activeTool === "Section") {
    return (
      <mesh position={[0.42, selectedFloorY + 0.74, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.035, 2.35, 3.88]} />
        <meshStandardMaterial
          color={SELECTED_FLOOR_GLOW}
          depthWrite={false}
          emissive={SELECTED_FLOOR_GLOW}
          emissiveIntensity={0.42}
          opacity={tokens.floor.haloOpacity}
          side={DoubleSide}
          transparent
        />
        <Edges color={SELECTED_FLOOR_GLOW} />
      </mesh>
    )
  }

  if (activeTool === "Measure") {
    return (
      <group position={[0.24, selectedFloorY + 1.18, 1.44]}>
        <mesh rotation={[0, 0, 0.62]} scale={[2.1, 0.025, 0.025]}>
          <boxGeometry />
          <meshStandardMaterial
            color={tokens.tool.measure}
            emissive={tokens.tool.measureEmissive}
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[-0.85, -0.6, 0]} scale={0.075}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color={tokens.tool.measure}
            emissive={tokens.tool.measureEmissive}
            emissiveIntensity={0.34}
          />
        </mesh>
        <mesh position={[0.85, 0.6, 0]} scale={0.075}>
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color={tokens.tool.measure}
            emissive={tokens.tool.measureEmissive}
            emissiveIntensity={0.34}
          />
        </mesh>
      </group>
    )
  }

  if (activeTool === "Comment") {
    return (
      <group position={[-1.86, selectedFloorY + 1.02, -1.1]}>
        <mesh scale={[0.13, 0.13, 0.13]}>
          <sphereGeometry args={[1, 22, 22]} />
          <meshStandardMaterial
            color={tokens.tool.comment}
            emissive={tokens.tool.commentEmissive}
            emissiveIntensity={0.42}
          />
        </mesh>
        <mesh position={[0, -0.22, 0]} scale={[0.018, 0.34, 0.018]}>
          <boxGeometry />
          <meshStandardMaterial
            color={tokens.tool.comment}
            emissive={tokens.tool.commentEmissive}
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>
    )
  }

  return null
}

function AiFindingMarkers({
  aiReviewFindingSpatialCounts,
  selectedAiFindingActive,
  selectedFloorY,
  tokens,
}: Pick<
  ViewportRendererProps,
  "aiReviewFindingSpatialCounts" | "selectedAiFindingActive"
> & {
  selectedFloorY: number
  tokens: SceneThemeTokens
}) {
  const markers = createAiMarkers(aiReviewFindingSpatialCounts, selectedFloorY)

  return (
    <group>
      {markers.map((marker, index) => {
        const selected = selectedAiFindingActive && index === 0
        const markerColor = selected
          ? SELECTED_FLOOR_GLOW
          : tokens.highlightColors[marker.highlight]

        return (
          <group key={marker.highlight} position={marker.position}>
            <mesh position={[0, -0.22, 0]} scale={[0.018, 0.42, 0.018]}>
              <boxGeometry />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={selected ? 0.5 : 0.2}
                opacity={selected ? 0.82 : 0.58}
                transparent
              />
            </mesh>
            <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]} scale={selected ? 0.17 : 0.13}>
              <boxGeometry />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={selected ? 0.86 : 0.36}
                opacity={0.88}
                roughness={0.38}
                transparent
              />
              <Edges color={selected ? tokens.marker.selectedEdge : markerColor} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={selected ? 1.18 : 0.9}>
              <torusGeometry args={[0.18, 0.01, 8, 48]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={selected ? 0.54 : 0.18}
                opacity={selected ? 0.72 : 0.36}
                transparent
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function PreviewGhost({
  selectedFloorY,
  tokens,
}: {
  selectedFloorY: number
  tokens: SceneThemeTokens
}) {
  return (
    <group position={[0.98, selectedFloorY + 0.86, -0.54]}>
      <mesh scale={[1.08, 0.22, 0.5]}>
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.preview.color}
          depthWrite={false}
          emissive={tokens.preview.emissive}
          emissiveIntensity={0.48}
          opacity={tokens.preview.opacity}
          roughness={0.32}
          transparent
        />
        <Edges color={tokens.preview.edge} />
      </mesh>
      <mesh position={[0, -0.22, 0]} scale={[1.28, 0.018, 0.62]}>
        <boxGeometry />
        <meshStandardMaterial
          color={tokens.preview.baseline}
          emissive={tokens.preview.baselineEmissive}
          emissiveIntensity={0.28}
          opacity={tokens.preview.baselineOpacity}
          transparent
        />
      </mesh>
    </group>
  )
}

function FocusRings({
  active,
  selectedFloorY,
  tokens,
}: {
  active: boolean
  selectedFloorY: number
  tokens: SceneThemeTokens
}) {
  if (!active) {
    return null
  }

  return (
    <group position={[0, selectedFloorY + 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[2.92, 0.018, 10, 112]} />
        <meshStandardMaterial
          color={SELECTED_FLOOR_GLOW}
          emissive={SELECTED_FLOOR_GLOW}
          emissiveIntensity={0.48}
          opacity={0.74}
          transparent
        />
      </mesh>
      <mesh>
        <torusGeometry args={[3.28, 0.01, 10, 112]} />
        <meshStandardMaterial
          color={tokens.focus.secondary}
          emissive={tokens.focus.secondaryEmissive}
          emissiveIntensity={0.22}
          opacity={tokens.focus.secondaryOpacity}
          transparent
        />
      </mesh>
    </group>
  )
}

function SelectedIssueHighlight({
  selectedFloorY,
  selectedIssue,
  tokens,
  visible,
}: Pick<ViewportRendererProps, "selectedIssue"> & {
  selectedFloorY: number
  tokens: SceneThemeTokens
  visible: boolean
}) {
  if (!visible) {
    return null
  }

  const color = tokens.highlightColors[selectedIssue.highlight]
  const anchor = getObjectAnchor(selectedIssue.highlight, selectedFloorY)

  return (
    <group position={anchor}>
      <mesh scale={[0.58, 0.4, 0.42]}>
        <boxGeometry />
        <meshStandardMaterial
          color={color}
          depthWrite={false}
          emissive={color}
          emissiveIntensity={0.32}
          opacity={0.18}
          transparent
        />
        <Edges color={color} />
      </mesh>
      <mesh position={[0, 0.36, 0]} scale={[0.05, 0.05, 0.05]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.72} />
      </mesh>
      <mesh position={[0, 0.18, 0]} scale={[0.014, 0.34, 0.014]}>
        <boxGeometry />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.08}>
        <torusGeometry args={[0.42, 0.014, 10, 72]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.38}
          opacity={0.58}
          transparent
        />
      </mesh>
    </group>
  )
}

export function ProceduralBimScene({
  activeTool,
  aiReviewFindingSpatialCounts,
  aiReviewVisualsActive,
  floors,
  modelFocusActive,
  previewActive,
  selectedAiFindingActive,
  selectedFloor,
  selectedIssue,
  theme,
  visibleLayerIds,
}: ViewportRendererProps & {
  theme: ViewportTheme
}) {
  const tokens = sceneThemeTokens[theme]
  const selectedFloorIndex = getSelectedFloorIndex(floors, selectedFloor)
  const selectedFloorY = selectedFloorIndex * FLOOR_HEIGHT
  const selectedObjectVisible = visibleLayerIds.includes(
    selectedIssue.discipline,
  )

  return (
    <>
      <color attach="background" args={[tokens.background]} />
      <fog
        attach="fog"
        args={[tokens.fog.color, tokens.fog.near, tokens.fog.far]}
      />
      <ambientLight intensity={tokens.ambientLight} />
      <directionalLight position={[4, 7, 5]} intensity={tokens.keyLight} />
      <directionalLight position={[-4, 3, -3]} intensity={tokens.fillLight} />
      <pointLight
        color={SELECTED_FLOOR_GLOW}
        intensity={tokens.pointLights.cyan}
        position={[2.8, 2.2, 2.2]}
      />
      <pointLight
        color={tokens.preview.baseline}
        intensity={tokens.pointLights.warm}
        position={[-2.8, 0.55, 1.8]}
      />

      <gridHelper
        args={[12, 36, tokens.grid.major, tokens.grid.minor]}
        position={[0, -1.28, 0]}
      />

      <group
        position={[0, -1.12, 0]}
        rotation={[0, activeTool === "Pan" ? -0.56 : -0.44, 0]}
        scale={modelFocusActive ? 1.035 : 1}
      >
        <BasePlate tokens={tokens} />
        <FloorStack
          floors={floors}
          selectedFloorIndex={selectedFloorIndex}
          tokens={tokens}
        />
        <CoordinatedModelLayers
          floorCount={floors.length}
          selectedFloorY={selectedFloorY}
          tokens={tokens}
          visibleLayerIds={visibleLayerIds}
        />

        <SelectedIssueHighlight
          selectedFloorY={selectedFloorY}
          selectedIssue={selectedIssue}
          tokens={tokens}
          visible={selectedObjectVisible}
        />

        {aiReviewVisualsActive && (
          <AiFindingMarkers
            aiReviewFindingSpatialCounts={aiReviewFindingSpatialCounts}
            selectedAiFindingActive={selectedAiFindingActive}
            selectedFloorY={selectedFloorY}
            tokens={tokens}
          />
        )}

        {previewActive && (
          <PreviewGhost selectedFloorY={selectedFloorY} tokens={tokens} />
        )}

        <FocusRings
          active={modelFocusActive}
          selectedFloorY={selectedFloorY}
          tokens={tokens}
        />
        <ToolCue
          activeTool={activeTool}
          selectedFloorY={selectedFloorY}
          tokens={tokens}
        />
      </group>

      <ContactShadows
        blur={2.8}
        far={7}
        opacity={tokens.shadowOpacity}
        position={[0, -1.32, 0]}
        scale={9}
      />
      <OrbitControls
        enableDamping
        enablePan={false}
        maxDistance={8.2}
        minDistance={4.2}
        target={[0, 0.1, 0]}
      />
    </>
  )
}
