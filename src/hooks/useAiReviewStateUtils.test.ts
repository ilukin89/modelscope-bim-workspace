import { describe, expect, it } from "vitest"
import type {
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  AiFindingWorkflowStatus,
  ProjectAiReviewState,
  ProjectData,
  ReviewIssue,
} from "@/types"
import {
  applyAiFindingDecision,
  applyModelReviewIssueStatusUpdate,
  applyModelReviewIssueRemoval,
  getInitialProjectAiReviewState,
  getNextIssueSequenceFromIssues,
  getModelReviewIssueFocusAfterRemoval,
  hasRestorableAiCandidateActivity,
  mergeModelReviewIssues,
  mergeReviewHistory,
  modelReviewIssueStatusTransitionLabels,
  resetAiCandidateState,
  restorePersistedModelReviewState,
} from "./useAiReviewStateUtils"

type PersistedReviewState = Parameters<
  typeof restorePersistedModelReviewState
>[1]

const createReviewIssue = (
  id: string,
  code: string,
  title: string,
): ReviewIssue => ({
  id,
  code,
  title,
  object: `Object ${code}`,
  location: "Level 02 - Coordination Zone",
  severity: "warning",
  status: "Open",
  findingType: "coordination",
  discipline: "mechanical",
  highlight: "duct",
  details: {
    shortCode: "MEP",
    objectId: `OBJ-${code}`,
    category: "Mechanical Duct",
    system: "Supply Air",
    type: "Rectangular duct",
    level: "Level 02",
    elevation: "+8.400 m",
    material: "Galvanized steel",
    fireRating: "Not rated",
    guid: `guid-${id}`,
    geometry: {
      width: "450 mm",
      height: "250 mm",
      length: "6.20 m",
      volume: "0.698 m3",
    },
  },
})

const createModelReviewIssue = (
  id: string,
  sourceFindingId: string,
  sourceFindingCode: string,
  title: string,
  overrides: Partial<ModelReviewIssue> = {},
): ModelReviewIssue => {
  const sourceIssue = createReviewIssue(
    sourceFindingId,
    sourceFindingCode,
    title,
  )

  return {
    id,
    title,
    relatedObject: sourceIssue.object,
    relatedLevel: sourceIssue.details.level,
    priority: sourceIssue.severity,
    status: "Open",
    sourceFindingId,
    sourceFindingCode,
    sourceIssue,
    ...overrides,
  }
}

const createHistoryEvent = (
  id: string,
  label: string,
): ModelReviewHistoryEvent => ({
  id,
  label,
  detail: `${label} detail`,
  time: "09:30",
})

const createProject = (issues: ReviewIssue[]): ProjectData => ({
  id: "residential-tower-a",
  name: "Test project",
  modelLabel: "Test model",
  floors: [],
  layers: [],
  savedViews: [],
  issues,
  defaultFloor: "Level 02",
  defaultIssueId: issues[0]?.id ?? "",
})

const createPersistedReviewState = (
  overrides: Partial<PersistedReviewState> = {},
): PersistedReviewState => ({
  findingStatuses: {},
  modelReviewIssues: [],
  reviewHistory: [],
  ...overrides,
})

const createProjectAiReviewState = (
  project: ProjectData,
  overrides: Partial<ProjectAiReviewState> = {},
): ProjectAiReviewState => ({
  ...getInitialProjectAiReviewState(project),
  ...overrides,
})

describe("mergeModelReviewIssues", () => {
  it("keeps local issues and merges incoming issues with incoming order first", () => {
    const existingIssue = createModelReviewIssue(
      "MR-001",
      "finding-local",
      "LOC-001",
      "Local issue",
    )
    const incomingIssue = createModelReviewIssue(
      "MR-002",
      "finding-persisted",
      "PER-001",
      "Persisted issue",
    )

    const mergedIssues = mergeModelReviewIssues(
      [existingIssue],
      [incomingIssue],
    )

    expect(mergedIssues).toEqual([incomingIssue, existingIssue])
  })

  it("dedupes by source finding and lets incoming issues win conflicts", () => {
    const existingOnlyIssue = createModelReviewIssue(
      "MR-001",
      "finding-local-only",
      "LOC-001",
      "Local only issue",
    )
    const existingConflict = createModelReviewIssue(
      "MR-002",
      "finding-shared",
      "SHR-001",
      "Existing shared issue",
    )
    const incomingConflict = {
      ...createModelReviewIssue(
        "MR-003",
        "finding-shared",
        "SHR-001",
        "Incoming shared issue",
      ),
      status: "Blocked",
    } satisfies ModelReviewIssue
    const incomingFirst = createModelReviewIssue(
      "MR-004",
      "finding-incoming-first",
      "INC-001",
      "Incoming first issue",
    )

    const mergedIssues = mergeModelReviewIssues(
      [existingOnlyIssue, existingConflict],
      [incomingFirst, incomingConflict],
    )

    expect(mergedIssues).toEqual([
      incomingFirst,
      incomingConflict,
      existingOnlyIssue,
    ])
  })
})

