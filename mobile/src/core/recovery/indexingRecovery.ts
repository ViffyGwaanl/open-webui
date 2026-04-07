export function recoverIndexJob(input: {
  job: { id: string; status: string }
  document: { id: string; indexStatus: string }
}) {
  return {
    jobId: input.job.id,
    jobStatus: 'interrupted' as const,
    documentId: input.document.id,
    documentIndexStatus: 'pending' as const
  }
}
