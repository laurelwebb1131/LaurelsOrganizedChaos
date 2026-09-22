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

export async function requestCompanionReply(context: CompanionContext): Promise<string> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  let response: Response
  try {
    response = await fetch('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `Companion service returned ${response.status}`)
  }
  const data = (await response.json()) as CompanionReply
  if (!data.reply) throw new Error('Companion service returned an empty reply')
  return data.reply
}