describe("mergeReviewHistory", () => {
  it("merges local and persisted history with incoming entries first", () => {
    const localEvent = createHistoryEvent("event-local", "Local event")
    const incomingEvent = createHistoryEvent(
      "event-persisted",
      "Persisted event",
    )

    const mergedEvents = mergeReviewHistory([localEvent], [incomingEvent])

    expect(mergedEvents).toEqual([incomingEvent, localEvent])
  })

  it("dedupes by event id and lets incoming history win conflicts", () => {
    const localOnlyEvent = createHistoryEvent("event-local", "Local event")
    const localSharedEvent = createHistoryEvent("event-shared", "Local shared")
    const incomingSharedEvent = createHistoryEvent(
      "event-shared",
      "Persisted shared",
    )
    const incomingFirstEvent = createHistoryEvent(
      "event-persisted",
      "Persisted event",
    )

    const mergedEvents = mergeReviewHistory(
      [localOnlyEvent, localSharedEvent],
      [incomingFirstEvent, incomingSharedEvent],
    )

    expect(mergedEvents).toEqual([
      incomingFirstEvent,
      incomingSharedEvent,
      localOnlyEvent,
    ])
  })

  it("keeps the first eight merged history entries", () => {
    const incomingEvents = [
      createHistoryEvent("event-01", "Event 01"),
      createHistoryEvent("event-02", "Event 02"),
      createHistoryEvent("event-03", "Event 03"),
      createHistoryEvent("event-04", "Event 04"),
      createHistoryEvent("event-05", "Event 05"),
    ]
    const localEvents = [
      createHistoryEvent("event-06", "Event 06"),
      createHistoryEvent("event-07", "Event 07"),
      createHistoryEvent("event-08", "Event 08"),
      createHistoryEvent("event-09", "Event 09"),
    ]

    const mergedEvents = mergeReviewHistory(localEvents, incomingEvents)

    expect(mergedEvents.map((event) => event.id)).toEqual([
      "event-01",
      "event-02",
      "event-03",
      "event-04",
      "event-05",
      "event-06",
      "event-07",
      "event-08",
    ])
  })
})

describe("getNextIssueSequenceFromIssues", () => {
  it("returns 1 when there are no issues", () => {
    expect(getNextIssueSequenceFromIssues([])).toBe(1)
  })

  it("returns the next number after the highest MR id", () => {
    const issues = [
      createModelReviewIssue("MR-001", "finding-1", "FND-001", "Issue 1"),
      createModelReviewIssue("MR-014", "finding-2", "FND-002", "Issue 2"),
      createModelReviewIssue("MR-003", "finding-3", "FND-003", "Issue 3"),
    ]

    expect(getNextIssueSequenceFromIssues(issues)).toBe(15)
  })

  it("ignores non-MR ids", () => {
    const issues = [
      createModelReviewIssue("ISSUE-900", "finding-1", "FND-001", "Issue 1"),
      createModelReviewIssue("MR-002", "finding-2", "FND-002", "Issue 2"),
    ]

    expect(getNextIssueSequenceFromIssues(issues)).toBe(3)
  })

  it("handles mixed ids safely", () => {
    const issues = [
      createModelReviewIssue("MR-010", "finding-1", "FND-001", "Issue 1"),
      createModelReviewIssue("MR-12", "finding-2", "FND-002", "Issue 2"),
      createModelReviewIssue("MR-ABC", "finding-3", "FND-003", "Issue 3"),
      createModelReviewIssue("review-099", "finding-4", "FND-004", "Issue 4"),
    ]

    expect(getNextIssueSequenceFromIssues(issues)).toBe(11)
  })
})

