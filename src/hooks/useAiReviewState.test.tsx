// @vitest-environment happy-dom

import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getProject } from "@/data/projects"
import { ModelReviewAiReviewPanel } from "@/features/object-inspector/components/ModelReviewAiReviewPanel"

const persistence = vi.hoisted(() => ({
  beginPersistedModelReviewScan: vi.fn(),
  classifyModelReviewScanFailure: vi.fn(() => "unknown"),
  clearPersistedModelReviewScanResults: vi.fn(),
  completePersistedModelReviewScan: vi.fn(),
  createPersistedModelReviewIssue: vi.fn(),
  createScanToken: vi.fn(() => "00000000-0000-4000-8000-000000000111"),
  dismissPersistedAiFinding: vi.fn(),
  fetchPersistedModelReviewState: vi.fn(),
  removePersistedModelReviewIssue: vi.fn(),
  restorePersistedAiFinding: vi.fn(),
  updatePersistedModelReviewIssueStatus: vi.fn(),
}))

vi.mock("@/data/modelReviewPersistence", () => persistence)

import { useAiReviewState } from "./useAiReviewState"

const project = getProject("residential-tower-a")
const persistedNotScannedState = {
  findingStatuses: Object.fromEntries(
    project.issues.map((issue) => [
      issue.id,
      issue.initialAiStatus ?? "active",
    ]),
  ),
  modelReviewIssues: [],
  reviewHistory: [],
  scanStatus: "not_scanned" as const,
}
const persistedScannedState = {
  ...persistedNotScannedState,
  scanStatus: "scanned_with_findings" as const,
}
const completedScan = {
  reviewHistoryEvent: {
    id: "history-1",
    label: "AI scan completed",
    detail: "18 coordination findings available",
    time: "10:10 AM",
  },
  scanStatus: "scanned_with_findings" as const,
}

const hookOptions = {
  selectedProject: project,
  selectedProjectId: project.id,
  selectedIssue: project.issues[0],
  onIssueSelect: vi.fn(),
  setActiveInspectorTab: vi.fn(),
  setExplorerOpen: vi.fn(),
  setInspectorCollapsed: vi.fn(),
  setInspectorOpen: vi.fn(),
}

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe("Model Review scan reliability", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    vi.stubGlobal("matchMedia", () => ({ matches: false }))
    persistence.fetchPersistedModelReviewState.mockResolvedValue(
      persistedNotScannedState,
    )
    persistence.beginPersistedModelReviewScan.mockResolvedValue({
      reviewHistoryEvent: null,
      scanStatus: "not_scanned",
    })
    persistence.completePersistedModelReviewScan.mockResolvedValue(
      completedScan,
    )
    persistence.clearPersistedModelReviewScanResults.mockResolvedValue({
      reviewHistoryEvent: null,
      scanStatus: "not_scanned",
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("rolls a failed begin back safely, exposes a scan error, and logs details", async () => {
    const backendError = new Error(
      'relation "model_review_scan_states" does not exist',
    )
    persistence.beginPersistedModelReviewScan.mockRejectedValueOnce(
      backendError,
    )
    const { result } = renderHook(() => useAiReviewState(hookOptions))
    await flushPromises()

    act(() => result.current.scanWithAi())
    await flushPromises()

    expect(result.current.aiScanStatus).toBe("not_scanned")
    expect(result.current.modelReviewScanError).toBe("scan")
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to begin persisted Model Review scan"),
      backendError,
    )
  })

  it("rolls a failed completion back safely and exposes a scan error", async () => {
    const backendError = new Error("stale scan token 8de5-internal")
    persistence.completePersistedModelReviewScan.mockRejectedValueOnce(
      backendError,
    )
    const { result } = renderHook(() => useAiReviewState(hookOptions))
    await flushPromises()

    act(() => result.current.scanWithAi())
    await flushPromises()
    expect(result.current.aiScanStatus).toBe("scanning")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1250)
    })

    expect(result.current.aiScanStatus).toBe("not_scanned")
    expect(result.current.modelReviewScanError).toBe("scan")
    expect(console.error).toHaveBeenCalledWith(
      "Failed to complete persisted Model Review scan",
      backendError,
    )
  })

  it("clears the old error before retrying and keeps it cleared after success", async () => {
    persistence.beginPersistedModelReviewScan.mockRejectedValueOnce(
      new Error("first attempt failed"),
    )
    const { result } = renderHook(() => useAiReviewState(hookOptions))
    await flushPromises()
    act(() => result.current.scanWithAi())
    await flushPromises()
    expect(result.current.modelReviewScanError).toBe("scan")

    let resolveRetry: ((value: { scanStatus: "not_scanned" }) => void) | null =
      null
    persistence.beginPersistedModelReviewScan.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRetry = resolve
        }),
    )

    act(() => result.current.retryModelReviewScanOperation())
    expect(result.current.modelReviewScanError).toBeNull()

    await act(async () => {
      resolveRetry?.({ scanStatus: "not_scanned" })
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(1250)
    })

    expect(result.current.aiScanStatus).toBe("scanned_with_findings")
    expect(result.current.modelReviewScanError).toBeNull()
  })

  it("shows a recoverable clear error and removes it after a successful retry", async () => {
    persistence.fetchPersistedModelReviewState.mockResolvedValueOnce(
      persistedScannedState,
    )
    persistence.clearPersistedModelReviewScanResults.mockRejectedValueOnce(
      new Error("permission denied for internal_table"),
    )
    const { result } = renderHook(() => useAiReviewState(hookOptions))
    await flushPromises()
    expect(result.current.aiScanStatus).toBe("scanned_with_findings")

    act(() => result.current.clearAiScanResults())
    await flushPromises()

    expect(result.current.aiScanStatus).toBe("scanned_with_findings")
    expect(result.current.modelReviewScanError).toBe("clear")

    act(() => result.current.retryModelReviewScanOperation())
    expect(result.current.modelReviewScanError).toBeNull()
    await flushPromises()

    expect(result.current.aiScanStatus).toBe("not_scanned")
    expect(result.current.modelReviewScanError).toBeNull()
  })

  it("reports a persisted-state load failure and retries the same load", async () => {
    const loadError = new Error("internal persistence URL failed")
    persistence.fetchPersistedModelReviewState
      .mockRejectedValueOnce(loadError)
      .mockResolvedValueOnce(persistedScannedState)
    const { result } = renderHook(() => useAiReviewState(hookOptions))
    await flushPromises()

    expect(result.current.aiScanStatus).toBe("not_scanned")
    expect(result.current.modelReviewScanError).toBe("load")
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load persisted Model Review state",
      loadError,
    )

    act(() => result.current.retryModelReviewScanOperation())
    expect(result.current.modelReviewScanError).toBeNull()
    await flushPromises()

    expect(result.current.aiScanStatus).toBe("scanned_with_findings")
    expect(result.current.modelReviewScanError).toBeNull()
  })
})

