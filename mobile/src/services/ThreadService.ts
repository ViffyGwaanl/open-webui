import type { CanonicalUsage } from '../core/chat/types'

export class ThreadService {
  async createUserTurn(_threadId: string, _prompt: string) {}

  async appendAssistantDelta(_threadId: string, _text: string) {}

  async completeAssistantTurn(_threadId: string, _usage: CanonicalUsage) {}
}