describe("resetAiCandidateState", () => {
  it("resets only AI candidate state and preserves created issues, history, and sequence", () => {
    const activeIssue = createReviewIssue(
      "finding-active",
      "FND-001",
      "Active finding",
    )
    const dismissedIssue = {
      ...createReviewIssue(
        "finding-dismissed",
        "FND-002",
        "Dismissed fixture finding",
      ),
      initialAiStatus: "dismissed",
    } satisfies ReviewIssue
    const project = createProject([activeIssue, dismissedIssue])
    const modelReviewIssue = createModelReviewIssue(
      "MR-004",
      activeIssue.id,
      activeIssue.code,
      "Created issue",
    )
    const historyEvent = createHistoryEvent("event-1", "Issue created")
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [activeIssue.id]: "issue-created",
        [dismissedIssue.id]: "active",
      },
      modelReviewIssues: [modelReviewIssue],
      nextIssueSequence: 5,
      previewIssueId: activeIssue.id,
      reviewHistory: [historyEvent],
      scanStatus: "scanned_with_findings",
      selectedFindingId: activeIssue.id,
    })

    const resetState = resetAiCandidateState(state, project)

    expect(resetState.findingStatuses).toEqual({
      [activeIssue.id]: "active",
      [dismissedIssue.id]: "dismissed",
    })
    expect(resetState.modelReviewIssues).toEqual([modelReviewIssue])
    expect(resetState.reviewHistory).toEqual([historyEvent])
    expect(resetState.nextIssueSequence).toBe(5)
    expect(resetState.previewIssueId).toBeNull()
    expect(resetState.scanStatus).toBe("not_scanned")
    expect(resetState.selectedFindingId).toBeNull()
  })
})

describe("applyModelReviewIssueRemoval", () => {
  it("removes only the selected issue, restores only its source finding, and merges persisted history", () => {
    const removedSourceIssue = createReviewIssue(
      "finding-removed",
      "FND-001",
      "Removed finding",
    )
    const retainedSourceIssue = createReviewIssue(
      "finding-retained",
      "FND-002",
      "Retained finding",
    )
    const dismissedSourceIssue = createReviewIssue(
      "finding-dismissed",
      "FND-003",
      "Dismissed finding",
    )
    const project = createProject([
      removedSourceIssue,
      retainedSourceIssue,
      dismissedSourceIssue,
    ])
    const removedIssue = createModelReviewIssue(
      "MR-001",
      removedSourceIssue.id,
      removedSourceIssue.code,
      removedSourceIssue.title,
    )
    const retainedIssue = createModelReviewIssue(
      "MR-002",
      retainedSourceIssue.id,
      retainedSourceIssue.code,
      retainedSourceIssue.title,
    )
    const existingHistoryEvent = createHistoryEvent(
      "history-1",
      "Issue created",
    )
    const removalHistoryEvent = createHistoryEvent("history-2", "Issue removed")
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [removedSourceIssue.id]: "issue-created",
        [retainedSourceIssue.id]: "issue-created",
        [dismissedSourceIssue.id]: "dismissed",
      },
      modelReviewIssues: [removedIssue, retainedIssue],
      reviewHistory: [existingHistoryEvent],
    })

    const nextState = applyModelReviewIssueRemoval(state, {
      findingStatus: "active",
      issueId: removedIssue.id,
      reviewHistoryEvent: removalHistoryEvent,
      sourceFindingId: removedSourceIssue.id,
    })

    expect(nextState.modelReviewIssues).toEqual([retainedIssue])
    expect(nextState.findingStatuses).toEqual({
      [removedSourceIssue.id]: "active",
      [retainedSourceIssue.id]: "issue-created",
      [dismissedSourceIssue.id]: "dismissed",
    } satisfies Record<ReviewIssue["id"], AiFindingWorkflowStatus>)
    expect(nextState.reviewHistory).toEqual([
      removalHistoryEvent,
      existingHistoryEvent,
    ])
  })

  it("does not duplicate a persisted removal history event", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const issue = createModelReviewIssue(
      "MR-001",
      sourceIssue.id,
      sourceIssue.code,
      sourceIssue.title,
    )
    const removalHistoryEvent = createHistoryEvent("history-1", "Issue removed")
    const state = createProjectAiReviewState(project, {
      modelReviewIssues: [issue],
      reviewHistory: [removalHistoryEvent],
    })

    const nextState = applyModelReviewIssueRemoval(state, {
      findingStatus: "active",
      issueId: issue.id,
      reviewHistoryEvent: removalHistoryEvent,
      sourceFindingId: sourceIssue.id,
    })

    expect(nextState.reviewHistory).toEqual([removalHistoryEvent])
  })
})

