const resolvedPromise = Promise.resolve()
const queue = []

export const queueJob = (job) => {
  queue.push(job)
  resolvedPromise.then(() => {
    const deduped = [...new Set(queue)]
    queue.length = 0
    deduped.forEach(job => job())
  })
}
