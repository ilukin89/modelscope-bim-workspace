import { useState } from "react"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { demoEmail, signInAsDemo } from "@/lib/supabase"

const demoPassword = import.meta.env.VITE_DEMO_PASSWORD ?? ""

export function LoginScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setErrorMessage(null)
    setSigningIn(true)

    const { error } = await signInAsDemo()

    if (error) {
      setErrorMessage(error.message)
    }

    setSigningIn(false)
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background px-4 py-8 text-foreground">
      <section
        className="w-full max-w-[360px] rounded-md border border-border bg-panel p-5 shadow-sm"
        aria-labelledby="demo-login-title"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Box className="size-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1
              id="demo-login-title"
              className="text-base font-semibold leading-6 text-foreground"
            >
              ModelScope
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              BIM Model Review &middot; Demo Access
            </p>
          </div>
        </div>

        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          Use the seeded demo reviewer account to enter the portfolio workspace.
        </p>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold leading-3 text-muted-foreground">
              Email
            </span>
            <input
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              readOnly
              value={demoEmail}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold leading-3 text-muted-foreground">
              Password
            </span>
            <input
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              readOnly
              type="password"
              value={demoPassword}
            />
          </label>
        </div>

        <Button
          className="mt-4 min-h-11 w-full"
          disabled={signingIn}
          onClick={handleSignIn}
          type="button"
        >
          {signingIn ? "Signing in..." : "Sign in to Demo"}
        </Button>

        {errorMessage && (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive dark:text-destructive-foreground">
            {errorMessage}
          </p>
        )}
      </section>
    </main>
  )
}