describe("applyModelReviewIssueStatusUpdate", () => {
  it("updates only the confirmed issue and merges persisted history", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const retainedSourceIssue = createReviewIssue(
      "finding-2",
      "FND-002",
      "Finding 2",
    )
    const project = createProject([sourceIssue, retainedSourceIssue])
    const issue = createModelReviewIssue(
      "MRI-RES-0001",
      sourceIssue.id,
      sourceIssue.code,
      sourceIssue.title,
      { backendIssueId: "backend-issue-1", status: "In Review" },
    )
    const retainedIssue = createModelReviewIssue(
      "MRI-RES-0002",
      retainedSourceIssue.id,
      retainedSourceIssue.code,
      retainedSourceIssue.title,
      { backendIssueId: "backend-issue-2", status: "Open" },
    )
    const statusHistoryEvent = createHistoryEvent(
      "history-status",
      "Issue status changed",
    )
    const state = createProjectAiReviewState(project, {
      modelReviewIssues: [issue, retainedIssue],
      reviewHistory: [createHistoryEvent("history-existing", "Issue created")],
    })
    const confirmedIssue = {
      ...issue,
      status: "Blocked",
    } satisfies ModelReviewIssue

    const nextState = applyModelReviewIssueStatusUpdate(state, {
      issue: confirmedIssue,
      issueId: issue.id,
      reviewHistoryEvent: statusHistoryEvent,
    })

    expect(nextState.modelReviewIssues).toEqual([confirmedIssue, retainedIssue])
    expect(nextState.reviewHistory[0]).toEqual(statusHistoryEvent)
  })
})

describe("applyAiFindingDecision", () => {
  it("applies a confirmed dismiss, clears matching preview, and merges persisted history", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const existingHistoryEvent = createHistoryEvent(
      "history-existing",
      "Finding selected",
    )
    const decisionHistoryEvent = createHistoryEvent(
      "history-decision",
      "Finding dismissed",
    )
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [sourceIssue.id]: "active",
      },
      previewIssueId: sourceIssue.id,
      reviewHistory: [existingHistoryEvent],
    })

    const nextState = applyAiFindingDecision(state, {
      clearPreviewIssueId: true,
      expectedCurrentStatus: "active",
      findingStatus: "dismissed",
      reviewHistoryEvent: decisionHistoryEvent,
      sourceFindingId: sourceIssue.id,
    })

    expect(nextState.findingStatuses[sourceIssue.id]).toBe("dismissed")
    expect(nextState.previewIssueId).toBeNull()
    expect(nextState.reviewHistory).toEqual([
      decisionHistoryEvent,
      existingHistoryEvent,
    ])
  })

  it("applies a confirmed restore without changing preview state", () => {
    const restoredIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const previewIssue = createReviewIssue("finding-2", "FND-002", "Finding 2")
    const project = createProject([restoredIssue, previewIssue])
    const decisionHistoryEvent = createHistoryEvent(
      "history-decision",
      "Finding restored",
    )
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [restoredIssue.id]: "dismissed",
        [previewIssue.id]: "active",
      },
      previewIssueId: previewIssue.id,
    })

    const nextState = applyAiFindingDecision(state, {
      expectedCurrentStatus: "dismissed",
      findingStatus: "active",
      reviewHistoryEvent: decisionHistoryEvent,
      sourceFindingId: restoredIssue.id,
    })

    expect(nextState.findingStatuses[restoredIssue.id]).toBe("active")
    expect(nextState.previewIssueId).toBe(previewIssue.id)
    expect(nextState.reviewHistory).toEqual([decisionHistoryEvent])
  })

  it("does not let a stale decision overwrite an issue-created finding", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [sourceIssue.id]: "issue-created",
      },
      previewIssueId: sourceIssue.id,
      reviewHistory: [createHistoryEvent("history-existing", "Issue created")],
    })

    const nextState = applyAiFindingDecision(state, {
      clearPreviewIssueId: true,
      expectedCurrentStatus: "active",
      findingStatus: "dismissed",
      reviewHistoryEvent: createHistoryEvent(
        "history-decision",
        "Finding dismissed",
      ),
      sourceFindingId: sourceIssue.id,
    })

    expect(nextState).toBe(state)
    expect(nextState.findingStatuses[sourceIssue.id]).toBe("issue-created")
    expect(nextState.previewIssueId).toBe(sourceIssue.id)
    expect(nextState.reviewHistory).toHaveLength(1)
  })

  it("does not append duplicate history when a confirmed decision is stale", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const historyEvent = createHistoryEvent("history-existing", "Issue created")
    const state = createProjectAiReviewState(project, {
      findingStatuses: {
        [sourceIssue.id]: "active",
      },
      reviewHistory: [historyEvent],
    })

    const nextState = applyAiFindingDecision(state, {
      expectedCurrentStatus: "dismissed",
      findingStatus: "active",
      reviewHistoryEvent: createHistoryEvent(
        "history-decision",
        "Finding restored",
      ),
      sourceFindingId: sourceIssue.id,
    })

    expect(nextState).toBe(state)
    expect(nextState.reviewHistory).toEqual([historyEvent])
  })
})

