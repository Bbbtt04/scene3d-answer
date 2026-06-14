export function createId(prefix = 'id') {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  const uuid = cryptoApi?.randomUUID?.()

  if (uuid) {
    return uuid
  }

  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)

  return `${prefix}-${timestamp}-${random}`
}
