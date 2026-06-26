import { Component, type ReactNode } from "react"

interface ViewportRendererFallbackBoundaryProps {
  children: ReactNode
  fallback: ReactNode
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

  componentDidUpdate(
    previousProps: ViewportRendererFallbackBoundaryProps,
  ) {
    if (
      previousProps.resetKey !== this.props.resetKey &&
      this.state.hasError
    ) {
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
