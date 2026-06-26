import { useEffect, useState } from "react"

export type ViewportTheme = "light" | "dark"

function readViewportTheme(): ViewportTheme {
  if (typeof document === "undefined") {
    return "dark"
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function useViewportTheme() {
  const [theme, setTheme] = useState<ViewportTheme>(readViewportTheme)

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => setTheme(readViewportTheme())
    const observer = new MutationObserver(syncTheme)

    syncTheme()
    observer.observe(root, {
      attributeFilter: ["class"],
      attributes: true,
    })

    return () => observer.disconnect()
  }, [])

  return theme
}
