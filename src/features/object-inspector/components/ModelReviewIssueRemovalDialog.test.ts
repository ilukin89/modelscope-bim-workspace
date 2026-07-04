import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("Model Review issue removal confirmation", () => {
  const aiReviewPanelSource = readFileSync(
    resolve(
      "src/features/object-inspector/components/ModelReviewAiReviewPanel.tsx",
    ),
    "utf8",
  )
  const issuesPanelSource = readFileSync(
    resolve(
      "src/features/object-inspector/components/ModelReviewIssuesPanel.tsx",
    ),
    "utf8",
  )
  const removalDialogSource = readFileSync(
    resolve(
      "src/features/object-inspector/components/ModelReviewIssueRemovalDialog.tsx",
    ),
    "utf8",
  )

  it("uses the same confirmation dialog for both issue removal entry points", () => {
    expect(aiReviewPanelSource).toContain("ModelReviewIssueRemovalDialog")
    expect(issuesPanelSource).toContain("ModelReviewIssueRemovalDialog")
    expect(removalDialogSource).toContain("<AlertDialogTitle>Remove issue?")
    expect(removalDialogSource).toContain(
      "The original AI finding will remain available in AI Review.",
    )
    expect(removalDialogSource).toContain("bg-[var(--destructive-action)]")
  })

  it("queues issue-card menu removals instead of removing immediately", () => {
    expect(issuesPanelSource).toContain("setIssuePendingRemoval(issue)")
    expect(issuesPanelSource).toContain("open={issuePendingRemoval !== null}")
    expect(issuesPanelSource).toContain(
      "void onRemoveIssue(issuePendingRemoval.id)",
    )
    expect(issuesPanelSource).not.toContain(
      "onRemoveIssue={() => onRemoveIssue(issue.id)}",
    )
  })

  it("closes the issue-card actions menu before opening confirmation", () => {
    expect(issuesPanelSource).toContain(
      "open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}",
    )
    expect(issuesPanelSource).toContain(
      "removeIssueRequestedRef.current = true",
    )
    expect(issuesPanelSource).toContain("setActionsMenuOpen(false)")
    expect(issuesPanelSource).toContain(
      "onCloseAutoFocus={handleActionsMenuCloseAutoFocus}",
    )
    expect(issuesPanelSource).toContain("event.preventDefault()")
    expect(issuesPanelSource).toContain("onSelect={requestIssueRemoval}")
  })
})
