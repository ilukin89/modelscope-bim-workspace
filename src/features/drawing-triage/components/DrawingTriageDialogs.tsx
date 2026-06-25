import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { CandidateId } from "../types"

type DrawingTriageDialogsProps = {
  changeDrawingDialogOpen: boolean
  issuePendingRemoval: CandidateId | null
  removeDrawingDialogOpen: boolean
  onChangeDrawing: () => void
  onChangeDrawingDialogOpenChange: (open: boolean) => void
  onIssuePendingRemovalChange: (candidateId: CandidateId | null) => void
  onRemoveCandidateIssue: (candidateId: CandidateId) => void
  onRemoveDrawing: () => void
  onRemoveDrawingDialogOpenChange: (open: boolean) => void
}

export function DrawingTriageDialogs({
  changeDrawingDialogOpen,
  issuePendingRemoval,
  removeDrawingDialogOpen,
  onChangeDrawing,
  onChangeDrawingDialogOpenChange,
  onIssuePendingRemovalChange,
  onRemoveCandidateIssue,
  onRemoveDrawing,
  onRemoveDrawingDialogOpenChange,
}: DrawingTriageDialogsProps) {
  return (
    <>
      <AlertDialog
        open={changeDrawingDialogOpen}
        onOpenChange={onChangeDrawingDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change drawing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the current drawing, local triage results, created
              issues and follow-up state before returning to drawing selection.
              This cannot be undone in this prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onChangeDrawing}>
              Change drawing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeDrawingDialogOpen}
        onOpenChange={onRemoveDrawingDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove drawing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the current drawing and clear its local triage
              results, created issues and follow-up state. This cannot be undone
              in this prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onRemoveDrawing}
            >
              Remove drawing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={issuePendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) onIssuePendingRemovalChange(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the created issue from the local review list. The
              original AI candidate will remain available on the sheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (issuePendingRemoval) {
                  onRemoveCandidateIssue(issuePendingRemoval)
                }
              }}
            >
              Remove issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
