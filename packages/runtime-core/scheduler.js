const resolvedPromise = Promise.resolve()
const syncQueue = []

export const queueSyncJob = (job) => {
  syncQueue.push(job)
  resolvedPromise.then(() => {
    const deduped = [...new Set(syncQueue)]
    syncQueue.length = 0
    deduped.forEach(job => job())
  })
}
