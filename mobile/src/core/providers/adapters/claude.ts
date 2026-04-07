import type { AdapterModelDescriptor, ProviderAdapter } from '../types'

const CLAUDE_MODELS: AdapterModelDescriptor[] = [
  {
    modelId: 'claude-3-7-sonnet-latest',
    label: 'claude-3-7-sonnet-latest',
    supportsStreaming: true,
    supportsReasoning: true,
    isEmbeddingModel: false
  },
  {
    modelId: 'claude-3-5-haiku-latest',
    label: 'claude-3-5-haiku-latest',
    supportsStreaming: true,
    supportsReasoning: false,
    isEmbeddingModel: false
  }
]

export class ClaudeAdapter implements ProviderAdapter {
  async listModels() {
    return CLAUDE_MODELS
  }
}
