export type CompanionContext = {
  companionName: string
  companionRole: string
  companionContext: string
  realm: string
  userMessage: string
  goals: { title: string; realm: string; progress: number; nextStep: string }[]
  habits: { title: string; realm: string; cadence: string; completedToday: boolean }[]
}

export type CompanionReply = {
  reply: string
}

const companionEndpoint = import.meta.env.VITE_COMPANION_API_URL?.trim() || '/api/companion'

export async function requestCompanionReply(context: CompanionContext): Promise<string> {
  if (isTauriRuntime() && !import.meta.env.VITE_COMPANION_API_URL?.trim()) {
    throw new Error('Companion service is not configured for this desktop build.')
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12_000)

  let response: Response
  try {
    response = await fetch(companionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('Companion service timed out.')
    }
    throw new Error('Companion service is unavailable.')
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error?.trim() || `Companion service returned ${response.status}`)
  }

  const data = (await response.json()) as Partial<CompanionReply>
  const reply = typeof data.reply === 'string' ? data.reply.trim() : ''
  if (!reply) throw new Error('Companion service returned an empty reply')
  return reply
}

function isTauriRuntime() {
  return '__TAURI_INTERNALS__' in window
}
