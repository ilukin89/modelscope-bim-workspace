import { CircleAlert, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ViewerInitializationErrorBannerProps {
  onRetry: () => void
}

export function ViewerInitializationErrorBanner({
  onRetry,
}: ViewerInitializationErrorBannerProps) {
  return (
    <div
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md border border-warning/35 bg-[color-mix(in_oklab,var(--warning)_14%,var(--panel)_86%)] px-2.5 py-1.5 text-[10px] font-medium text-warning-foreground shadow-sm"
      role="status"
      aria-live="polite"
      data-testid="viewer-initialization-error"
    >
      <CircleAlert className="size-3.5 text-warning" />
      <span>Viewer unavailable</span>
      <Button
        type="button"
        variant="ghost"
        size="compact"
        onClick={onRetry}
        className="h-6 px-1.5 text-[10px] text-warning-foreground hover:bg-warning/15 hover:text-warning-foreground"
      >
        <RefreshCw className="size-3" />
        Retry
      </Button>
    </div>
  )
}
