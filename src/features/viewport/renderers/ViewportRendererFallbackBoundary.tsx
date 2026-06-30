import { Component, type ReactNode } from "react"

interface ViewportRendererFallbackBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
  resetKey: string
}

interface ViewportRendererFallbackBoundaryState {
  hasError: boolean
}

export class ViewportRendererFallbackBoundary extends Component<
  ViewportRendererFallbackBoundaryProps,
  ViewportRendererFallbackBoundaryState
> {
  state: ViewportRendererFallbackBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ViewportRendererFallbackBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  componentDidUpdate(previousProps: ViewportRendererFallbackBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
