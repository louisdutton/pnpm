import type {
  TarballResolution,
  GitResolution,
  ResolveResult,
  PkgResolutionId,
} from '@pnpm/resolver-base'
import { type HostedPackageSpec, parsePref, type PackageSpec } from './parsePref'
import { createGitHostedPkgId } from './createGitHostedPkgId'
import { isSsh } from './util'
import { getTagCommitFromRange, getCommitFromRef, getCommitSha } from './git'

export { createGitHostedPkgId }

export type { PackageSpec }

export type GitResolver = (wantedDependency: { pref: string }) => Promise<ResolveResult | null>

export function createGitResolver (opts: unknown): GitResolver {
  return async function resolveGit (
    wantedDependency
  ): Promise<ResolveResult | null> {
    const spec = await parsePref(wantedDependency.pref)
    if (spec === null) return null

    const resolution = resolveSpec(spec)
    if (!resolution) {
      return null
    }

    const id =
      'tarball' in resolution
        ? ((resolution.path
          ? `${resolution.tarball}#path:${resolution.path}`
          : resolution.tarball) as PkgResolutionId)
        : createGitHostedPkgId(resolution)

    return {
      id,
      normalizedPref: spec.normalizedPref,
      resolution,
      resolvedVia: 'git-repository',
    }
  }
}

function resolveSpec (spec: PackageSpec | HostedPackageSpec): GitResolution | TarballResolution | undefined {
  const commit = spec.gitRange
    ? getTagCommitFromRange(spec.fetchSpec, spec.gitRange)
    : spec.gitCommittish
      ? getCommitFromRef(spec.fetchSpec, spec.gitCommittish)
      : getCommitSha(spec.fetchSpec, 'HEAD')

  if (!commit) {
    return undefined
  }

  const tarball = 'hosted' in spec &&
    // don't use tarball for private repo
    !isSsh(spec.fetchSpec) &&
    // use resolved committish
    spec.hosted.tarball({ committish: commit })

  const resolution: GitResolution | TarballResolution = tarball
    ? { tarball }
    : {
      commit,
      repo: spec.fetchSpec,
      type: 'git',
    }

  if (spec.path) {
    resolution.path = spec.path
  }
  return resolution
}