describe("Model Review scan error notice", () => {
  afterEach(cleanup)

  it("shows accessible recovery copy without exposing backend details", () => {
    const onRetryScanError = vi.fn()

    render(
      <ModelReviewAiReviewPanel
        aiFindingStatuses={{}}
        aiFindings={[]}
        aiFindingStatus="active"
        aiGroupingMode="severity"
        aiScanStatus="not_scanned"
        modelReviewIssues={[]}
        modelReviewScanError="scan"
        modelReviewScanFailureReason="unknown"
        previewActive={false}
        selectedFindingId={null}
        onClearScanResults={vi.fn()}
        onCreateIssue={vi.fn()}
        onDismissFinding={vi.fn()}
        onDropIssue={vi.fn()}
        onFindingSelect={vi.fn()}
        onGroupingModeChange={vi.fn()}
        onPreviewChange={vi.fn()}
        onRescanAi={vi.fn()}
        onRestoreFinding={vi.fn()}
        onRetryScanError={onRetryScanError}
        onViewCreatedIssueDetails={vi.fn()}
        onViewFindingInModel={vi.fn()}
      />,
    )

    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain(
      "The AI scan could not be completed. Please try again.",
    )
    expect(alert.textContent).not.toContain("model_review_scan_states")
    expect(alert.textContent).not.toContain("begin_model_review_scan")
    expect(screen.queryByRole("button", { name: "Scan with AI" })).toBeNull()

    const retryButton = screen.getByRole("button", { name: "Try again" })
    expect(retryButton.className).toContain("h-8")
    expect(retryButton.className).toContain("w-full")
    expect(retryButton.className).toContain("bg-[var(--destructive-action)]")

    fireEvent.click(retryButton)
    expect(onRetryScanError).toHaveBeenCalledOnce()
  })

  it("does not show Rescan alongside Try again for a scan error", () => {
    const renderPanel = (modelReviewScanError: "scan" | null) => (
      <ModelReviewAiReviewPanel
        aiFindingStatuses={{}}
        aiFindings={[project.issues[0]]}
        aiFindingStatus="active"
        aiGroupingMode="severity"
        aiScanStatus="not_scanned"
        modelReviewIssues={[]}
        modelReviewScanError={modelReviewScanError}
        modelReviewScanFailureReason="unknown"
        previewActive={false}
        selectedFindingId={null}
        onClearScanResults={vi.fn()}
        onCreateIssue={vi.fn()}
        onDismissFinding={vi.fn()}
        onDropIssue={vi.fn()}
        onFindingSelect={vi.fn()}
        onGroupingModeChange={vi.fn()}
        onPreviewChange={vi.fn()}
        onRescanAi={vi.fn()}
        onRestoreFinding={vi.fn()}
        onRetryScanError={vi.fn()}
        onViewCreatedIssueDetails={vi.fn()}
        onViewFindingInModel={vi.fn()}
      />
    )
    const { rerender } = render(renderPanel("scan"))

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Rescan" })).toBeNull()

    rerender(renderPanel(null))
    expect(screen.getByRole("button", { name: "Rescan" })).toBeTruthy()
  })

  it.each([
    [
      "network",
      "The AI scan could not be completed because the network connection was lost. Please reconnect and try again.",
    ],
    [
      "session",
      "Your session may have expired. Please sign in again and retry the scan.",
    ],
    [
      "server",
      "The AI scan could not be completed due to a server error. Please try again.",
    ],
    ["unknown", "The AI scan could not be completed. Please try again."],
  ] as const)("shows safe %s scan failure copy", (reason, message) => {
    render(
      <ModelReviewAiReviewPanel
        aiFindingStatuses={{}}
        aiFindings={[]}
        aiFindingStatus="active"
        aiGroupingMode="severity"
        aiScanStatus="not_scanned"
        modelReviewIssues={[]}
        modelReviewScanError="scan"
        modelReviewScanFailureReason={reason}
        previewActive={false}
        selectedFindingId={null}
        onClearScanResults={vi.fn()}
        onCreateIssue={vi.fn()}
        onDismissFinding={vi.fn()}
        onDropIssue={vi.fn()}
        onFindingSelect={vi.fn()}
        onGroupingModeChange={vi.fn()}
        onPreviewChange={vi.fn()}
        onRescanAi={vi.fn()}
        onRestoreFinding={vi.fn()}
        onRetryScanError={vi.fn()}
        onViewCreatedIssueDetails={vi.fn()}
        onViewFindingInModel={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert").textContent).toContain(message)
  })
})
