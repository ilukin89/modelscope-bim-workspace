import { describe, expect, it } from "vitest"
import type {
  ModelReviewHistoryEvent,
  ModelReviewIssue,
  ReviewIssue,
} from "@/types"
import {
  getNextIssueSequenceFromIssues,
  mergeModelReviewIssues,
  mergeReviewHistory,
  modelReviewIssueStatusTransitionLabels,
} from "./useAiReviewStateUtils"

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
