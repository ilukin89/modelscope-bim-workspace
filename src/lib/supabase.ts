import { AuthError, createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD?.trim()

export const demoEmail =
  import.meta.env.VITE_DEMO_EMAIL?.trim() || "demo@modelscope.local"

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "missing-supabase-anon-key",
)

const getMissingConfigMessage = () => {
  const missingValues = [
    !supabaseUrl && "VITE_SUPABASE_URL",
    !supabaseAnonKey && "VITE_SUPABASE_ANON_KEY",
    !demoPassword && "VITE_DEMO_PASSWORD",
  ].filter(Boolean)

  if (missingValues.length === 0) {
    return null
  }

  return `Missing Supabase demo configuration: ${missingValues.join(", ")}.`
}

export async function signInAsDemo() {
  const configMessage = getMissingConfigMessage()

  if (configMessage) {
    return {
      data: { session: null, user: null },
      error: new AuthError(configMessage),
    }
  }

  return supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  })
}
