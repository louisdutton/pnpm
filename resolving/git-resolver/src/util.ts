import assert, { AssertionError } from 'assert'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = () => any

/**
 * Executes the provided `fn`. If it throws then it will be re-executed up to the provided limit (default: 1).
 * @throws {Error} if all `retries` are exhausted
 * @throws {AssertionError} if `fn` throws one
 */
export function retry<T extends Fn> (fn: T, retries = 1): ReturnType<T> {
  assert(retries > 0, 'At least 1 retry is specified')

  for (let i = 0; i < retries + 1; i++) {
    try {
      return fn()
    } catch (err) {
      // propagate assertion errors to prevent redundant retries
      if (err instanceof AssertionError) throw err
    }
  }
  throw new Error(`All ${retries} retries were exhausted`)
}

/**
 * Returns true if the provided string is in the form of SHA-1 hash.
 */
export function isSha (str: string): boolean {
  return /^[0-9a-f]{7,40}$/.test(str)
}

/**
 * Returns true if the provided url employs the ssh protocol.
 */
export function isSsh (url: string): boolean {
  return /^((git\+)?ssh:\/\/|git@)/.test(url)
}
