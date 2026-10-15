/**
 * Keeps only what a non-negative decimal can contain: digits and at most one separator (dot or comma), with no more
 * than `maxDecimals` digits after it. Anything else (letters, a minus sign, extra separators) is dropped, so typing and
 * pasting can never produce text or a negative number.
 */
export function sanitizeDecimalInput(value: string, maxDecimals: number): string {
  let result = ''
  let hasSeparator = false
  let decimals = 0

  for (const char of value) {
    if (char >= '0' && char <= '9') {
      if (hasSeparator) {
        if (decimals >= maxDecimals) {
          continue
        }
        decimals += 1
      }
      result += char
    } else if ((char === '.' || char === ',') && !hasSeparator && maxDecimals > 0) {
      hasSeparator = true
      result += char
    }
  }

  return result
}
