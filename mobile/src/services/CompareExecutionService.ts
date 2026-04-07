type CompareServiceLike = {
  startRun: (input: {
    threadId: string
    prompt: string
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
    }
  }>
}

type ProviderRuntimeServiceLike = {
  streamText: (
    request: { providerProfileId: string; modelId: string; prompt: string },
    sink: (event: any) => Promise<void> | void
  ) => Promise<void>
  generateText: (request: { providerProfileId: string; modelId: string; prompt: string }) => Promise<string>
}

type CompareExecutionServiceDeps = {
  compareService?: CompareServiceLike
  selectionService?: SelectionServiceLike
  providerRuntimeService?: ProviderRuntimeServiceLike
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

export class CompareExecutionService {
  private readonly compareService: CompareServiceLike
  private readonly selectionService: SelectionServiceLike
  private readonly providerRuntimeService: ProviderRuntimeServiceLike

  constructor({
    compareService = createDefaultCompareService(),
    selectionService = createDefaultSelectionService(),
    providerRuntimeService = createDefaultProviderRuntimeService()
  }: CompareExecutionServiceDeps = {}) {
    this.compareService = compareService
    this.selectionService = selectionService
    this.providerRuntimeService = providerRuntimeService
  }

  async run({ threadId, prompt }: { threadId: string; prompt: string }) {
    const targets = await this.selectionService.resolveCompareTargets()

    return this.compareService.startRun({
      threadId,
      prompt,
      branches: targets.branches.map((branch) => ({
        ...branch,
        streamText: (request, sink) =>
          this.providerRuntimeService.streamText(
            {
              providerProfileId: branch.providerProfileId,
              modelId: branch.modelId,
              prompt: request.prompt
            },
            sink
          )
      })),
      judge: targets.judge
        ? {
            ...targets.judge,
            streamText: (judgePrompt: string) =>
              this.providerRuntimeService.generateText({
                providerProfileId: targets.judge.providerProfileId,
                modelId: targets.judge.modelId,
                prompt: judgePrompt
              })
          }
        : undefined
    })
  }
}
