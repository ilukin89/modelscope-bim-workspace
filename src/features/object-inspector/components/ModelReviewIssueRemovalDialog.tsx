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

interface ModelReviewIssueRemovalDialogProps {
  open: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ModelReviewIssueRemovalDialog({
  open,
  onConfirm,
  onOpenChange,
}: ModelReviewIssueRemovalDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove issue?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the created issue from the Model Review issue list.
            The original AI finding will remain available in AI Review.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-[var(--destructive-action)] text-[var(--destructive-action-foreground)] hover:bg-[var(--destructive-action-hover)]"
            onClick={onConfirm}
          >
            Remove issue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
