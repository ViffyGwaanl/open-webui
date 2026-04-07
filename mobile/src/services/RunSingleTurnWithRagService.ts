import type { CanonicalStreamEvent, CanonicalUsage } from '../core/chat/types'
import type { RetrievalContext } from '../core/rag/types'

type RetrievalServiceLike = {
  retrieve: (query: string, topK?: number) => Promise<RetrievalContext>
}

type TurnEvidenceServiceLike = {
  saveSnapshot: (turnId: string, snapshot: RetrievalContext & { queryText?: string }) => Promise<void>
}

type ThreadServiceLike = {
  createUserTurn: (threadId: string, prompt: string) => Promise<string>
  appendAssistantDelta: (threadId: string, text: string) => Promise<void>
  completeAssistantTurn: (threadId: string, usage: CanonicalUsage) => Promise<void>
}

type RunArgs = {
  threadId: string
  prompt: string
  streamText: (
    request: { prompt: string },
    sink: (event: CanonicalStreamEvent) => Promise<void> | void
  ) => Promise<void>
}

type Deps = {
  retrievalService: RetrievalServiceLike
  turnEvidenceService: TurnEvidenceServiceLike
  threadService: ThreadServiceLike
}

function injectContext(prompt: string, context: RetrievalContext) {
  if (context.snippets.length === 0) {
    return prompt
  }

  const sources = context.snippets
    .map(
      (snippet, index) =>
        `[Source ${index + 1}] ${snippet.sourceLabel}${
          snippet.sectionTitle ? ` / ${snippet.sectionTitle}` : ''
        }\n${snippet.snippetText}`
    )
    .join('\n\n')

  return `Use the following local evidence when answering.\n\n${sources}\n\nUser prompt:\n${prompt}`
}

export class RunSingleTurnWithRagService {
  constructor(private readonly deps: Deps) {}

  async run({ threadId, prompt, streamText }: RunArgs) {
    const context = await this.deps.retrievalService.retrieve(prompt)
    const turnId = await this.deps.threadService.createUserTurn(threadId, prompt)
    await this.deps.turnEvidenceService.saveSnapshot(turnId, {
      ...context,
      queryText: prompt
    })

    await streamText(
      {
        prompt: injectContext(prompt, context)
      },
      async (event) => {
        if (event.type === 'text_delta') {
          await this.deps.threadService.appendAssistantDelta(threadId, event.text)
        }

        if (event.type === 'response_completed') {
          await this.deps.threadService.completeAssistantTurn(threadId, event.usage)
        }

        if (event.type === 'response_failed') {
          throw new Error(event.message)
        }
      }
    )

    return context
  }
}
