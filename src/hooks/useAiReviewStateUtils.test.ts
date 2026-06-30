import { describe, expect, it } from "vitest"
import type {
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ProjectAiReviewState,
  ProjectData,
  ReviewIssue,
} from "@/types"
import {
  getInitialProjectAiReviewState,
  getNextIssueSequenceFromIssues,
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
    const followUpIssue = {
      ...createReviewIssue(
        "finding-follow-up",
        "FND-002",
        "Follow-up fixture finding",
      ),
      initialAiStatus: "follow-up",
    } satisfies ReviewIssue
    const project = createProject([activeIssue, followUpIssue])

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
            [followUpIssue.id]: "active",
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
