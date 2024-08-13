import assert from 'assert'
import { execSync } from 'child_process'
import { isSha } from './util'
import semver from 'semver'

export function git (cmd: string): string {
  return execSync(`git ${cmd}`, { encoding: 'utf8' })
}

/**
 * Returns all refs for a given repository (does not include HEAD)
 * @throws {AssertionError} if `repo` or `ref` include spaces
 */
export function getCommitSha (
  repo: string,
  ref: string
): string {
  assert(!repo.includes(' '), 'repo does not include spaces')
  assert(!ref.includes(' '), 'ref does not include spaces')

  return git(`ls-remote ${repo} ${ref}`)
    .split('\t')[0]
}

/**
 * Returns all refs for a given repository
 * Does not include `HEAD`. Instead use {@link getCommitSha}
 * @throws {AssertionError} if `repo` includes spaces
 * @throws {Error} if the git command fails
 */
export function lsRemote (
  repo: string,
  type: 'refs' | 'tags' = 'refs'
): Record<string, string> {
  assert(!repo.includes(' '), 'repo does not include spaces')

  return git(`ls-remote --${type} ${repo}`)
    .split('\n')
    .reduce((obj: Record<string, string>, line: string) => {
      const [commit, refName] = line.split('\t')
      obj[refName] = commit
      return obj
    }, {})
}

/**
 * Returns all refs for a given repository (does not include HEAD)
 * @throws {AssertionError} if `ref` cannot be resolved from `repo`
 */
export function getCommitFromRef (
  repo: string,
  ref: string
): string | undefined {
  if (isSha(ref)) return ref

  let refs: Record<string, string>
  try {
    refs = lsRemote(repo)
  } catch {
    return undefined
  }

  return refs[ref] ||
    refs[`refs/${ref}`] ||
    refs[`refs/tags/${ref}^{}`] || // prefer annotated tags
    refs[`refs/tags/${ref}`] ||
    refs[`refs/heads/${ref}`]
}

/**
 * Resolves a semver range against
 * @throws {AssertionError} if `range` is not a valid semver range
 */
export function getTagCommitFromRange (
  repo: string,
  range: string
): string | undefined {
  assert(semver.validRange(range), `${range} is a valid semver range`)

  let refs: Record<string, string>
  try {
    refs = lsRemote(repo, 'tags')
  } catch {
    return undefined
  }

  const tags = Object.keys(refs)
    .map((key) => key
      .replace(/^refs\/tags\//, '')
      .replace(/\^{}$/, '') // accept annotated tags
    )
    .filter((key) => semver.valid(key, true))

  const max = semver.maxSatisfying(tags, range, true)
  return (max &&
    (refs[`refs/tags/${max}^{}`] || // prefer annotated tags
      refs[`refs/tags/${max}`])) ?? undefined
}
