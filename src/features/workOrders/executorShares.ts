/** One employee doing an estimate item, with their whole-percent share of it. */
export interface ExecutorShare {
  userId: string
  percent: number
}

const TOTAL_PERCENT = 100

/** Every executor needs at least 1%, so an item holds at most this many. */
export const MAX_EXECUTORS = TOTAL_PERCENT

/**
 * Splits `total` into whole parts in proportion to `weights` (largest remainder, so the parts always add up to `total`).
 * Every part is at least 1, which holds as long as there are no more weights than `total`.
 */
function distribute(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const ideal = weights.map((weight) => (total * weight) / weightSum)
  const parts = ideal.map(Math.floor)

  const byRemainder = ideal
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
  let left = total - parts.reduce((sum, part) => sum + part, 0)

  for (const { index } of byRemainder) {
    if (left <= 0) {
      break
    }
    parts[index] += 1
    left -= 1
  }

  // A tiny weight can round down to nothing: lift it to 1 and take that from the biggest share.
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index] < 1) {
      const biggest = parts.indexOf(Math.max(...parts))
      parts[biggest] -= 1
      parts[index] = 1
    }
  }

  return parts
}

/** Splits 100 equally; any remainder goes to the first ones (3 people: 34/33/33). */
export function equalShares(userIds: string[]): ExecutorShare[] {
  if (userIds.length === 0) {
    return []
  }

  const parts = distribute(TOTAL_PERCENT, userIds.map(() => 1))

  return userIds.map((userId, index) => ({ userId, percent: parts[index] }))
}

/** The shares all add up to 100, so an item with executors never has an invalid split. */
function withShares(shares: ExecutorShare[], total: number, weights: number[]): ExecutorShare[] {
  const parts = distribute(total, weights)

  return shares.map((share, index) => ({ ...share, percent: parts[index] }))
}

/** Adds an employee with an equal share; the others shrink in proportion to what they had. */
export function addExecutor(shares: ExecutorShare[], userId: string): ExecutorShare[] {
  if (shares.some((share) => share.userId === userId)) {
    return shares
  }

  if (shares.length === 0) {
    return [{ userId, percent: TOTAL_PERCENT }]
  }

  const newShare = Math.floor(TOTAL_PERCENT / (shares.length + 1))
  const others = withShares(shares, TOTAL_PERCENT - newShare, shares.map((share) => share.percent))

  return [...others, { userId, percent: newShare }]
}

/** Removes an employee; what they had goes to the others in proportion to their shares. */
export function removeExecutor(shares: ExecutorShare[], userId: string): ExecutorShare[] {
  const rest = shares.filter((share) => share.userId !== userId)

  if (rest.length === shares.length || rest.length === 0) {
    return rest
  }

  return withShares(rest, TOTAL_PERCENT, rest.map((share) => share.percent))
}