describe("getModelReviewIssueFocusAfterRemoval", () => {
  it("clears focus state that references the removed issue", () => {
    const focusState = getModelReviewIssueFocusAfterRemoval({
      focusedIssueCardId: "MR-001",
      modelFocusRequest: {
        issueId: "finding-1",
        label: "MR-001",
        modelReviewIssueId: "MR-001",
        nonce: 1,
      },
      removedIssueId: "MR-001",
    })

    expect(focusState).toEqual({
      focusedIssueCardId: null,
      modelFocusRequest: null,
    })
  })

  it("preserves unrelated focus state", () => {
    const modelFocusRequest = {
      issueId: "finding-2",
      label: "MR-002",
      modelReviewIssueId: "MR-002",
      nonce: 1,
    }
    const focusState = getModelReviewIssueFocusAfterRemoval({
      focusedIssueCardId: "MR-002",
      modelFocusRequest,
      removedIssueId: "MR-001",
    })

    expect(focusState).toEqual({
      focusedIssueCardId: "MR-002",
      modelFocusRequest,
    })
  })
})

describe("hasRestorableAiCandidateActivity", () => {
  it("returns false when the raw persisted state has no activity", () => {
    const project = createProject([
      createReviewIssue("finding-1", "FND-001", "Finding 1"),
    ])

    expect(
      hasRestorableAiCandidateActivity(createPersistedReviewState(), project),
    ).toBe(false)
  })

  it("does not treat persisted statuses matching fixture defaults as activity", () => {
    const activeIssue = createReviewIssue(
      "finding-active",
      "FND-001",
      "Active finding",
    )
    const dismissedIssue = {
      ...createReviewIssue(
        "finding-dismissed",
        "FND-002",
        "Dismissed fixture finding",
      ),
      initialAiStatus: "dismissed",
    } satisfies ReviewIssue
    const project = createProject([activeIssue, dismissedIssue])

    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          findingStatuses: {
            [activeIssue.id]: "active",
            [dismissedIssue.id]: "dismissed",
          },
        }),
        project,
      ),
    ).toBe(false)
  })

  it("does not treat persisted created issues alone as restorable candidate activity", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          modelReviewIssues: [
            createModelReviewIssue(
              "MR-001",
              sourceIssue.id,
              sourceIssue.code,
              "Persisted issue",
            ),
          ],
        }),
        project,
      ),
    ).toBe(false)
  })

  it("does not treat persisted review history alone as restorable candidate activity", () => {
    const project = createProject([
      createReviewIssue("finding-1", "FND-001", "Finding 1"),
    ])

    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          reviewHistory: [createHistoryEvent("event-1", "Issue created")],
        }),
        project,
      ),
    ).toBe(false)
  })

  it("does not let source finding references on created issues resurrect AI candidates", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          findingStatuses: {
            [sourceIssue.id]: "issue-created",
          },
          modelReviewIssues: [
            createModelReviewIssue(
              "MR-001",
              sourceIssue.id,
              sourceIssue.code,
              "Persisted issue",
            ),
          ],
        }),
        project,
      ),
    ).toBe(false)
  })

  it("treats persisted finding statuses that differ from defaults as activity", () => {
    const activeIssue = createReviewIssue(
      "finding-active",
      "FND-001",
      "Active finding",
    )
    const dismissedIssue = {
      ...createReviewIssue(
        "finding-dismissed",
        "FND-002",
        "Dismissed fixture finding",
      ),
      initialAiStatus: "dismissed",
    } satisfies ReviewIssue
    const project = createProject([activeIssue, dismissedIssue])

    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          findingStatuses: {
            [activeIssue.id]: "issue-created",
          },
        }),
        project,
      ),
    ).toBe(true)
    expect(
      hasRestorableAiCandidateActivity(
        createPersistedReviewState({
          findingStatuses: {
            [dismissedIssue.id]: "active",
          },
        }),
        project,
      ),
    ).toBe(true)
  })
})

