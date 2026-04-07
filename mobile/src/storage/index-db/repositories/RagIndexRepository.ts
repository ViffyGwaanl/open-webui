import { and, desc, eq, type InferInsertModel } from 'drizzle-orm'

import { indexDb } from '../client'
import { documentChunks, documentTexts, documents, indexJobs } from '../schema'

type NewDocumentRecord = InferInsertModel<typeof documents>
type NewDocumentTextRecord = InferInsertModel<typeof documentTexts>
type NewIndexJobRecord = InferInsertModel<typeof indexJobs>
type NewDocumentChunkRecord = InferInsertModel<typeof documentChunks>

function parseOutline(outlineJson: string) {
  try {
    return JSON.parse(outlineJson) as Array<{ depth: number; title: string }>
  } catch {
    return []
  }
}

function countKeywordMatches(query: string, source: string) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  if (tokens.length === 0) {
    return 0
  }

  const haystack = source.toLowerCase()
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0)
}

export class RagIndexRepository {
  constructor(private readonly database = indexDb) {}

  async insertDocument(record: NewDocumentRecord) {
    await this.database.insert(documents).values(record)
  }

  async insertDocumentText(record: NewDocumentTextRecord) {
    await this.database.insert(documentTexts).values(record)
  }

  async insertIndexJob(record: NewIndexJobRecord) {
    await this.database.insert(indexJobs).values(record)
  }

  async listDocuments() {
    const rows = await this.database.select().from(documents).orderBy(desc(documents.updatedAt))

    return rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      fileType: row.fileType,
      indexStatus: row.indexStatus,
      textLength: row.textLength ?? 0,
      pageCount: row.pageCount ?? null
    }))
  }

  async loadDocumentForIndexingRecord(documentId: string) {
    const [document] = await this.database
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    const [text] = await this.database
      .select()
      .from(documentTexts)
      .where(eq(documentTexts.documentId, documentId))
      .limit(1)
    const [job] = await this.database
      .select()
      .from(indexJobs)
      .where(and(eq(indexJobs.documentId, documentId), eq(indexJobs.status, 'pending')))
      .limit(1)

    if (!document || !text || !job) {
      throw new Error(`Document ${documentId} is not ready for indexing`)
    }

    return {
      document,
      text,
      job
    }
  }

  async replaceDocumentChunks(documentId: string, chunks: NewDocumentChunkRecord[]) {
    await this.database.delete(documentChunks).where(eq(documentChunks.documentId, documentId))

    if (chunks.length > 0) {
      await this.database.insert(documentChunks).values(chunks)
    }

    await this.database
      .update(documents)
      .set({
        indexStatus: 'completed',
        updatedAt: Date.now()
      })
      .where(eq(documents.id, documentId))
  }

  async updateIndexJob(jobId: string, patch: { status: string; updatedAt?: number }) {
    await this.database.update(indexJobs).set(patch).where(eq(indexJobs.id, jobId))
  }

  async searchKeywordCandidates(query: string) {
    const rows = await this.database
      .select({
        chunkId: documentChunks.id,
        documentId: documentChunks.documentId,
        sourceLabel: documents.displayName,
        snippetText: documentChunks.chunkText,
        sectionTitle: documentChunks.sectionTitle,
        pageNumber: documentChunks.pageNumber,
        embeddingBlob: documentChunks.embeddingBlob
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documents.id, documentChunks.documentId))

    const ranked = rows
      .map((row) => {
        const keywordScore = countKeywordMatches(
          query,
          `${row.sectionTitle ?? ''}\n${row.snippetText}`
        )

        return {
          id: row.chunkId,
          documentId: row.documentId,
          sourceLabel: row.sourceLabel,
          snippetText: row.snippetText,
          sectionTitle: row.sectionTitle,
          pageNumber: row.pageNumber,
          keywordScore,
          embedding: row.embeddingBlob ? ((JSON.parse(row.embeddingBlob) as number[]) ?? []) : []
        }
      })
      .sort((left, right) => right.keywordScore - left.keywordScore)

    return ranked.slice(0, 24)
  }

  async findDocumentDetail(documentId: string) {
    const [document] = await this.database
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    const [text] = await this.database
      .select()
      .from(documentTexts)
      .where(eq(documentTexts.documentId, documentId))
      .limit(1)
    const chunks = await this.database
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId))

    if (!document || !text) {
      return null
    }

    return {
      id: document.id,
      displayName: document.displayName,
      fileType: document.fileType,
      storageUri: document.storageUri,
      pageCount: document.pageCount,
      textLength: document.textLength,
      indexStatus: document.indexStatus,
      outline: parseOutline(text.outlineJson),
      normalizedText: text.normalizedText,
      chunkCount: chunks.length
    }
  }
}
