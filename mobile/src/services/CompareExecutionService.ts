import type { RetrievalContext } from '../core/rag/types'

type CompareServiceLike = {
  startRun: (input: {
    threadId: string
    prompt: string
    presetId?: string | null
    retrievalContext?: RetrievalContext
    branches: Array<{
      providerProfileId: string
      providerLabel: string
      modelId: string
      modelLabel: string
      streamText: (
        request: { prompt: string },
        sink: (event: any) => Promise<void> | void
      ) => Promise<void>
    }>
    judge?: {
      providerProfileId: string
      providerLabel: string
      modelId: string
      modelLabel: string
      streamText: (prompt: string) => Promise<string>
    }
  }) => Promise<{ compareRunId: string; promptTurnId: string; status: string }>
}

type SelectionServiceLike = {
  resolveCompareTargets: () => Promise<{
    presetId: string | null
    sharedContextEnabled: boolean
    branches: Array<{
      providerProfileId: string
      providerLabel: string
      modelId: string
    modelLabel: string
    }>
    judge: {
      providerProfileId: string
      providerLabel: string
      modelId: string
      modelLabel: string
    } | null
  }>
  resolveEmbeddingTarget?: () => Promise<{
    providerProfileId: string
    providerLabel: string
    modelId: string
    modelLabel: string
  }>
}

type ProviderRuntimeServiceLike = {
  streamText: (
    request: { providerProfileId: string; modelId: string; prompt: string },
    sink: (event: any) => Promise<void> | void
  ) => Promise<void>
  generateText: (request: { providerProfileId: string; modelId: string; prompt: string }) => Promise<string>
  embedTexts: (request: {
    providerProfileId: string
    modelId: string
    texts: string[]
  }) => Promise<number[][]>
}

type CompareExecutionServiceDeps = {
  compareService?: CompareServiceLike
  selectionService?: SelectionServiceLike
  providerRuntimeService?: ProviderRuntimeServiceLike
  createRetrievalService?: (input: {
    providerProfileId: string
    modelId: string
  }) => {
    retrieve: (query: string, topK?: number) => Promise<RetrievalContext>
  }
}

function createDefaultCompareService(): CompareServiceLike {
  const { CompareService } = require('./CompareService') as typeof import('./CompareService')
  return new CompareService()
}

function createDefaultSelectionService(): SelectionServiceLike {
  const { DefaultModelSelectionService } = require('./DefaultModelSelectionService') as typeof import('./DefaultModelSelectionService')
  return new DefaultModelSelectionService()
}

function createDefaultProviderRuntimeService(): ProviderRuntimeServiceLike {
  const { ProviderRuntimeService } = require('./ProviderRuntimeService') as typeof import('./ProviderRuntimeService')
  return new ProviderRuntimeService()
}

function injectSharedContext(prompt: string, context: RetrievalContext | null) {
  if (!context || context.snippets.length === 0) {
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

  return `Use the same local evidence for all compared answers.\n\n${sources}\n\nUser prompt:\n${prompt}`
}

export class CompareExecutionService {
  private readonly compareService: CompareServiceLike
  private readonly selectionService: SelectionServiceLike
  private readonly providerRuntimeService: ProviderRuntimeServiceLike
  private readonly createRetrievalService: NonNullable<CompareExecutionServiceDeps['createRetrievalService']>

  constructor({
    compareService = createDefaultCompareService(),
    selectionService = createDefaultSelectionService(),
    providerRuntimeService = createDefaultProviderRuntimeService(),
    createRetrievalService = ({ providerProfileId, modelId }) => {
      const { RetrievalService } = require('./RetrievalService') as typeof import('./RetrievalService')
      const { RagIndexRepository } = require('../storage/index-db/repositories/RagIndexRepository') as typeof import('../storage/index-db/repositories/RagIndexRepository')

      return new RetrievalService({
        repository: new RagIndexRepository(),
        embeddingGateway: providerRuntimeService,
        embeddingProviderProfileId: providerProfileId,
        embeddingModelId: modelId
      })
    }
  }: CompareExecutionServiceDeps = {}) {
    this.compareService = compareService
    this.selectionService = selectionService
    this.providerRuntimeService = providerRuntimeService
    this.createRetrievalService = createRetrievalService
  }

  async run({ threadId, prompt }: { threadId: string; prompt: string }) {
    const targets = await this.selectionService.resolveCompareTargets()
    const judgeTarget = targets.judge
    const retrievalContext =
      targets.sharedContextEnabled
        ? await this.loadSharedRetrievalContext(prompt)
        : null

    return this.compareService.startRun({
      threadId,
      prompt,
      presetId: targets.presetId,
      retrievalContext: retrievalContext ?? undefined,
      branches: targets.branches.map((branch) => ({
        ...branch,
        streamText: (request, sink) =>
          this.providerRuntimeService.streamText(
            {
              providerProfileId: branch.providerProfileId,
              modelId: branch.modelId,
              prompt: injectSharedContext(request.prompt, retrievalContext)
            },
            sink
          )
      })),
      judge: judgeTarget
        ? {
            ...judgeTarget,
            streamText: (judgePrompt: string) =>
              this.providerRuntimeService.generateText({
                providerProfileId: judgeTarget.providerProfileId,
                modelId: judgeTarget.modelId,
                prompt: judgePrompt
              })
          }
        : undefined
    })
  }

  private async loadSharedRetrievalContext(prompt: string) {
    if (!this.selectionService.resolveEmbeddingTarget) {
      return null
    }

    try {
      const embeddingTarget = await this.selectionService.resolveEmbeddingTarget()
      const retrievalService = this.createRetrievalService({
        providerProfileId: embeddingTarget.providerProfileId,
        modelId: embeddingTarget.modelId
      })

      return await retrievalService.retrieve(prompt)
    } catch {
      return null
    }
  }
}