describe("restorePersistedModelReviewState", () => {
  it("restores persisted candidate scan state when candidate statuses differ from fixture defaults", () => {
    const activeIssue = createReviewIssue(
      "finding-active",
      "FND-001",
      "Active finding",
    )
    const project = createProject([activeIssue])
    const previous = createProjectAiReviewState(project)

    const restoredState = restorePersistedModelReviewState(
      previous,
      {
        findingStatuses: {
          [activeIssue.id]: "dismissed",
        },
        modelReviewIssues: [],
        reviewHistory: [],
      },
      project,
    )

    expect(restoredState.findingStatuses[activeIssue.id]).toBe("dismissed")
    expect(restoredState.scanStatus).toBe("scanned_with_findings")
  })

  it("lets cleared AI candidate state win over persisted issues and history during restore", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const previous = resetAiCandidateState(
      createProjectAiReviewState(project, {
        modelReviewIssues: [],
        reviewHistory: [],
        scanStatus: "scanned_with_findings",
      }),
      project,
    )
    const modelReviewIssue = createModelReviewIssue(
      "MR-001",
      sourceIssue.id,
      sourceIssue.code,
      "Persisted issue",
    )
    const historyEvent = createHistoryEvent("event-1", "Issue created")

    const restoredState = restorePersistedModelReviewState(
      previous,
      {
        findingStatuses: {
          [sourceIssue.id]: "issue-created",
        },
        modelReviewIssues: [modelReviewIssue],
        reviewHistory: [historyEvent],
      },
      project,
    )

    expect(restoredState.scanStatus).toBe("not_scanned")
    expect(restoredState.findingStatuses[sourceIssue.id]).toBe("active")
    expect(restoredState.modelReviewIssues).toEqual([modelReviewIssue])
    expect(restoredState.reviewHistory).toEqual([historyEvent])
  })

  it("keeps removed issues excluded after a cleared candidate restore", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const previous = resetAiCandidateState(
      createProjectAiReviewState(project, {
        modelReviewIssues: [],
        scanStatus: "scanned_with_findings",
      }),
      project,
    )

    const restoredState = restorePersistedModelReviewState(
      previous,
      {
        findingStatuses: {
          [sourceIssue.id]: "active",
        },
        modelReviewIssues: [],
        reviewHistory: [createHistoryEvent("event-1", "Issue removed")],
      },
      project,
    )

    expect(restoredState.scanStatus).toBe("not_scanned")
    expect(restoredState.findingStatuses[sourceIssue.id]).toBe("active")
    expect(restoredState.modelReviewIssues).toEqual([])
  })

  it("does not restore an in-progress scan across sessions", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])

    const restoredState = restorePersistedModelReviewState(
      createProjectAiReviewState(project, {
        scanStatus: "scanning",
      }),
      {
        findingStatuses: {},
        modelReviewIssues: [],
        reviewHistory: [],
      },
      project,
    )

    expect(restoredState.scanStatus).toBe("not_scanned")
  })

  it("lets backend status win after rehydration and puts the issue in the matching category", () => {
    const sourceIssue = createReviewIssue("finding-1", "FND-001", "Finding 1")
    const project = createProject([sourceIssue])
    const localIssue = createModelReviewIssue(
      "MRI-RES-0001",
      sourceIssue.id,
      sourceIssue.code,
      sourceIssue.title,
      { backendIssueId: "backend-issue-1", status: "In Review" },
    )
    const persistedIssue = {
      ...localIssue,
      status: "Blocked",
    } satisfies ModelReviewIssue

    const restoredState = restorePersistedModelReviewState(
      createProjectAiReviewState(project, {
        modelReviewIssues: [localIssue],
      }),
      {
        findingStatuses: {
          [sourceIssue.id]: "issue-created",
        },
        modelReviewIssues: [persistedIssue],
        reviewHistory: [],
      },
      project,
    )

    const blockedIssues = restoredState.modelReviewIssues.filter(
      (issue) => issue.status === "Blocked",
    )

    expect(restoredState.modelReviewIssues[0]).toEqual(persistedIssue)
    expect(blockedIssues).toEqual([persistedIssue])
  })
})

describe("modelReviewIssueStatusTransitionLabels", () => {
  it("returns the current label for Open to Blocked", () => {
    expect(modelReviewIssueStatusTransitionLabels.Open?.Blocked).toBe(
      "Issue blocked",
    )
  })

  it("returns the current label for Resolved to Open", () => {
    expect(modelReviewIssueStatusTransitionLabels.Resolved?.Open).toBe(
      "Issue reopened",
    )
  })
})
