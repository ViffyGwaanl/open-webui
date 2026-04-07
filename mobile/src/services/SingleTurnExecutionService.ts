import type { CanonicalUsage } from '../core/chat/types'

type SelectionServiceLike = {
  resolveSingleChatTarget: () => Promise<{
    providerProfileId: string
    providerLabel: string
    modelId: string
    modelLabel: string
  }>
}

type ProviderRuntimeServiceLike = {
  streamText: (
    request: { providerProfileId: string; modelId: string; prompt: string },
    sink: (event: {
      type: 'response_started'
    } | {
      type: 'text_delta'
      text: string
    } | {
      type: 'response_completed'
      usage: CanonicalUsage
    } | {
      type: 'response_failed'
      message: string
    }) => Promise<void> | void
  ) => Promise<void>
}

type ThreadServiceLike = {
  createUserTurn: (threadId: string, prompt: string) => Promise<string>
  appendAssistantDelta: (threadId: string, text: string) => Promise<void>
  completeAssistantTurn: (threadId: string, usage: CanonicalUsage) => Promise<void>
}

type SingleTurnExecutionServiceDeps = {
  selectionService?: SelectionServiceLike
  providerRuntimeService?: ProviderRuntimeServiceLike
  threadService?: ThreadServiceLike
}

function createDefaultSelectionService(): SelectionServiceLike {
  const { DefaultModelSelectionService } = require('./DefaultModelSelectionService') as typeof import('./DefaultModelSelectionService')
  return new DefaultModelSelectionService()
}

function createDefaultProviderRuntimeService(): ProviderRuntimeServiceLike {
  const { ProviderRuntimeService } = require('./ProviderRuntimeService') as typeof import('./ProviderRuntimeService')
  return new ProviderRuntimeService()
}

function createDefaultThreadService(): ThreadServiceLike {
  const { ThreadService } = require('./ThreadService') as typeof import('./ThreadService')
  return new ThreadService()
}

export class SingleTurnExecutionService {
  private readonly selectionService: SelectionServiceLike
  private readonly providerRuntimeService: ProviderRuntimeServiceLike
  private readonly threadService: ThreadServiceLike

  constructor({
    selectionService = createDefaultSelectionService(),
    providerRuntimeService = createDefaultProviderRuntimeService(),
    threadService = createDefaultThreadService()
  }: SingleTurnExecutionServiceDeps = {}) {
    this.selectionService = selectionService
    this.providerRuntimeService = providerRuntimeService
    this.threadService = threadService
  }

  async run({ threadId, prompt }: { threadId: string; prompt: string }) {
    const target = await this.selectionService.resolveSingleChatTarget()
    await this.threadService.createUserTurn(threadId, prompt)

    await this.providerRuntimeService.streamText(
      {
        providerProfileId: target.providerProfileId,
        modelId: target.modelId,
        prompt
      },
      async (event) => {
        if (event.type === 'text_delta') {
          await this.threadService.appendAssistantDelta(threadId, event.text)
        }

        if (event.type === 'response_completed') {
          await this.threadService.completeAssistantTurn(threadId, event.usage)
        }

        if (event.type === 'response_failed') {
          throw new Error(event.message)
        }
      }
    )

    return target
  }
}
