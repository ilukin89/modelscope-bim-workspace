import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

const ENVIRONMENT_VARIABLES = [
  "MODELSCOPE_SUPABASE_SMOKE_URL",
  "MODELSCOPE_SUPABASE_SMOKE_ANON_KEY",
  "MODELSCOPE_SUPABASE_SMOKE_EMAIL",
  "MODELSCOPE_SUPABASE_SMOKE_PASSWORD",
  "MODELSCOPE_SUPABASE_SMOKE_PROJECT_ID",
  "MODELSCOPE_SUPABASE_SMOKE_CONFIRM_DEDICATED_TARGET",
]
const REQUIRED_CONFIRMATION = "I_UNDERSTAND_THIS_WRITES_HISTORY"

function readConfiguration() {
  const missingVariables = ENVIRONMENT_VARIABLES.filter(
    (name) => !process.env[name]?.trim(),
  )

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required smoke-test configuration: ${missingVariables.join(", ")}. See docs/supabase-model-review-smoke-test.md.`,
    )
  }

  const configuration = {
    anonKey: process.env.MODELSCOPE_SUPABASE_SMOKE_ANON_KEY.trim(),
    confirmation:
      process.env.MODELSCOPE_SUPABASE_SMOKE_CONFIRM_DEDICATED_TARGET.trim(),
    email: process.env.MODELSCOPE_SUPABASE_SMOKE_EMAIL.trim(),
    password: process.env.MODELSCOPE_SUPABASE_SMOKE_PASSWORD,
    projectId: process.env.MODELSCOPE_SUPABASE_SMOKE_PROJECT_ID.trim(),
    url: process.env.MODELSCOPE_SUPABASE_SMOKE_URL.trim(),
  }

  if (configuration.confirmation !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `MODELSCOPE_SUPABASE_SMOKE_CONFIRM_DEDICATED_TARGET must equal ${REQUIRED_CONFIRMATION}. The test writes a permanent review-history event.`,
    )
  }

  assertNonElevatedKey(configuration.anonKey)

  try {
    new URL(configuration.url)
  } catch {
    throw new Error("MODELSCOPE_SUPABASE_SMOKE_URL must be a valid URL.")
  }

  return configuration
}

function assertNonElevatedKey(key) {
  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "The smoke test accepts only an anon or publishable key, never a secret or service-role key.",
    )
  }

  const jwtParts = key.split(".")

  if (jwtParts.length !== 3) {
    return
  }

  try {
    const payload = JSON.parse(
      Buffer.from(jwtParts[1], "base64url").toString("utf8"),
    )

    if (payload.role === "service_role") {
      throw new Error(
        "The smoke test accepts only an anon or publishable key, never a service-role key.",
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("service-role")) {
      throw error
    }
  }
}

function assertScanState(operation, response, expectedStatus, expectedToken) {
  const state = response?.scan_state

  if (!state || typeof state !== "object") {
    throw new Error(`${operation} did not return a scan state.`)
  }

  if (state.status !== expectedStatus) {
    throw new Error(
      `${operation} returned status ${String(state.status)} instead of ${expectedStatus}.`,
    )
  }

  const returnedToken = state.pending_scan_token ?? null

  if (returnedToken !== expectedToken) {
    throw new Error(`${operation} returned an unexpected pending scan token.`)
  }

  return state
}

async function callRpc(client, operation, parameters) {
  const { data, error } = await client.rpc(operation, parameters)

  if (error) {
    throw new Error(`${operation} failed: ${error.message}`)
  }

  return data
}

async function verifyPrerequisites(client, projectId) {
  const { data: scanRuns, error: scanRunError } = await client
    .from("ai_scan_runs")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .in("source", ["seed", "mock"])
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(1)

  if (scanRunError) {
    throw new Error(
      `Could not verify the configured project: ${scanRunError.message}`,
    )
  }

  const scanRunId = scanRuns?.[0]?.id

  if (!scanRunId) {
    throw new Error(
      "The configured project has no completed seed or mock AI scan run visible to the smoke-test user.",
    )
  }

  const { data: findings, error: findingError } = await client
    .from("ai_findings")
    .select("id")
    .eq("project_id", projectId)
    .eq("scan_run_id", scanRunId)
    .limit(1)

  if (findingError) {
    throw new Error(`Could not verify seeded findings: ${findingError.message}`)
  }

  if (!findings?.[0]?.id) {
    throw new Error(
      "The configured project's completed seed or mock AI scan run has no findings.",
    )
  }
}

async function verifyHistoryEventRemains(client, projectId, historyEventId) {
  const { data, error } = await client
    .from("review_history_events")
    .select("id, event_type")
    .eq("project_id", projectId)
    .eq("id", historyEventId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Could not verify the review-history event: ${error.message}`,
    )
  }

  if (!data || data.event_type !== "scan_completed") {
    throw new Error(
      "The completion review-history event was not visible after scan results were cleared.",
    )
  }
}

async function main() {
  const configuration = readConfiguration()
  const client = createClient(configuration.url, configuration.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const scanToken = randomUUID()
  let beginSucceeded = false
  let clearSucceeded = false

  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: configuration.email,
      password: configuration.password,
    })

    if (signInError) {
      throw new Error(
        `Smoke-test user authentication failed: ${signInError.message}`,
      )
    }

    await verifyPrerequisites(client, configuration.projectId)
    console.log("Prerequisites verified for the explicitly configured target.")

    const beginResponse = await callRpc(client, "begin_model_review_scan", {
      project_id: configuration.projectId,
      scan_token: scanToken,
    })
    beginSucceeded = true
    assertScanState(
      "begin_model_review_scan",
      beginResponse,
      "not_scanned",
      scanToken,
    )
    console.log("begin_model_review_scan returned the expected pending state.")

    const completeResponse = await callRpc(
      client,
      "complete_model_review_scan",
      {
        project_id: configuration.projectId,
        scan_token: scanToken,
      },
    )
    assertScanState(
      "complete_model_review_scan",
      completeResponse,
      "scanned_with_findings",
      null,
    )

    const historyEventId = completeResponse?.review_history_event?.id

    if (!historyEventId) {
      throw new Error(
        "complete_model_review_scan did not return its persistent review-history event.",
      )
    }

    console.log(
      "complete_model_review_scan returned the expected completed state.",
    )

    const clearResponse = await callRpc(
      client,
      "clear_model_review_scan_results",
      { project_id: configuration.projectId },
    )
    assertScanState(
      "clear_model_review_scan_results",
      clearResponse,
      "not_scanned",
      null,
    )
    clearSucceeded = true
    console.log(
      "clear_model_review_scan_results returned the expected reset state.",
    )

    await verifyHistoryEventRemains(
      client,
      configuration.projectId,
      historyEventId,
    )
    console.log(
      "Smoke test passed. One permanent scan-completed review-history event remains; the scan-state row remains reset to not_scanned.",
    )
  } finally {
    if (beginSucceeded && !clearSucceeded) {
      try {
        const cleanupResponse = await callRpc(
          client,
          "clear_model_review_scan_results",
          { project_id: configuration.projectId },
        )
        assertScanState(
          "cleanup clear_model_review_scan_results",
          cleanupResponse,
          "not_scanned",
          null,
        )
        console.log("Cleanup reset the scan state to not_scanned.")
      } catch (cleanupError) {
        console.error(
          `Cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : "unknown error"}`,
        )
      }
    }

    await client.auth.signOut().catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(
    `Supabase Model Review smoke test failed: ${error instanceof Error ? error.message : "unknown error"}`,
  )
  process.exitCode = 1
})
