export type CompanionContext = {
  companionName: string
  companionRole: string
  companionContext: string
  realm: string
  userMessage: string
}

export type CompanionReply = {
  reply: string
}

export async function requestCompanionReply(context: CompanionContext): Promise<string> {
  const response = await fetch('/api/companion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  })

  if (!response.ok) throw new Error(`Companion service returned ${response.status}`)
  const data = (await response.json()) as CompanionReply
  if (!data.reply) throw new Error('Companion service returned an empty reply')
  return data.reply
}
